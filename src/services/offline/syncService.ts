import { ApiError } from '@/services/apiClient';
import { SYNCED_SALE_RETENTION_DAYS } from '@/services/offline/constants';
import { refreshOfflineProductsFromServer } from '@/services/offline/offlineProductsSync';
import {
  getUnsyncedSales,
  markSaleFailed,
  markSaleSynced,
  markSaleSyncing,
  purgeSyncedSalesOlderThan,
} from '@/services/offline/pendingSalesDb';
import {
  createPosOrder,
  payPosOrder,
  resolvePayOrderIrn,
  resolvePayOrderReference,
} from '@/services/posService';
import { ensureSalesSession } from '@/services/sessionService';
import { isOnlineNow } from '@/store/connectivityStore';
import { usePendingSalesStore } from '@/store/pendingSalesStore';
import type { PendingSale } from '@/types/offline';
import { getApiErrorMessage } from '@/utils/apiHelpers';

/**
 * A 502 means the request reached our backend, which then failed talking to an
 * upstream (e.g. EIRMS). The sale has already hit the server — retrying risks a
 * duplicate order (the server rejects reused order_numbers), so treat it as synced
 * rather than endlessly retrying into that dead end.
 */
function isGatewayError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 502;
}

export interface SyncResult {
  attempted: number;
  synced: number;
  failed: number;
  skipped: boolean;
}

let syncInFlight: Promise<SyncResult> | null = null;

async function syncOne(sale: PendingSale, sessionId: string): Promise<void> {
  await markSaleSyncing(sale.id);

  // Inject the real session id — the queued payload carries a placeholder.
  const payload = { ...sale.payload, session_id: sessionId };

  const order = await createPosOrder(payload);
  const orderUuid = order.uuid ?? order.id;
  if (!orderUuid) {
    throw new Error('Server did not return an order id');
  }

  const payResult = await payPosOrder(String(orderUuid), {
    payments: sale.payments,
  });

  const invoiceNumber =
    payResult.invoice_number ??
    payResult.invoiceNumber ??
    order.invoice_number ??
    null;
  const irn = resolvePayOrderIrn(payResult) ?? null;
  const receiptNumber = resolvePayOrderReference(payResult) ?? null;

  await markSaleSynced(sale.id, invoiceNumber ?? receiptNumber, irn);
}

/**
 * Drain the offline sales outbox against the live API. FIFO, one sale at a time so
 * failures are isolated. Idempotent: the server dedups on the queued order_number.
 * Concurrent calls share a single in-flight run.
 */
export async function syncPendingSales(): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async (): Promise<SyncResult> => {
    if (!isOnlineNow()) {
      return { attempted: 0, synced: 0, failed: 0, skipped: true };
    }

    const pending = (await getUnsyncedSales()).filter((s) => s.status === 'PENDING');
    if (pending.length === 0) {
      await purgeSyncedSalesOlderThan(SYNCED_SALE_RETENTION_DAYS);
      return { attempted: 0, synced: 0, failed: 0, skipped: false };
    }

    let sessionId: string;
    try {
      sessionId = await ensureSalesSession();
    } catch {
      // Can't get a session (e.g. auth expired) — leave everything PENDING and retry later.
      return { attempted: 0, synced: 0, failed: 0, skipped: true };
    }

    let synced = 0;
    let failed = 0;

    for (const sale of pending) {
      if (!isOnlineNow()) break;
      try {
        await syncOne(sale, sessionId);
        synced += 1;
      } catch (error) {
        if (isGatewayError(error)) {
          await markSaleSynced(
            sale.id,
            null,
            null,
            `Synced without fiscal confirmation — gateway error: ${getApiErrorMessage(error)}`
          );
          synced += 1;
        } else {
          await markSaleFailed(sale.id, getApiErrorMessage(error));
          failed += 1;
        }
      }
    }

    await purgeSyncedSalesOlderThan(SYNCED_SALE_RETENTION_DAYS);
    return { attempted: pending.length, synced, failed, skipped: false };
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
    // Keep the reactive store in step with what just changed.
    void usePendingSalesStore.getState().refresh();
    // Background: refresh cached offline catalog from live product API.
    void refreshOfflineProductsFromServer().catch(() => undefined);
  }
}

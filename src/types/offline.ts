import type { CreatePosOrderPayload, PosPaymentPayload } from '@/types/api';
import type { ReceiptData } from '@/types/receipt';

export type PendingSaleStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface PendingSale {
  id: number;
  /** Client-generated idempotency key, also used as the order_number sent to the server. */
  clientUuid: string;
  orderNumber: string;
  total: number;
  status: PendingSaleStatus;
  /** True once the sale has been accepted by the server. Mirrors status === 'SYNCED'. */
  synced: boolean;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  syncedAt: string | null;
  /** Server-assigned values, populated after a successful sync. */
  serverInvoiceNumber: string | null;
  serverIrn: string | null;
  /** Set when synced without full fiscal confirmation (e.g. a 502 from the invoicing gateway). */
  syncedNote: string | null;
  /** Order payload (session_id is a placeholder; a real one is injected at sync time). */
  payload: CreatePosOrderPayload;
  /** Payment lines to replay against the pay endpoint. */
  payments: PosPaymentPayload[];
  /** Provisional receipt captured at sale time, for reprint before/after sync. */
  receipt: ReceiptData;
}

export interface EnqueuePendingSaleInput {
  clientUuid: string;
  orderNumber: string;
  total: number;
  /** GPS (preferred) ISO timestamp used for the sale row and receipt. */
  createdAt: string;
  payload: CreatePosOrderPayload;
  payments: PosPaymentPayload[];
  receipt: ReceiptData;
}

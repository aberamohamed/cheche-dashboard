import { getOfflineDatabase as getDb } from '@/services/offline/db';
import type {
  EnqueuePendingSaleInput,
  PendingSale,
  PendingSaleStatus,
} from '@/types/offline';

type PendingSaleRow = {
  id: number;
  client_uuid: string;
  order_number: string;
  total: number;
  status: PendingSaleStatus;
  synced: number;
  attempts: number;
  last_error: string | null;
  created_at: string;
  synced_at: string | null;
  server_invoice_number: string | null;
  server_irn: string | null;
  synced_note: string | null;
  payload: string;
  payments: string;
  receipt: string;
};

function mapRow(row: PendingSaleRow): PendingSale {
  return {
    id: row.id,
    clientUuid: row.client_uuid,
    orderNumber: row.order_number,
    total: row.total,
    status: row.status,
    synced: row.synced === 1,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
    serverInvoiceNumber: row.server_invoice_number,
    serverIrn: row.server_irn,
    syncedNote: row.synced_note,
    payload: JSON.parse(row.payload),
    payments: JSON.parse(row.payments),
    receipt: JSON.parse(row.receipt),
  };
}

export async function insertPendingSale(input: EnqueuePendingSaleInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO pending_sales
       (client_uuid, order_number, total, status, attempts, created_at, payload, payments, receipt)
     VALUES (?, ?, ?, 'PENDING', 0, ?, ?, ?, ?)`,
    input.clientUuid,
    input.orderNumber,
    input.total,
    input.createdAt,
    JSON.stringify(input.payload),
    JSON.stringify(input.payments),
    JSON.stringify(input.receipt)
  );
}

export async function getAllPendingSales(): Promise<PendingSale[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PendingSaleRow>(
    `SELECT * FROM pending_sales ORDER BY id ASC`
  );
  return rows.map(mapRow);
}

/** Sales still needing to reach the server (not yet SYNCED), oldest first. */
export async function getUnsyncedSales(): Promise<PendingSale[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PendingSaleRow>(
    `SELECT * FROM pending_sales WHERE status != 'SYNCED' ORDER BY id ASC`
  );
  return rows.map(mapRow);
}

export async function countUnsyncedSales(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM pending_sales WHERE status != 'SYNCED'`
  );
  return row?.count ?? 0;
}

export async function markSaleSyncing(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE pending_sales SET status = 'SYNCING', last_error = NULL WHERE id = ?`,
    id
  );
}

export async function markSaleSynced(
  id: number,
  serverInvoiceNumber: string | null,
  serverIrn: string | null,
  syncedNote: string | null = null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE pending_sales
       SET status = 'SYNCED', synced = 1, synced_at = ?, server_invoice_number = ?, server_irn = ?,
           synced_note = ?, last_error = NULL
     WHERE id = ?`,
    new Date().toISOString(),
    serverInvoiceNumber,
    serverIrn,
    syncedNote,
    id
  );
}

export async function markSaleFailed(id: number, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE pending_sales
       SET status = 'FAILED', attempts = attempts + 1, last_error = ?
     WHERE id = ?`,
    error,
    id
  );
}

/** Reset a FAILED sale back to PENDING so it is picked up on the next sync pass. */
export async function retrySale(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE pending_sales SET status = 'PENDING', last_error = NULL WHERE id = ? AND status = 'FAILED'`,
    id
  );
}

/** Remove SYNCED sales older than the retention window to keep the table small. */
export async function purgeSyncedSalesOlderThan(days: number): Promise<void> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  await db.runAsync(
    `DELETE FROM pending_sales WHERE status = 'SYNCED' AND synced_at IS NOT NULL AND synced_at < ?`,
    cutoff
  );
}

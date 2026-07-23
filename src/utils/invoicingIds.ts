import type { TransactionDetail } from '@/types/transactionDetail';

/** ID expected by `/invoicing/{id}/memo`, cancel-eims, etc. */
export function resolveInvoicingApiId(
  detail: Pick<TransactionDetail, 'invoiceUuid' | 'recordId'> | null | undefined
): string | null {
  if (!detail?.invoiceUuid) return null;
  return detail.invoiceUuid;
}

/** ID for retry-eims — prefer invoice UUID, fall back to record id. */
export function resolveInvoicingRetryId(
  detail: Pick<TransactionDetail, 'invoiceUuid' | 'recordId'> | null | undefined
): string | null {
  if (!detail) return null;
  return detail.invoiceUuid ?? detail.recordId ?? null;
}

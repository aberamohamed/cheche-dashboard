import type { TransactionDetail } from '@/types/transactionDetail';
import { areInvoicingDocumentActionsDisabled } from '@/utils/transactionStatus';

export function getInvoiceRemainingBalance(paidAmount: number, totalAmount: number): number {
  return Math.max(0, totalAmount - paidAmount);
}

export function canUsePartialPaymentCoverage(
  paidAmount: number,
  totalAmount: number,
  status?: string
): boolean {
  const remaining = getInvoiceRemainingBalance(paidAmount, totalAmount);
  const normalizedStatus = (status ?? '').toLowerCase();
  const hasPriorCollection = paidAmount > 0.01 || normalizedStatus.includes('partial');
  return hasPriorCollection && remaining < totalAmount - 0.01;
}

export function isInvoicePayable(detail: TransactionDetail | null | undefined): boolean {
  if (!detail?.recordId) return false;
  if (areInvoicingDocumentActionsDisabled(detail.status, detail.eirmsStatus)) return false;

  const status = (detail.status ?? '').toLowerCase();
  if (
    status === 'paid' ||
    (status.includes('paid') && !status.includes('partial') && !status.includes('unpaid'))
  ) {
    return false;
  }

  const remaining = getInvoiceRemainingBalance(detail.paidAmount, detail.total);
  if (remaining > 0.01) return true;

  return (
    status.includes('unpaid') ||
    status.includes('partial') ||
    status === 'pending' ||
    status === 'partially_paid'
  );
}

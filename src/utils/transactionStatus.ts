function normalizeStatus(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

export function isCancelledDocumentStatus(status?: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === 'cancelled' || normalized === 'canceled';
}

export function isFailedDocumentStatus(status?: string): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized.includes('fail') ||
    normalized.includes('cancel') ||
    normalized.includes('void')
  );
}

export function isFailedEirmsStatus(status?: string): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('reject')
  );
}

export function areInvoicingDocumentActionsDisabled(status?: string, eirmsStatus?: string): boolean {
  return isFailedDocumentStatus(status) || isFailedEirmsStatus(eirmsStatus);
}

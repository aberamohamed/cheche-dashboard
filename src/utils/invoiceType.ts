export function normalizeInvoiceType(type?: string): string {
  return (type ?? 'invoice').toLowerCase().replace(/_/g, ' ').trim();
}

export function isCreditNoteType(type?: string): boolean {
  const normalized = normalizeInvoiceType(type);
  return normalized.includes('credit') || normalized === 'cre';
}

export function isDebitNoteType(type?: string): boolean {
  const normalized = normalizeInvoiceType(type);
  return normalized.includes('debit') || normalized === 'dbe' || normalized === 'deb';
}

export function isStandardInvoiceType(type?: string): boolean {
  return !isCreditNoteType(type) && !isDebitNoteType(type);
}

export const PHONE_COUNTRY_CODE = '+251';

/** Local digits only — user enters 9XXXXXXXX */
export function stripToLocalPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('251')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function normalizePhone(phone: string): string {
  const local = stripToLocalPhone(phone.trim());
  if (/^9\d{8}$/.test(local)) return `${PHONE_COUNTRY_CODE}${local}`;
  const trimmed = phone.trim().replace(/\s/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('251')) return `+${trimmed}`;
  if (trimmed.startsWith('0')) return `${PHONE_COUNTRY_CODE}${trimmed.slice(1)}`;
  return trimmed;
}

export function isValidLocalPhone(local: string): boolean {
  return /^9\d{8}$/.test(stripToLocalPhone(local));
}

export function formatPhoneForApi(local: string): string {
  return normalizePhone(local);
}

/** Local display/API format used by sales customer endpoints (e.g. 0912345678). */
export function formatPhoneForCustomerApi(phone?: string): string | undefined {
  const trimmed = phone?.trim();
  if (!trimmed) return undefined;

  const local = stripToLocalPhone(trimmed);
  if (/^9\d{8}$/.test(local)) return `0${local}`;
  if (/^0\d{9}$/.test(trimmed.replace(/\s/g, ''))) return trimmed.replace(/\s/g, '');
  if (trimmed.startsWith('+251')) return `0${trimmed.slice(4).replace(/\D/g, '')}`;
  return trimmed;
}

import type { User } from '@/types';
import { encryptQRData } from '@/utils/crypto';
import { formatPhoneForCustomerApi, stripToLocalPhone } from '@/utils/phone';

export function getUserDisplayPhone(phone?: string): string {
  if (!phone?.trim()) return '';
  const formatted = formatPhoneForCustomerApi(phone);
  if (formatted) return formatted;
  const local = stripToLocalPhone(phone);
  if (/^9\d{8}$/.test(local)) return `0${local}`;
  return phone.trim();
}

export function buildEncryptedProfileQrPayload(user: Pick<User, 'id' | 'phone' | 'fullName'>): string {
  const qrData = JSON.stringify({
    mobile: getUserDisplayPhone(user.phone) || user.phone,
    name: user.fullName.trim(),
    userId: user.id,
  });
  return encryptQRData(qrData);
}

import {
  buildTaxDocumentShareMessage,
  getTaxDocumentShareUrl,
} from '@/services/receiptService';
import type { ReceiptData } from '@/types/receipt';
import { normalizePhone } from '@/utils/phone';
import { Linking, Platform } from 'react-native';

export type ShareChannel = 'sms' | 'whatsapp' | 'telegram' | 'email';

function toInternationalPhoneDigits(phone?: string): string | undefined {
  if (!phone?.trim()) return undefined;
  return normalizePhone(phone).replace(/\D/g, '');
}

export async function shareDocumentVia(
  channel: ShareChannel,
  data: ReceiptData,
  options?: { phone?: string; email?: string }
): Promise<void> {
  const message = buildTaxDocumentShareMessage(data);
  const url = getTaxDocumentShareUrl(data);
  const phoneDigits = toInternationalPhoneDigits(options?.phone);
  const email = options?.email?.trim();

  switch (channel) {
    case 'sms': {
      const separator = Platform.OS === 'ios' ? '&' : '?';
      const recipient = phoneDigits ? `+${phoneDigits}` : '';
      if (recipient) {
        await Linking.openURL(
          `sms:${recipient}${separator}body=${encodeURIComponent(message)}`
        );
      } else {
        await Linking.openURL(`sms:${separator}body=${encodeURIComponent(message)}`);
      }
      return;
    }
    case 'whatsapp': {
      const encoded = encodeURIComponent(message);
      const deepLink = phoneDigits
        ? `whatsapp://send?phone=${phoneDigits}&text=${encoded}`
        : `whatsapp://send?text=${encoded}`;
      const webLink = phoneDigits
        ? `https://wa.me/${phoneDigits}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      const canOpen = await Linking.canOpenURL(deepLink).catch(() => false);
      await Linking.openURL(canOpen ? deepLink : webLink);
      return;
    }
    case 'telegram': {
      const text = `Tax document for ${data.invoiceNumber}`;
      await Linking.openURL(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      );
      return;
    }
    case 'email': {
      const subject = encodeURIComponent(`Tax document for ${data.invoiceNumber}`);
      const body = encodeURIComponent(message);
      const recipient = email ? encodeURIComponent(email) : '';
      await Linking.openURL(`mailto:${recipient}?subject=${subject}&body=${body}`);
      return;
    }
  }
}

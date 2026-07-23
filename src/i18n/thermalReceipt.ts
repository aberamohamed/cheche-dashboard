import { resolveLanguageId, type LanguageId } from '@/data/languages';
import { getCheckoutStrings } from '@/i18n/checkout';

export interface ThermalReceiptStrings {
  colItem: string;
  colQty: string;
  colPrice: string;
  colTotal: string;
  invoice: string;
  operator: string;
  customer: string;
  phone: string;
  customerEmpty: string;
  subtotal: string;
  discount: string;
  serviceCharge: string;
  change: string;
  total: string;
  txbl1: string;
  tax1: string;
  tax1Percent: (rate: number) => string;
  addressNotProvided: string;
  poweredBy: string;
  brandName: string;
  defaultCash: string;
  invoiceBanner: (paymentMethod: string) => string;
  irnPrefix: string;
}

function buildStrings(
  partial: Omit<
    ThermalReceiptStrings,
    'tax1Percent' | 'invoiceBanner'
  > & {
    invoiceBannerSuffix: string;
  }
): ThermalReceiptStrings {
  return {
    ...partial,
    tax1Percent: (rate) => `${partial.tax1} ${rate}%`,
    invoiceBanner: (paymentMethod) =>
      `${paymentMethod.trim() || partial.defaultCash} ${partial.invoiceBannerSuffix}`.toUpperCase(),
  };
}

const en = buildStrings({
  colItem: 'Item',
  colQty: 'Qty',
  colPrice: 'Price',
  colTotal: 'Total',
  invoice: 'Invoice',
  operator: 'Operator',
  customer: 'Customer',
  phone: 'Phone',
  customerEmpty: 'Walking Customer',
  subtotal: 'SUBTOTAL',
  discount: 'DISCOUNT',
  serviceCharge: 'Service Chrg',
  change: 'CHANGE',
  total: 'TOTAL',
  txbl1: 'TXBL1',
  tax1: 'TAX1',
  addressNotProvided: 'Address not provided',
  poweredBy: 'Powered By:',
  brandName: 'CHECHE POS',
  defaultCash: 'Cash',
  invoiceBannerSuffix: 'Invoice',
  irnPrefix: 'IRN',
});

const am = buildStrings({
  colItem: 'ዕቃ',
  colQty: 'ብዛት',
  colPrice: 'ዋጋ',
  colTotal: 'ጠቅላላ',
  invoice: 'ደረሰኝ',
  operator: 'ኦፐሬተር',
  customer: 'ደንበኛ',
  phone: 'ስልክ',
  customerEmpty: 'Walking Customer',
  subtotal: 'ንዑስ ድምር',
  discount: 'ቅናሽ',
  serviceCharge: 'የአገልግሎት ክፍያ',
  change: 'መልስ',
  total: 'ጠቅላላ',
  txbl1: 'TXBL1',
  tax1: 'TAX1',
  addressNotProvided: 'አድራሻ አልተሰጠም',
  poweredBy: 'Powered By:',
  brandName: 'CHECHE POS',
  defaultCash: 'ጥሬ ገንዘብ',
  invoiceBannerSuffix: 'ደረሰኝ',
  irnPrefix: 'IRN',
});

const om = buildStrings({
  colItem: 'Meeshaa',
  colQty: 'Baay\'ina',
  colPrice: 'Gatii',
  colTotal: 'Ida\'ama',
  invoice: 'Rasiitii',
  operator: 'Hojjetaa',
  customer: 'Maamila',
  phone: 'Bilbila',
  customerEmpty: 'Walking Customer',
  subtotal: 'SUBTOTAL',
  discount: 'Hir\'isuu',
  serviceCharge: 'Kaffaltii Tajaajilaa',
  change: 'Deebii',
  total: 'IDAA\'AMA',
  txbl1: 'TXBL1',
  tax1: 'TAX1',
  addressNotProvided: 'Teessoon hin kennamne',
  poweredBy: 'Powered By:',
  brandName: 'CHECHE POS',
  defaultCash: 'Maallaqa',
  invoiceBannerSuffix: 'Invoice',
  irnPrefix: 'IRN',
});

const ti = buildStrings({
  colItem: 'ዕቃ',
  colQty: 'ብዝሒ',
  colPrice: 'ዋጋ',
  colTotal: 'ጠቕላላ',
  invoice: 'ደረሰኝ',
  operator: 'ኦፐሬተር',
  customer: 'ዓሚል',
  phone: 'ቴሌፎን',
  customerEmpty: 'Walking Customer',
  subtotal: 'SUBTOTAL',
  discount: 'ቅናሽ',
  serviceCharge: 'ክፍሊት ኣገልግሎት',
  change: 'መልሲ',
  total: 'TOTAL',
  txbl1: 'TXBL1',
  tax1: 'TAX1',
  addressNotProvided: 'ኣድራሻ ኣይተሃበን',
  poweredBy: 'Powered By:',
  brandName: 'CHECHE POS',
  defaultCash: 'ጥሬ ገንዘብ',
  invoiceBannerSuffix: 'Invoice',
  irnPrefix: 'IRN',
});

const so = buildStrings({
  colItem: 'Alaab',
  colQty: 'Tirada',
  colPrice: 'Qiimo',
  colTotal: 'Wadarta',
  invoice: 'Rasiid',
  operator: 'Hawlgale',
  customer: 'Macmiil',
  phone: 'Telefoon',
  customerEmpty: 'Walking Customer',
  subtotal: 'SUBTOTAL',
  discount: 'Dhimis',
  serviceCharge: 'Kharash Adeeg',
  change: 'Haraag',
  total: 'TOTAL',
  txbl1: 'TXBL1',
  tax1: 'TAX1',
  addressNotProvided: 'Cinwaan lama bixin',
  poweredBy: 'Powered By:',
  brandName: 'CHECHE POS',
  defaultCash: 'Lacag caddaan',
  invoiceBannerSuffix: 'Invoice',
  irnPrefix: 'IRN',
});

const TRANSLATIONS: Record<LanguageId, ThermalReceiptStrings> = {
  en,
  am,
  om,
  ti,
  so,
};

export function getThermalReceiptStrings(languageId: string): ThermalReceiptStrings {
  return TRANSLATIONS[resolveLanguageId(languageId)];
}

export function resolveReceiptPaymentLabel(
  method: string | undefined,
  languageId: string
): string {
  const checkout = getCheckoutStrings(languageId);
  const raw = method?.trim();
  if (!raw) return checkout.cash;
  if (/^cash$/i.test(raw)) return checkout.cash;
  return raw;
}

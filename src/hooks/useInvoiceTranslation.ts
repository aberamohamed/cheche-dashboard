import { getInvoiceStrings, type InvoiceStrings } from '@/i18n/invoice';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemo } from 'react';

export function useInvoiceTranslation(): InvoiceStrings {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => getInvoiceStrings(language), [language]);
}

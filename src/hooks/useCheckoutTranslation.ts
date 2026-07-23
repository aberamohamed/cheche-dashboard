import { getCheckoutStrings, type CheckoutStrings } from '@/i18n/checkout';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemo } from 'react';

export function useCheckoutTranslation(): CheckoutStrings {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => getCheckoutStrings(language), [language]);
}

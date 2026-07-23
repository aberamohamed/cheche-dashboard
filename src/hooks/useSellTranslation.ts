import { getSellStrings, sellCheckoutLabel, type SellStrings } from '@/i18n/sell';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemo } from 'react';

export function useSellTranslation(): SellStrings & {
  checkoutLabel: (count: number) => string;
} {
  const language = useSettingsStore((s) => s.language);
  const strings = useMemo(() => getSellStrings(language), [language]);

  return useMemo(
    () => ({
      ...strings,
      checkoutLabel: (count: number) => sellCheckoutLabel(strings, count),
    }),
    [strings]
  );
}

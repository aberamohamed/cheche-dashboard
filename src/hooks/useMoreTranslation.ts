import { getMoreStrings, type MoreStrings } from '@/i18n/more';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemo } from 'react';

export function useMoreTranslation(): MoreStrings {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => getMoreStrings(language), [language]);
}

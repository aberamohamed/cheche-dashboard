import { getHomeStrings, type HomeStrings } from '@/i18n/home';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemo } from 'react';

export function useHomeTranslation(): HomeStrings {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => getHomeStrings(language), [language]);
}

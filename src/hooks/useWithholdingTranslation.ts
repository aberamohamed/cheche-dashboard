import { getWithholdingStrings, type WithholdingStrings } from '@/i18n/withholding';
import { useSettingsStore } from '@/store/settingsStore';
import { useMemo } from 'react';

export function useWithholdingTranslation(): WithholdingStrings {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => getWithholdingStrings(language), [language]);
}

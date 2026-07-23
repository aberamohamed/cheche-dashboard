import { useSettingsStore } from '@/store/settingsStore';

/** When true, Home / headers / filter modal use the gradient theme. */
export function useDarkMode(): boolean {
  return useSettingsStore((s) => s.darkMode ?? false);
}

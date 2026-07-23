import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SETTINGS_KEY = 'cheche_settings';

export interface AppSettings {
  language: string;
  darkMode: boolean;
  pushNotifications: boolean;
  lowStockAlerts: boolean;
  salesReports: boolean;
  soundEffects: boolean;
  cameraAccess: boolean;
  bluetoothPrinter: boolean;
  /** Master switch: allow completing sales while offline (cash only) and queue them locally. */
  offlineModeEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  darkMode: false,
  pushNotifications: true,
  lowStockAlerts: true,
  salesReports: false,
  soundEffects: true,
  cameraAccess: true,
  bluetoothPrinter: false,
  offlineModeEnabled: false,
};

interface SettingsState extends AppSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

async function persistSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        set({ ...DEFAULT_SETTINGS, ...parsed, hydrated: true });
        return;
      }
    } catch {
      // ignore
    }
    set({ hydrated: true });
  },

  setLanguage: async (language) => {
    const next = { ...get(), language };
    await persistSettings(next);
    set({ language });
  },

  updateSetting: async (key, value) => {
    const state = get();
    const next = { ...state, [key]: value };
    await persistSettings(next);
    set({ [key]: value } as Partial<SettingsState>);
  },
}));

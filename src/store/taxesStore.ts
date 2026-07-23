import { getTaxes, type TaxOption } from '@/services/productService';
import { readOfflineCache, writeOfflineCache } from '@/utils/offlineCache';
import { create } from 'zustand';

const CACHE_KEY = 'taxes';

interface TaxesState {
  taxes: TaxOption[];
  isLoaded: boolean;
  isFetching: boolean;
  fetchTaxes: () => Promise<TaxOption[]>;
  prefetchTaxes: () => void;
  clear: () => void;
}

export const useTaxesStore = create<TaxesState>((set, get) => ({
  taxes: [],
  isLoaded: false,
  isFetching: false,

  fetchTaxes: async () => {
    if (get().isFetching) return get().taxes;

    set({ isFetching: true });
    try {
      const taxes = await getTaxes();
      set({ taxes, isLoaded: true });
      void writeOfflineCache(CACHE_KEY, taxes);
      return taxes;
    } catch {
      // Offline / request failed — fall back to the last cached taxes.
      if (get().taxes.length === 0) {
        const cached = await readOfflineCache<TaxOption[]>(CACHE_KEY);
        if (cached?.length) {
          set({ taxes: cached, isLoaded: true });
          return cached;
        }
      }
      return get().taxes;
    } finally {
      set({ isFetching: false });
    }
  },

  prefetchTaxes: () => {
    void get().fetchTaxes();
  },

  clear: () => set({ taxes: [], isLoaded: false, isFetching: false }),
}));

import { getPaymentMethods } from '@/services/posService';
import type { ApiPaymentMethod } from '@/types/api';
import { readOfflineCache, writeOfflineCache } from '@/utils/offlineCache';
import { create } from 'zustand';

const CACHE_KEY = 'payment_methods';

interface PaymentMethodsState {
  methods: ApiPaymentMethod[];
  isLoaded: boolean;
  isFetching: boolean;
  fetchPaymentMethods: () => Promise<ApiPaymentMethod[]>;
  prefetchPaymentMethods: () => void;
  clear: () => void;
}

export const usePaymentMethodsStore = create<PaymentMethodsState>((set, get) => ({
  methods: [],
  isLoaded: false,
  isFetching: false,

  fetchPaymentMethods: async () => {
    if (get().isFetching) return get().methods;

    set({ isFetching: true });
    try {
      const methods = await getPaymentMethods();
      set({ methods, isLoaded: true });
      void writeOfflineCache(CACHE_KEY, methods);
      return methods;
    } catch {
      // Offline / request failed — fall back to the last cached list so checkout still works.
      if (get().methods.length === 0) {
        const cached = await readOfflineCache<ApiPaymentMethod[]>(CACHE_KEY);
        if (cached?.length) {
          set({ methods: cached, isLoaded: true });
          return cached;
        }
      }
      return get().methods;
    } finally {
      set({ isFetching: false });
    }
  },

  prefetchPaymentMethods: () => {
    void get().fetchPaymentMethods();
  },

  clear: () => set({ methods: [], isLoaded: false, isFetching: false }),
}));

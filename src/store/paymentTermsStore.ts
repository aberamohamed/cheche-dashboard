import { getPaymentTerms } from '@/services/posService';
import type { ApiPaymentTerm } from '@/types/api';
import { create } from 'zustand';

interface PaymentTermsState {
  terms: ApiPaymentTerm[];
  isLoaded: boolean;
  isFetching: boolean;
  fetchPaymentTerms: () => Promise<ApiPaymentTerm[]>;
  prefetchPaymentTerms: () => void;
  clear: () => void;
}

export const usePaymentTermsStore = create<PaymentTermsState>((set, get) => ({
  terms: [],
  isLoaded: false,
  isFetching: false,

  fetchPaymentTerms: async () => {
    if (get().isFetching) return get().terms;

    set({ isFetching: true });
    try {
      const terms = await getPaymentTerms();
      set({ terms, isLoaded: true });
      return terms;
    } catch {
      return get().terms;
    } finally {
      set({ isFetching: false });
    }
  },

  prefetchPaymentTerms: () => {
    void get().fetchPaymentTerms();
  },

  clear: () => set({ terms: [], isLoaded: false, isFetching: false }),
}));

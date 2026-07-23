import {
  addOfflineProduct,
  backfillOfflineProductTaxes,
  getOfflineProductIds,
  getOfflineProducts,
  removeOfflineProduct,
} from '@/services/offline/offlineProductsDb';
import type { TaxOption } from '@/services/productService';
import type { Product } from '@/types';
import { create } from 'zustand';

interface OfflineProductsState {
  /** Full offline catalog — the source for the Sell tab while offline. */
  products: Product[];
  /** Ids currently registered offline (for Add/Remove toggle state). */
  ids: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (product: Product, taxes?: TaxOption[]) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  /** Fill missing tax snapshots using the current taxes catalog. */
  backfillTaxes: (taxes: TaxOption[]) => Promise<void>;
}

export const useOfflineProductsStore = create<OfflineProductsState>((set) => ({
  products: [],
  ids: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const [products, ids] = await Promise.all([getOfflineProducts(), getOfflineProductIds()]);
      set({ products, ids, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  add: async (product, taxes = []) => {
    await addOfflineProduct(product, taxes);
    await useOfflineProductsStore.getState().refresh();
  },

  remove: async (productId) => {
    await removeOfflineProduct(productId);
    await useOfflineProductsStore.getState().refresh();
  },

  backfillTaxes: async (taxes) => {
    const updated = await backfillOfflineProductTaxes(taxes);
    if (updated > 0) {
      await useOfflineProductsStore.getState().refresh();
    }
  },
}));

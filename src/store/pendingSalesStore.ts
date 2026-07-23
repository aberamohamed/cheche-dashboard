import {
  countUnsyncedSales,
  getAllPendingSales,
  retrySale as retrySaleInDb,
} from '@/services/offline/pendingSalesDb';
import type { PendingSale } from '@/types/offline';
import { create } from 'zustand';

interface PendingSalesState {
  sales: PendingSale[];
  unsyncedCount: number;
  loading: boolean;
  /** Reload the full list (used by the report screen). */
  refresh: () => Promise<void>;
  /** Cheap refresh of just the badge count. */
  refreshCount: () => Promise<void>;
  retrySale: (id: number) => Promise<void>;
}

export const usePendingSalesStore = create<PendingSalesState>((set) => ({
  sales: [],
  unsyncedCount: 0,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const sales = await getAllPendingSales();
      const unsyncedCount = sales.filter((s) => s.status !== 'SYNCED').length;
      set({ sales, unsyncedCount, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  refreshCount: async () => {
    try {
      const unsyncedCount = await countUnsyncedSales();
      set({ unsyncedCount });
    } catch {
      // ignore
    }
  },

  retrySale: async (id) => {
    await retrySaleInDb(id);
    await usePendingSalesStore.getState().refresh();
  },
}));

import type { Product } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'cheche_recent_products';
const MAX_RECENT = 50;

interface RecentProductsState {
  products: Product[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addProducts: (products: Product[]) => Promise<void>;
  clear: () => Promise<void>;
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    variants: undefined,
  };
}

async function persistProducts(products: Product[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

export const useRecentProductsStore = create<RecentProductsState>((set, get) => ({
  products: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const products = raw ? (JSON.parse(raw) as Product[]) : [];
      set({ products: Array.isArray(products) ? products : [], hydrated: true });
    } catch {
      set({ products: [], hydrated: true });
    }
  },

  addProducts: async (incoming) => {
    const normalized = incoming
      .filter((product) => product.productId)
      .map(normalizeProduct);

    if (normalized.length === 0) return;

    const incomingIds = new Set(normalized.map((product) => product.productId));
    const remaining = get().products.filter((product) => !incomingIds.has(product.productId));
    const merged = [...normalized, ...remaining].slice(0, MAX_RECENT);

    set({ products: merged, hydrated: true });
    await persistProducts(merged);
  },

  clear: async () => {
    set({ products: [], hydrated: true });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));

export function recordSoldProducts(products: Product[]): void {
  void useRecentProductsStore.getState().addProducts(products);
}

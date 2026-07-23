import type { CartItem, CustomerRecord, Product } from '@/types';
import { createOpenAmountProduct } from '@/utils/customAmountProduct';
import { create } from 'zustand';

export type CheckoutSource = 'cart' | 'keypad';

export interface KeypadCheckoutLine {
  amount: number;
  /** POS product UUID sent as `product_id` on order lines (same as cart `product.productId`). */
  serviceId?: string;
  serviceName?: string;
  serviceUomId?: string;
  serviceTaxesIds?: string[];
  note?: string;
  quantity?: number;
}

function keypadLineKey(line: KeypadCheckoutLine): string {
  if (line.serviceId) return `service:${line.serviceId}:${line.amount}`;
  const note = line.note?.trim() ?? '';
  return `custom:${note}:${line.amount}`;
}

export function mergeKeypadLines(lines: KeypadCheckoutLine[]): KeypadCheckoutLine[] {
  const merged = new Map<string, KeypadCheckoutLine>();

  for (const line of lines) {
    const key = keypadLineKey(line);
    const existing = merged.get(key);
    const lineQty = line.quantity ?? 1;

    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: (existing.quantity ?? 1) + lineQty,
      });
      continue;
    }

    merged.set(key, { ...line, quantity: lineQty });
  }

  return Array.from(merged.values());
}

function keypadLineToCartItem(line: KeypadCheckoutLine): CartItem {
  const quantity = line.quantity ?? 1;
  const product_id = line.serviceId;
  const label = line.serviceName?.trim() || line.note?.trim() || 'Custom Amount';
  const amountProduct = createOpenAmountProduct(line.amount, label);

  if (!product_id) {
    return {
      product_id: amountProduct.productId,
      product: amountProduct,
      quantity,
    };
  }

  return {
    product_id,
    product: {
      ...amountProduct,
      id: product_id,
      productId: product_id,
      name: line.serviceName ?? amountProduct.name,
      sellingPrice: line.amount,
      uomId: line.serviceUomId ?? amountProduct.uomId,
      taxesIds: line.serviceTaxesIds ?? amountProduct.taxesIds,
    },
    quantity,
  };
}

function mergeCartItems(existing: CartItem[], incoming: CartItem[]): CartItem[] {
  const items = [...existing];

  for (const nextItem of incoming) {
    const index = items.findIndex((item) => item.product_id === nextItem.product_id);
    if (index >= 0) {
      items[index] = {
        ...items[index],
        quantity: items[index].quantity + nextItem.quantity,
      };
      continue;
    }
    items.push(nextItem);
  }

  return items;
}

interface CartState {
  items: CartItem[];
  discount: number;
  checkoutSource: CheckoutSource | null;
  keypadLines: KeypadCheckoutLine[];
  selectedCustomer: CustomerRecord | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  setCheckoutSource: (source: CheckoutSource) => void;
  setKeypadLines: (lines: KeypadCheckoutLine[]) => void;
  setSelectedCustomer: (customer: CustomerRecord | null) => void;
  beginKeypadCheckout: (lines: KeypadCheckoutLine[]) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  checkoutSource: null,
  keypadLines: [],
  selectedCustomer: null,

  addItem: (product, quantity = 1) => {
    const product_id = product.productId;
    if (!product_id) return;

    set((state) => {
      const existing = state.items.find((i) => i.product_id === product_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === product_id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, { product_id, product, quantity }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      ),
    }));
  },

  setDiscount: (discount) => set({ discount }),

  setCheckoutSource: (source) => set({ checkoutSource: source }),

  setKeypadLines: (lines) => set({ keypadLines: lines }),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

  beginKeypadCheckout: (lines) => {
    const mergedLines = mergeKeypadLines(lines);
    const incomingItems = mergedLines.map(keypadLineToCartItem);

    set((state) => ({
      items: mergeCartItems(state.items, incomingItems),
      discount: state.discount,
      checkoutSource: 'keypad',
      keypadLines: [],
    }));
  },

  clearCart: () =>
    set({ items: [], discount: 0, checkoutSource: null, keypadLines: [], selectedCustomer: null }),

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0
    );
  },

  getTotal: () => {
    return Math.max(0, get().getSubtotal() - get().discount);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

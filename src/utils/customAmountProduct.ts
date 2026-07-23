import type { Product } from '@/types';
import { generateId } from '@/utils/format';

export function createOpenAmountProduct(amount: number, note?: string): Product {
  const id = generateId();
  const label = note?.trim() || 'Custom Amount';

  return {
    id,
    productId: id,
    name: label,
    sku: 'OPEN',
    barcode: '',
    category: 'Open',
    costPrice: 0,
    sellingPrice: amount,
    stock: 9999,
    unit: 'unit',
    lowStockAlert: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

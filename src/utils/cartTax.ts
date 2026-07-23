import type { TaxOption } from '@/services/productService';
import type { CartItem } from '@/types';

export interface CartTaxLine {
  taxId: string;
  name: string;
  taxType: string;
  rate: number;
  amount: number;
}

export interface CartTaxBreakdown {
  vatAmount: number;
  taxAmount: number;
  totalTaxAmount: number;
  lines: CartTaxLine[];
}

function isVatTaxType(taxType?: string): boolean {
  return (taxType ?? '').trim().toUpperCase() === 'VAT';
}

export function calculateCartTaxBreakdown(
  items: CartItem[],
  taxes: TaxOption[]
): CartTaxBreakdown {
  if (!items.length) {
    return { vatAmount: 0, taxAmount: 0, totalTaxAmount: 0, lines: [] };
  }

  const hasAnyTax =
    taxes.length > 0 || items.some((item) => (item.product.taxes?.length ?? 0) > 0);
  if (!hasAnyTax) {
    return { vatAmount: 0, taxAmount: 0, totalTaxAmount: 0, lines: [] };
  }

  const taxById = new Map(taxes.map((tax) => [tax.id, tax]));
  const aggregated = new Map<string, CartTaxLine>();

  for (const item of items) {
    const lineTotal = item.product.sellingPrice * item.quantity;
    const taxIds = item.product.taxesIds ?? item.product.taxes?.map((tax) => tax.id) ?? [];
    const productTaxById = new Map((item.product.taxes ?? []).map((tax) => [tax.id, tax]));

    for (const taxId of taxIds) {
      const fromStore = taxById.get(taxId);
      const fromProduct = productTaxById.get(taxId);
      const tax = fromStore
        ? {
            id: fromStore.id,
            name: fromStore.name,
            rate: fromStore.rate,
            taxType: fromStore.taxType ?? fromStore.scope ?? 'TAX',
          }
        : fromProduct
          ? {
              id: fromProduct.id,
              name: fromProduct.name,
              rate: fromProduct.rate,
              taxType: fromProduct.taxType ?? 'TAX',
            }
          : null;
      if (!tax) continue;

      const amount = (lineTotal * tax.rate) / 100;
      const taxType = tax.taxType ?? 'TAX';
      const existing = aggregated.get(tax.id);

      if (existing) {
        existing.amount += amount;
        continue;
      }

      aggregated.set(tax.id, {
        taxId: tax.id,
        name: tax.name,
        taxType,
        rate: tax.rate,
        amount,
      });
    }
  }

  let vatAmount = 0;
  let taxAmount = 0;
  const lines = Array.from(aggregated.values());

  for (const line of lines) {
    if (isVatTaxType(line.taxType)) {
      vatAmount += line.amount;
    } else {
      taxAmount += line.amount;
    }
  }

  return {
    vatAmount,
    taxAmount,
    totalTaxAmount: vatAmount + taxAmount,
    lines,
  };
}

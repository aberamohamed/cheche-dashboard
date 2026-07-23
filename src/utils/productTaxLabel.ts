import type { TaxOption } from '@/services/productService';
import type { Product } from '@/types';

export type ProductTaxSnapshot = NonNullable<Product['taxes']>[number];

/** Attach resolved tax rows (rate/type) onto a product for offline storage. */
export function enrichProductWithTaxes(product: Product, taxes: TaxOption[]): Product {
  const taxIds = product.taxesIds ?? [];
  if (taxIds.length === 0) {
    return { ...product, taxes: product.taxes ?? [] };
  }

  const taxById = new Map(taxes.map((tax) => [tax.id, tax]));
  const snapshots: ProductTaxSnapshot[] = [];

  for (const taxId of taxIds) {
    const fromStore = taxById.get(taxId);
    if (fromStore) {
      snapshots.push({
        id: fromStore.id,
        name: fromStore.name,
        rate: fromStore.rate,
        taxType: fromStore.taxType ?? fromStore.scope,
      });
      continue;
    }
    const existing = product.taxes?.find((tax) => tax.id === taxId);
    if (existing) snapshots.push(existing);
  }

  return {
    ...product,
    taxes: snapshots,
  };
}

/** Display label after category, e.g. `(VAT: 15%)`. Prefer VAT; else first tax. */
export function formatProductVatLabel(product: Product): string | null {
  const taxes = product.taxes ?? [];
  if (taxes.length === 0) return null;

  const vat =
    taxes.find((tax) => (tax.taxType ?? '').trim().toUpperCase() === 'VAT') ?? taxes[0];
  if (!vat || !(vat.rate > 0)) return null;

  const label =
    (vat.taxType ?? '').trim().toUpperCase() === 'VAT'
      ? 'VAT'
      : vat.name.trim() || 'TAX';
  const rate = Number.isInteger(vat.rate) ? String(vat.rate) : vat.rate.toFixed(1);
  return `(${label}: ${rate}%)`;
}

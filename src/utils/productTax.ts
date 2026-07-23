import type { ApiProduct } from '@/types/api';

function normalizeTaxId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const id = record.id ?? record.tax_id ?? record.taxId;
    if (id != null && String(id).trim()) return String(id).trim();
  }
  return null;
}

export function normalizeTaxIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const ids = raw.map(normalizeTaxId).filter((id): id is string => !!id);
  return ids.length > 0 ? ids : undefined;
}

function resolveCategoryTaxIds(category: unknown): string[] | undefined {
  if (!category || typeof category !== 'object') return undefined;

  const record = category as Record<string, unknown>;
  return (
    normalizeTaxIds(record.effective_taxes_id ?? record.effectiveTaxesId) ??
    normalizeTaxIds(record.taxes_id ?? record.taxesId)
  );
}

function usesCategoryTax(item: Record<string, unknown>): boolean {
  return item.use_category_tax === true || item.useCategoryTax === true;
}

/** Resolves sale tax IDs from a product API record (product, variant, or template). */
export function resolveApiProductTaxIds(
  item: ApiProduct | Record<string, unknown>
): string[] | undefined {
  const record = item as Record<string, unknown>;

  const effective =
    normalizeTaxIds(record.effective_taxes_id ?? record.effectiveTaxesId) ??
    normalizeTaxIds((item as ApiProduct).effective_taxes_id);
  if (effective) return effective;

  const productTaxes =
    normalizeTaxIds(record.taxes_id ?? record.taxesId) ??
    normalizeTaxIds((item as ApiProduct).taxes_id);
  if (productTaxes) return productTaxes;

  if (usesCategoryTax(record)) {
    const categoryTaxes = resolveCategoryTaxIds(record.category ?? (item as ApiProduct).category);
    if (categoryTaxes) return categoryTaxes;
  }

  return undefined;
}

type ApiProductVariant = NonNullable<ApiProduct['variants']>[number];

export function resolveApiVariantTaxIds(
  variant: ApiProductVariant,
  template: ApiProduct
): string[] | undefined {
  const variantTaxes = resolveApiProductTaxIds(variant);
  if (variantTaxes) return variantTaxes;

  return resolveApiProductTaxIds(template);
}

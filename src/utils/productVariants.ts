import type { Product, ProductVariant } from '@/types';
import type { ApiProduct } from '@/types/api';
import { resolveApiVariantTaxIds } from '@/utils/productTax';

type ApiProductVariant = NonNullable<ApiProduct['variants']>[number];

function resolveVariantSellingPrice(template: ApiProduct, variant: ApiProductVariant): number {
  const basePrice = Number(template.list_price ?? template.selling_price ?? 0);
  const extra = Number(variant.list_price_extra ?? 0);
  return basePrice + extra;
}

function resolveVariantName(template: ApiProduct, variant: ApiProductVariant, index: number): string {
  if (variant.combination_name) return String(variant.combination_name);
  if (variant.default_code) return String(variant.default_code);
  if (template.default_code) return String(template.default_code);
  return `Variant ${index + 1}`;
}

function resolveVariantImage(template: ApiProduct, variant: ApiProductVariant): string | undefined {
  if (variant.image_url) return String(variant.image_url);
  if (template.image_url) return String(template.image_url);
  return undefined;
}

export function mapApiProductVariants(template: ApiProduct): ProductVariant[] {
  return (template.variants ?? [])
    .filter((variant) => variant.id)
    .map((variant, index) => ({
      id: String(variant.id),
      name: resolveVariantName(template, variant, index),
      sku: String(variant.default_code ?? template.default_code ?? template.sku ?? ''),
      barcode: variant.barcode ? String(variant.barcode) : '',
      sellingPrice: resolveVariantSellingPrice(template, variant),
      stock: Number(variant.qty_available ?? 0),
      taxesIds: resolveApiVariantTaxIds(variant, template),
      image: resolveVariantImage(template, variant),
    }));
}

export function applyVariantToProduct(product: Product, variant: ProductVariant): Product {
  return {
    ...product,
    productId: variant.id,
    sku: variant.sku || product.sku,
    barcode: variant.barcode || product.barcode,
    sellingPrice: variant.sellingPrice,
    stock: variant.stock,
    taxesIds: variant.taxesIds ?? product.taxesIds,
    image: variant.image ?? product.image,
    variantName: variant.name || undefined,
    variants: undefined,
  };
}

export function needsVariantSelection(product: Product): boolean {
  return (product.variants?.length ?? 0) > 0;
}

export function getProductSelectionKey(product: Product): string {
  if (product.variantName) {
    return `${product.id}:${product.productId}`;
  }
  return product.id;
}

export function getSelectedVariantsForTemplate(
  templateId: string,
  selectedProducts: Map<string, Product>
): Product[] {
  return Array.from(selectedProducts.entries())
    .filter(([key]) => key === templateId || key.startsWith(`${templateId}:`))
    .map(([, product]) => product);
}

export function removeTemplateSelections(
  templateId: string,
  selectedProducts: Map<string, Product>
): Map<string, Product> {
  const next = new Map(selectedProducts);
  for (const key of next.keys()) {
    if (key === templateId || key.startsWith(`${templateId}:`)) {
      next.delete(key);
    }
  }
  return next;
}

export function resolveProductForCart(product: Product): Product {
  const variants = product.variants ?? [];
  if (variants.length === 1) {
    return applyVariantToProduct(product, variants[0]);
  }
  return product;
}

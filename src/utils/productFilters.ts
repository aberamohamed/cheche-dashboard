import type { Product } from '@/types';

export type ProductStockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export type ProductStockTab = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring';

export const EXPIRING_WITHIN_DAYS = 30;

export interface ProductFilters {
  status: ProductStockStatus;
}

export const OTHER_CATEGORY_TAB_ID = 'other';

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  status: 'all',
};

export function filterProductsByStatus(products: Product[], status: ProductStockStatus): Product[] {
  switch (status) {
    case 'in_stock':
      return products.filter((p) => p.stock > p.lowStockAlert);
    case 'low_stock':
      return products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAlert);
    case 'out_of_stock':
      return products.filter((p) => p.stock <= 0);
    default:
      return products;
  }
}

export function filterExpiringProducts(products: Product[], withinDays = EXPIRING_WITHIN_DAYS): Product[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + withinDays);

  return products.filter((product) => {
    if (!product.expiryDate) return false;
    const expiry = new Date(product.expiryDate);
    if (Number.isNaN(expiry.getTime())) return false;
    expiry.setHours(0, 0, 0, 0);
    return expiry >= now && expiry <= limit;
  });
}

export function filterProductsByStockTab(products: Product[], tab: ProductStockTab): Product[] {
  if (tab === 'expiring') return filterExpiringProducts(products);
  return filterProductsByStatus(products, tab);
}

export interface ProductStockStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expiring: number;
}

export function getProductStockStats(products: Product[]): ProductStockStats {
  return {
    total: products.length,
    inStock: filterProductsByStatus(products, 'in_stock').length,
    lowStock: filterProductsByStatus(products, 'low_stock').length,
    outOfStock: filterProductsByStatus(products, 'out_of_stock').length,
    expiring: filterExpiringProducts(products).length,
  };
}

export function productMatchesCategoryTab(product: Product, categoryTabId: string): boolean {
  if (categoryTabId === OTHER_CATEGORY_TAB_ID) {
    return !product.categoryId?.trim();
  }
  return product.categoryId === categoryTabId;
}

export function filterProductsByCategoryTab(products: Product[], categoryTabId: string): Product[] {
  return products.filter((product) => productMatchesCategoryTab(product, categoryTabId));
}

export function filterProductsByCategories(products: Product[], categoryIds: string[]): Product[] {
  if (categoryIds.length === 0) return products;
  return products.filter((product) => {
    const key = product.categoryId?.trim() ? product.categoryId : OTHER_CATEGORY_TAB_ID;
    return categoryIds.includes(key);
  });
}

export type ProductStockSort = 'name' | 'nearest_expiry' | 'stock_asc' | 'stock_desc';

export function sortProductsForStockTab(
  products: Product[],
  tab: ProductStockTab,
  sort: ProductStockSort = 'name',
): Product[] {
  const list = [...products];

  switch (sort) {
    case 'nearest_expiry':
      return list.sort((a, b) => {
        const aTime = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
    case 'stock_asc':
      return list.sort((a, b) => a.stock - b.stock);
    case 'stock_desc':
      return list.sort((a, b) => b.stock - a.stock);
    case 'name':
    default:
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function getDefaultStockSort(tab: ProductStockTab): ProductStockSort {
  return tab === 'expiring' ? 'nearest_expiry' : 'name';
}

export function isProductInStock(product: Product): boolean {
  const variants = product.variants ?? [];
  if (variants.length > 0) {
    return variants.some((variant) => variant.stock > 0);
  }
  return product.stock > 0;
}

export function filterInStockProducts(products: Product[]): Product[] {
  return products.filter(isProductInStock);
}

export function isProductFilterActive(filters: ProductFilters): boolean {
  return filters.status !== 'all';
}

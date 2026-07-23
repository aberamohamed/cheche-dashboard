import { useQuery } from '@tanstack/react-query';
import {
  getBrands,
  getCategories,
  getGovernmentItemCategories,
  getProducts,
  getProductsByCategory,
  getLowStockProducts,
  getProductById,
  getTaxes,
  getUoms,
} from '@/services/productService';

export function useProducts(categoryId = 'all') {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () =>
      categoryId === 'all' ? getProducts() : getProductsByCategory(categoryId),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}

export function useGovernmentItemCategories() {
  return useQuery({
    queryKey: ['governmentItemCategories'],
    queryFn: () => getGovernmentItemCategories(true),
    staleTime: 1000 * 60 * 30,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
  });
}

export function useUoms() {
  return useQuery({
    queryKey: ['uoms'],
    queryFn: getUoms,
  });
}

export function useTaxes() {
  return useQuery({
    queryKey: ['taxes'],
    queryFn: getTaxes,
  });
}

export function useProductDetail(id?: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });
}

export function useLowStockProducts() {
  return useQuery({ queryKey: ['lowStock'], queryFn: getLowStockProducts });
}

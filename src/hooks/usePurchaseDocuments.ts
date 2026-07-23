import { getPurchaseDocumentsPage } from '@/services/purchaseListService';
import type { PurchaseDocumentType } from '@/types/purchase';
import { useInfiniteQuery } from '@tanstack/react-query';

export interface UsePurchaseDocumentsOptions {
  search?: string;
  status?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function usePurchaseDocuments(
  type: PurchaseDocumentType,
  options: UsePurchaseDocumentsOptions = {}
) {
  const { search = '', status = 'all', pageSize, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: ['purchase-documents', type, { search, status, pageSize }],
    queryFn: ({ pageParam }) =>
      getPurchaseDocumentsPage({
        type,
        page: pageParam,
        pageSize,
        search: search.trim() || undefined,
        status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled,
  });
}

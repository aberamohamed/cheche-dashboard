import { getWithholdingReceiptsPage } from '@/services/withholdingListService';
import { useInfiniteQuery } from '@tanstack/react-query';

export interface UseWithholdingReceiptsOptions {
  search?: string;
  status?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useWithholdingReceipts(options: UseWithholdingReceiptsOptions = {}) {
  const {
    search = '',
    status = 'all',
    pageSize,
    enabled = true,
  } = options;

  return useInfiniteQuery({
    queryKey: ['withholding-receipts', { search, status, pageSize }],
    queryFn: ({ pageParam }) =>
      getWithholdingReceiptsPage({
        page: pageParam,
        pageSize,
        search: search.trim() || undefined,
        status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
  });
}

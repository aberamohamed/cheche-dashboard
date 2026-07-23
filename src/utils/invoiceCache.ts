import type { PaginatedResult } from '@/services/invoiceService';
import type { Sale } from '@/types';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

function cloneSale(sale: Sale): Sale {
  return JSON.parse(JSON.stringify(sale)) as Sale;
}

export function findCachedInvoice(queryClient: QueryClient, id: string): Sale | null {
  const entries = queryClient.getQueriesData<InfiniteData<PaginatedResult<Sale>>>({
    queryKey: ['invoices'],
  });

  for (const [, data] of entries) {
    if (!data?.pages) continue;
    for (const page of data.pages) {
      const match = page.items.find((item) => item.id === id || item.invoiceUuid === id);
      if (match) return cloneSale(match);
    }
  }

  return null;
}

import { useInfiniteQuery } from '@tanstack/react-query';
import {
  getCustomersPage,
  getInvoicesPage,
  getReceiptsPage,
  type InvoiceFilter,
} from '@/services/invoiceService';

export function useInvoices(filter: InvoiceFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['invoices', filter],
    queryFn: ({ pageParam }) => getInvoicesPage(pageParam, filter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function useReceipts(filter: InvoiceFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['receipts', filter],
    queryFn: ({ pageParam }) => getReceiptsPage(pageParam, filter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function useCustomers(filter: InvoiceFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['customers', filter],
    queryFn: ({ pageParam }) => getCustomersPage(pageParam, filter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

import { apiRequest } from '@/services/apiClient';
import type { CustomerRecord, ReceiptRecord, Sale } from '@/types';
import type { ApiCustomer, ApiInvoice, ApiReceipt } from '@/types/api';
import {
  mapApiCustomer,
  mapApiInvoice,
  mapApiReceipt,
  unwrapData,
  unwrapList,
  unwrapPaginated,
} from '@/utils/apiHelpers';
import { isThisMonth, isThisWeek, isToday, isYesterday, parseISO } from 'date-fns';

export type InvoiceFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const INVOICE_PAGE_SIZE = 10;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function fetchApiInvoices(page = 1, pageSize = INVOICE_PAGE_SIZE): Promise<ApiInvoice[]> {
  const response = await apiRequest<unknown>(
    `/invoicing/invoices?page=${page}&page_size=${pageSize}`
  );
  return unwrapList<ApiInvoice>(response);
}

export async function fetchApiReceipts(page = 1, pageSize = INVOICE_PAGE_SIZE): Promise<ApiReceipt[]> {
  const response = await apiRequest<unknown>(
    `/invoicing/receipts?page=${page}&page_size=${pageSize}`
  );
  return unwrapList<ApiReceipt>(response);
}

export async function fetchApiCustomers(page = 1, pageSize = INVOICE_PAGE_SIZE): Promise<ApiCustomer[]> {
  const response = await apiRequest<unknown>(
    `/sales/customers?page=${page}&page_size=${pageSize}`
  );
  return unwrapList<ApiCustomer>(response);
}

function applyDateFilter<T extends { createdAt: string }>(
  items: T[],
  filter: InvoiceFilter
): T[] {
  return items.filter((item) => {
    const date = parseISO(item.createdAt);
    switch (filter) {
      case 'today':
        return isToday(date);
      case 'yesterday':
        return isYesterday(date);
      case 'week':
        return isThisWeek(date);
      case 'month':
        return isThisMonth(date);
      default:
        return true;
    }
  });
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getInvoicesPage(
  page: number,
  filter: InvoiceFilter = 'all',
  pageSize = INVOICE_PAGE_SIZE
): Promise<PaginatedResult<Sale>> {
  const response = await apiRequest<unknown>(
    `/invoicing/invoices?page=${page}&page_size=${pageSize}`
  );
  const { data, total, page: currentPage, pageSize: size } = unwrapPaginated<ApiInvoice>(response);
  const items = applyDateFilter(sortByCreatedAtDesc(data.map(mapApiInvoice)), filter);
  return toPaginatedResult(items, total, currentPage, size);
}

export async function getReceiptsPage(
  page: number,
  filter: InvoiceFilter = 'all',
  pageSize = INVOICE_PAGE_SIZE
): Promise<PaginatedResult<ReceiptRecord>> {
  const response = await apiRequest<unknown>(
    `/invoicing/receipts?page=${page}&page_size=${pageSize}`
  );
  const { data, total, page: currentPage, pageSize: size } = unwrapPaginated<ApiReceipt>(response);
  const items = applyDateFilter(sortByCreatedAtDesc(data.map(mapApiReceipt)), filter);
  return toPaginatedResult(items, total, currentPage, size);
}

export async function getCustomersPage(
  page: number,
  filter: InvoiceFilter = 'all',
  pageSize = INVOICE_PAGE_SIZE
): Promise<PaginatedResult<CustomerRecord>> {
  const response = await apiRequest<unknown>(
    `/sales/customers?page=${page}&page_size=${pageSize}`
  );
  const { data, total, page: currentPage, pageSize: size } = unwrapPaginated<ApiCustomer>(response);
  const items = applyDateFilter(sortByCreatedAtDesc(data.map(mapApiCustomer)), filter);
  return toPaginatedResult(items, total, currentPage, size);
}

export async function getInvoices(filter: InvoiceFilter = 'all'): Promise<Sale[]> {
  const invoices = await fetchApiInvoices(1, 1000);
  const sorted = sortByCreatedAtDesc(invoices.map(mapApiInvoice));
  return applyDateFilter(sorted, filter);
}

export async function getReceipts(filter: InvoiceFilter = 'all'): Promise<ReceiptRecord[]> {
  const receipts = await fetchApiReceipts(1, 1000);
  const sorted = sortByCreatedAtDesc(receipts.map(mapApiReceipt));
  return applyDateFilter(sorted, filter);
}

export async function getCustomers(filter: InvoiceFilter = 'all'): Promise<CustomerRecord[]> {
  const customers = await fetchApiCustomers(1, 1000);
  const sorted = sortByCreatedAtDesc(customers.map(mapApiCustomer));
  return applyDateFilter(sorted, filter);
}

export async function getInvoiceById(id: string): Promise<Sale | null> {
  try {
    const response = await apiRequest<unknown>(`/invoicing/${id}`);
    const invoice =
      unwrapList<ApiInvoice>(response)[0] ?? unwrapData<ApiInvoice>(response);

    if (
      invoice &&
      typeof invoice === 'object' &&
      ('id' in invoice || 'invoice_uuid' in invoice || 'invoiceUuid' in invoice)
    ) {
      return mapApiInvoice(invoice as ApiInvoice);
    }
  } catch {
    // fall through
  }

  return null;
}

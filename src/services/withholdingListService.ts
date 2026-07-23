import { apiRequest } from '@/services/apiClient';
import { INVOICE_PAGE_SIZE, type PaginatedResult } from '@/services/invoiceService';
import type { WithholdingRecord } from '@/types';
import type { ApiWithholdingReceipt } from '@/types/api';
import type { ApiPurchaseSummary, PurchaseSummary } from '@/types/purchase';
import { mapApiWithholdingReceipt, unwrapPaginated } from '@/utils/apiHelpers';

export interface WithholdingListQuery {
  page: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

function buildWithholdingListUrl({
  page,
  pageSize = INVOICE_PAGE_SIZE,
  search,
  status,
}: WithholdingListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(pageSize));

  const q = search?.trim();
  if (q) params.set('search', q);

  if (status && status !== 'all') params.set('status', status);

  return `/purchase/withholding-receipts?${params.toString()}`;
}

function sortByCreatedAtDesc(items: WithholdingRecord[]): WithholdingRecord[] {
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

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mapWithholdingSummary(raw: unknown): PurchaseSummary | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const summary = raw as ApiPurchaseSummary;
  return {
    totalCount: toNumber(summary.total_count),
    completedCount: toNumber(summary.completed_count),
    partialCount: toNumber(summary.partial_count),
    pendingCount: toNumber(summary.pending_count),
    paidAmount: toNumber(summary.paid_amount),
    totalOutstanding: toNumber(summary.total_outstanding),
  };
}

export interface WithholdingReceiptsPage
  extends PaginatedResult<WithholdingRecord> {
  summary?: PurchaseSummary;
}

export async function getWithholdingReceiptsPage(
  query: WithholdingListQuery
): Promise<WithholdingReceiptsPage> {
  const response = await apiRequest<unknown>(buildWithholdingListUrl(query));
  const { data, total, page: currentPage, pageSize: size } =
    unwrapPaginated<ApiWithholdingReceipt>(response);
  const items = sortByCreatedAtDesc(data.map(mapApiWithholdingReceipt));

  const summarySource =
    response && typeof response === 'object'
      ? ((response as Record<string, unknown>).summary ??
        ((response as Record<string, unknown>).data as Record<string, unknown> | undefined)
          ?.summary)
      : undefined;

  return {
    ...toPaginatedResult(items, total, currentPage, size),
    summary: mapWithholdingSummary(summarySource),
  };
}

import { apiRequest } from '@/services/apiClient';
import { INVOICE_PAGE_SIZE, type PaginatedResult } from '@/services/invoiceService';
import type {
  ApiPurchaseDocument,
  ApiPurchaseInvoiceLine,
  ApiPurchaseSummary,
  PurchaseDocumentRecord,
  PurchaseDocumentType,
  PurchaseInvoiceDetail,
  PurchaseInvoiceItem,
  PurchaseSummary,
} from '@/types/purchase';
import { unwrapData, unwrapPaginated } from '@/utils/apiHelpers';

export interface PurchaseListQuery {
  type: PurchaseDocumentType;
  page: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function mapPurchaseDocument(raw: ApiPurchaseDocument): PurchaseDocumentRecord {
  const id = firstString(raw.id, raw.uuid, raw.invoice_uuid) ?? '';

  const number =
    firstString(
      raw.pi_number,
      raw.purchase_invoice_number,
      raw.invoice_number,
      raw.invoiceNumber,
      raw.number,
      raw.pr_number,
      raw.document_number,
      raw.documentNumber,
      raw.receipt_number,
      raw.receiptNumber,
      raw.return_number,
      raw.returnNumber
    ) ?? '—';

  const supplierName =
    firstString(
      raw.supplier?.name,
      raw.vendor?.name,
      raw.partner?.name,
      raw.supplier_name,
      raw.supplierName,
      raw.vendor_name,
      raw.vendorName,
      raw.partner_name,
      raw.partnerName
    ) ?? 'Supplier';

  const total = toNumber(
    raw.grand_total ??
      raw.grandTotal ??
      raw.total_amount ??
      raw.totalAmount ??
      raw.total ??
      raw.amount
  );

  const createdAt =
    firstString(
      raw.created_at,
      raw.createdAt,
      raw.invoice_date,
      raw.receipt_date,
      raw.updated_at,
      raw.updatedAt
    ) ?? new Date().toISOString();

  return {
    id,
    number,
    supplierName,
    total,
    currency: firstString(raw.currency),
    status: firstString(raw.status, raw.payment_status, raw.paymentStatus),
    eimsStatus: firstString(
      raw.eims_status,
      raw.eimsStatus,
      raw.eirms_status,
      raw.eirmsStatus
    ),
    reference: firstString(raw.reference, raw.reference_number),
    purchaseOrderNumber: firstString(raw.purchase_order_number),
    createdAt,
  };
}

function mapPurchaseInvoiceItem(raw: ApiPurchaseInvoiceLine): PurchaseInvoiceItem {
  return {
    id: firstString(raw.id) ?? '',
    productId: firstString(raw.product_id),
    description: firstString(raw.description) ?? 'Item',
    uom: firstString(raw.uom) ?? '—',
    unitPrice: toNumber(raw.unit_price),
    qty: toNumber(raw.qty),
    discountAmount: toNumber(raw.discount_amount),
    amount: toNumber(raw.amount),
    taxesId: Array.isArray(raw.taxes_id) ? raw.taxes_id.map(String) : [],
    lineNumber: raw.line_number != null ? Number(raw.line_number) : undefined,
  };
}

export function mapPurchaseInvoiceDetail(raw: ApiPurchaseDocument): PurchaseInvoiceDetail {
  const listFields = mapPurchaseDocument(raw);

  return {
    id: listFields.id,
    piNumber: firstString(raw.pi_number, raw.purchase_invoice_number, listFields.number) ?? '—',
    purchaseOrderId: firstString(raw.purchase_order_id),
    purchaseOrderNumber: firstString(raw.purchase_order_number),
    supplierId: firstString(raw.supplier_id),
    supplierName: listFields.supplierName,
    supplierTransactionType: firstString(raw.supplier_transaction_type),
    warehouseId: firstString(raw.warehouse_id),
    warehouseName: firstString(raw.warehouse_name),
    status: listFields.status,
    invoiceDate: firstString(raw.invoice_date),
    totalQty: toNumber(raw.total_qty),
    totalAmount: toNumber(raw.total_amount ?? raw.totalAmount ?? raw.total),
    totalTaxes: toNumber(raw.total_taxes),
    totalDiscount: toNumber(raw.total_discount),
    grandTotal: listFields.total,
    outstandingAmount: toNumber(raw.outstanding_amount),
    paidAmount: toNumber(raw.paid_amount),
    invoiceIrn: firstString(raw.invoice_irn),
    remarks: firstString(raw.remarks),
    items: (raw.items ?? []).map(mapPurchaseInvoiceItem),
    createdAt: listFields.createdAt,
    updatedAt: firstString(raw.updated_at, raw.updatedAt),
  };
}

function buildPurchaseListUrl({
  type,
  page,
  pageSize = INVOICE_PAGE_SIZE,
  search,
  status,
}: PurchaseListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  params.set('sort_by', 'created_at');
  params.set('sort_order', 'desc');

  const q = search?.trim();
  if (q) params.set('search', q);

  if (status && status !== 'all') params.set('status', status);

  return `/purchase/${type}?${params.toString()}`;
}

function sortByCreatedAtDesc(
  items: PurchaseDocumentRecord[]
): PurchaseDocumentRecord[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function mapPurchaseSummary(raw: unknown): PurchaseSummary | undefined {
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

export interface PurchaseDocumentsPage
  extends PaginatedResult<PurchaseDocumentRecord> {
  summary?: PurchaseSummary;
}

export async function getPurchaseDocumentsPage(
  query: PurchaseListQuery
): Promise<PurchaseDocumentsPage> {
  const response = await apiRequest<unknown>(buildPurchaseListUrl(query));
  const { data, total, page, pageSize } =
    unwrapPaginated<ApiPurchaseDocument>(response);
  const items = sortByCreatedAtDesc(data.map(mapPurchaseDocument));

  const summarySource =
    response && typeof response === 'object'
      ? ((response as Record<string, unknown>).summary ??
        ((response as Record<string, unknown>).data as Record<string, unknown> | undefined)
          ?.summary)
      : undefined;

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    summary: mapPurchaseSummary(summarySource),
  };
}

export async function getPurchaseInvoice(id: string): Promise<PurchaseInvoiceDetail> {
  const response = await apiRequest<unknown>(`/purchase/invoices/${id}`);
  const raw = unwrapData<ApiPurchaseDocument>(response);
  return mapPurchaseInvoiceDetail(raw);
}

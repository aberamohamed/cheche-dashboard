import { apiRequest, apiRequestText, ApiError } from '@/services/apiClient';
import { fetchTaxDocumentHtml } from '@/services/receiptService';
import type { ApiInvoice, ApiInvoiceLine } from '@/types/api';
import type {
  EimsCancelReason,
  MemoLineItem,
  MemoSubmitItem,
  MemoType,
} from '@/types/invoiceAdjustment';
import { EIMS_CANCEL_REASONS } from '@/types/invoiceAdjustment';
import { resolveMemoDiscount } from '@/utils/memoTax';
import { buildMemoPreviewHtml } from '@/utils/memoPreviewHtml';
import { unwrapData, unwrapList } from '@/utils/apiHelpers';

function resolveInvoiceLines(raw: ApiInvoice): ApiInvoiceLine[] {
  if (raw.items?.length) return raw.items;
  if (raw.lines?.length) return raw.lines;
  if (raw.order?.lines?.length) {
    return raw.order.lines.map((line) => ({
      ...line,
      product_name:
        line.product_name ??
        line.productName ??
        line.product?.template?.name ??
        'Item',
      quantity: line.quantity ?? line.qty,
      code:
        line.code ??
        line.default_code ??
        line.product?.default_code ??
        line.product?.template?.default_code,
      excise: line.excise ?? line.excise_tax,
    }));
  }
  return [];
}

function mapMemoLine(line: ApiInvoiceLine): MemoLineItem | null {
  const id = line.id ? String(line.id) : '';
  const productId = line.product_id ? String(line.product_id) : id;
  if (!id || !productId) return null;

  const qty = Number(line.quantity ?? line.qty ?? 0);
  const unitPrice = Number(line.unit_price ?? line.unitPrice ?? 0);
  const discount = Number(line.discount ?? 0);
  const referenceTax = Number(line.tax ?? 0);
  const referenceExcise = Number(
    line.excise ?? line.excise_tax ?? 0
  );

  return {
    id,
    product_id: productId,
    product_name: String(
      line.product_name ?? line.productName ?? line.product?.template?.name ?? 'Item'
    ),
    qty,
    unit_price: unitPrice,
    discount,
    original_qty: qty,
    original_price: unitPrice,
    original_discount: discount,
    tax_code: line.tax_code ? String(line.tax_code) : undefined,
    uom: line.uom ? String(line.uom) : undefined,
    code: String(
      line.code ?? line.sku ?? line.default_code ?? line.product?.default_code ?? ''
    ),
    reference_tax: referenceTax,
    reference_excise: referenceExcise,
  };
}

export async function fetchInvoiceMemoLines(invoiceId: string): Promise<MemoLineItem[]> {
  const response = await apiRequest<unknown>(`/invoicing/${invoiceId}`);
  const invoice =
    unwrapList<ApiInvoice>(response)[0] ?? unwrapData<ApiInvoice>(response);

  if (!invoice || typeof invoice !== 'object') {
    throw new Error('Invoice not found.');
  }

  return mapApiInvoiceToMemoLines(invoice);
}

export function mapApiInvoiceToMemoLines(invoice: ApiInvoice): MemoLineItem[] {
  return resolveInvoiceLines(invoice)
    .map(mapMemoLine)
    .filter((line): line is MemoLineItem => line !== null);
}

export function mapDetailToMemoLines(detail: {
  items: Array<{
    key: string;
    lineId?: string;
    productId?: string;
    name: string;
    sku?: string;
    uom?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
    excise?: number;
    taxCode?: string;
  }>;
}): MemoLineItem[] {
  return detail.items
    .map((item): MemoLineItem | null => {
      const id = item.lineId ?? item.key;
      const productId = item.productId ?? item.key;
      if (!id || !productId) return null;

      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount ?? 0);
      const referenceTax = Number(item.tax ?? 0);
      const referenceExcise = Number(item.excise ?? 0);

      return {
        id,
        product_id: productId,
        product_name: item.name,
        qty,
        unit_price: unitPrice,
        discount,
        original_qty: qty,
        original_price: unitPrice,
        original_discount: discount,
        tax_code: item.taxCode ? String(item.taxCode) : undefined,
        uom: item.uom ? String(item.uom) : undefined,
        code: item.sku ? String(item.sku) : undefined,
        reference_tax: referenceTax,
        reference_excise: referenceExcise,
      };
    })
    .filter((line): line is MemoLineItem => line !== null);
}

function toSubmitItem(item: MemoLineItem): MemoSubmitItem {
  return {
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    qty: Number(item.qty) || 0,
    unit_price: Number(item.unit_price) || 0,
    discount: resolveMemoDiscount(item),
  };
}

function buildMemoSubmitPayload(
  memoType: MemoType,
  reason: string,
  items: MemoLineItem[]
) {
  const payloadItems = items
    .map(toSubmitItem)
    .filter((item) => item.qty > 0 && item.unit_price > 0);

  return {
    memoType,
    reason: reason.trim(),
    items: payloadItems,
  };
}

function buildMemoPreviewPayload(
  memoType: MemoType,
  reason: string,
  items: MemoLineItem[],
  referenceIrn?: string
) {
  return {
    preview: true,
    ...buildMemoSubmitPayload(memoType, reason, items),
    ...(referenceIrn ? { referenceIrn } : {}),
  };
}

export async function fetchMemoPreviewHtml(
  invoiceId: string,
  memoType: MemoType,
  reason: string,
  items: MemoLineItem[],
  referenceIrn?: string,
  referenceRrn?: string
): Promise<string> {
  const body = buildMemoPreviewPayload(memoType, reason, items, referenceIrn);
  const taxDocumentBody = {
    ...body,
    ...(referenceRrn ? { rrn: referenceRrn } : {}),
    ...(referenceIrn ? { irn: referenceIrn } : {}),
  };

  const attempts: Array<() => Promise<string>> = [
    () =>
      apiRequestText(`/invoicing/${invoiceId}/memo/preview`, {
        method: 'POST',
        body,
        silent: true,
      }),
    () =>
      apiRequestText('/public/tax-documents', {
        method: 'POST',
        body: taxDocumentBody,
        silent: true,
      }),
  ];

  for (const attempt of attempts) {
    try {
      const html = await attempt();
      if (html.trim().startsWith('<')) {
        return html;
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
        continue;
      }
    }
  }

  try {
    if (referenceRrn) {
      const html = await fetchTaxDocumentHtml(referenceRrn, 'rrn');
      if (html.trim().startsWith('<')) return html;
    }

    if (referenceIrn) {
      const html = await fetchTaxDocumentHtml(referenceIrn, 'irn');
      if (html.trim().startsWith('<')) return html;
    }
  } catch {
    // Fall through to client-side live preview below.
  }

  return buildMemoPreviewHtml(memoType, reason, items);
}

export async function createInvoiceMemo(
  invoiceId: string,
  memoType: MemoType,
  reason: string,
  items: MemoLineItem[]
): Promise<unknown> {
  const body = buildMemoSubmitPayload(memoType, reason, items);

  if (body.items.length === 0) {
    throw new Error('Add at least one line item with quantity and price.');
  }

  return apiRequest(`/invoicing/${invoiceId}/memo`, {
    method: 'POST',
    body,
  });
}

export async function retryInvoiceEims(invoiceId: string): Promise<unknown> {
  return apiRequest(`/invoicing/${invoiceId}/retry-eims`, {
    method: 'POST',
  });
}

function mapCancelReason(raw: unknown): EimsCancelReason | null {
  if (typeof raw === 'string') {
    const value = raw.trim();
    return value ? { code: value, label: value } : null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const code =
    record.code ??
    record.reasonCode ??
    record.reason_code ??
    record.value ??
    record.id;
  const label =
    record.label ??
    record.name ??
    record.reason ??
    record.description ??
    record.text ??
    code;

  if (code === undefined || code === null) return null;

  return {
    code: String(code),
    label: String(label ?? code),
  };
}

export async function fetchEimsCancelReasons(): Promise<EimsCancelReason[]> {
  const response = await apiRequest<unknown>('/invoicing/cancellation-reasons');
  const reasons = unwrapList<unknown>(response)
    .map(mapCancelReason)
    .filter((reason): reason is EimsCancelReason => reason !== null);

  return reasons.length > 0 ? reasons : EIMS_CANCEL_REASONS;
}

export async function cancelInvoiceEims(
  invoiceId: string,
  reasonCode: string,
  remark?: string
): Promise<unknown> {
  return apiRequest(`/invoicing/${invoiceId}/cancel-eims`, {
    method: 'POST',
    body: {
      reasonCode,
      remark: remark?.trim() || undefined,
    },
  });
}

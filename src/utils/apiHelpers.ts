import type { Business, CustomerRecord, InvoiceTaxLine, Product, ReceiptCustomer, ReceiptRecord, Sale, SaleItem, User, WithholdingRecord } from '@/types';
import type { ApiCustomer, ApiInvoice, ApiInvoiceLine, ApiProduct, ApiReceipt, ApiUser, ApiWithholdingReceipt } from '@/types/api';
import { applyVariantToProduct, mapApiProductVariants } from '@/utils/productVariants';
import { resolveApiProductTaxIds } from '@/utils/productTax';

export function unwrapData<T>(response: unknown): T {
  if (!response || typeof response !== 'object') return response as T;
  const record = response as Record<string, unknown>;
  if (record.data !== undefined) {
    const inner = record.data;
    if (inner && typeof inner === 'object' && 'data' in (inner as object)) {
      return (inner as { data: T }).data;
    }
    return inner as T;
  }
  return response as T;
}

export function unwrapList<T>(response: unknown): T[] {
  const data = unwrapData<ApiPaginated<T> | T[] | T>(response);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as ApiPaginated<T>).data)) {
    return (data as ApiPaginated<T>).data ?? [];
  }
  if (data) return [data as T];
  return [];
}

interface ApiPaginated<T> {
  data?: T[];
  total?: number;
  page?: number;
  page_size?: number;
  pageSize?: number;
}

export interface PaginatedUnwrapped<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function unwrapPaginated<T>(response: unknown): PaginatedUnwrapped<T> {
  if (!response || typeof response !== 'object') {
    return { data: [], total: 0, page: 1, pageSize: 0 };
  }

  const record = response as Record<string, unknown>;
  let payload: Record<string, unknown> = record;

  if (
    record.data !== undefined &&
    record.data !== null &&
    typeof record.data === 'object' &&
    !Array.isArray(record.data)
  ) {
    const inner = record.data as Record<string, unknown>;
    if (Array.isArray(inner.data) || inner.total !== undefined) {
      payload = inner;
    }
  }

  const data = Array.isArray(payload.data) ? (payload.data as T[]) : unwrapList<T>(response);
  const total = Number(payload.total ?? record.total ?? data.length);
  const page = Number(payload.page ?? record.page ?? 1);
  const pageSize = Number(
    payload.pageSize ?? payload.page_size ?? record.pageSize ?? record.page_size ?? data.length
  );

  return { data, total, page, pageSize };
}

export function resolvePosProductId(raw: ApiProduct | Record<string, unknown>): string {
  const item = raw as ApiProduct;
  return String(item.id ?? item.product_id ?? '');
}

function resolveProductBarcode(item: ApiProduct): string {
  if (item.barcode) return String(item.barcode);
  const variantBarcode = item.variants?.find((variant) => variant.barcode)?.barcode;
  return variantBarcode ? String(variantBarcode) : '';
}

function resolveProductCategoryName(item: ApiProduct): string {
  if (item.category && typeof item.category === 'object' && item.category.name) {
    return String(item.category.name);
  }
  if (typeof item.category === 'string') return item.category;
  return String(item.category_name ?? 'Uncategorized');
}

function resolveProductUomId(item: ApiProduct): string | undefined {
  if (item.uom_id) return String(item.uom_id);
  if (item.uom?.id) return String(item.uom.id);
  return undefined;
}

function resolveProductStock(item: ApiProduct): number {
  if (item.qty_available != null) return Number(item.qty_available);
  if (item.qty_on_hand != null) return Number(item.qty_on_hand);
  const variantQty = item.variants?.[0]?.qty_available;
  if (variantQty != null) return Number(variantQty);
  return Number(item.stock ?? item.quantity ?? 0);
}

export function mapApiProduct(raw: ApiProduct | Record<string, unknown>): Product {
  const item = raw as ApiProduct;
  const productId = resolvePosProductId(item);
  const id = String(item.id ?? item.product_id ?? '');
  const variants = mapApiProductVariants(item);

  const base: Product = {
    id,
    productId,
    name: String(item.name ?? item.product_name ?? ''),
    sku: String(item.default_code ?? item.sku ?? ''),
    barcode: resolveProductBarcode(item),
    category: resolveProductCategoryName(item),
    categoryId: item.category_id ? String(item.category_id) : undefined,
    costPrice: Number(item.standard_price ?? item.cost_price ?? 0),
    sellingPrice: Number(item.list_price ?? item.selling_price ?? 0),
    stock: resolveProductStock(item),
    unit: String(item.uom?.name ?? item.uom_name ?? item.unit ?? 'unit'),
    uomId: resolveProductUomId(item),
    taxesIds: resolveApiProductTaxIds(item),
    description: item.description ? String(item.description) : undefined,
    image: item.image_url ? String(item.image_url) : undefined,
    lowStockAlert: Number(item.min_stock_qty ?? item.low_stock_alert ?? 5),
    productType: item.type ? String(item.type) : undefined,
    brandId: item.brand_id ? String(item.brand_id) : undefined,
    brandName: item.brand_name ? String(item.brand_name) : undefined,
    hsCode: item.hs_code ? String(item.hs_code) : undefined,
    hsRate: item.hs_rate != null ? Number(item.hs_rate) : undefined,
    maxStockQty: item.max_stock_qty != null ? Number(item.max_stock_qty) : undefined,
    isStockItem: item.is_stock_item != null ? Boolean(item.is_stock_item) : undefined,
    expiryDate: item.expiry_date
      ? String(item.expiry_date)
      : item.expiration_date
        ? String(item.expiration_date)
        : undefined,
    createdAt: String(item.created_at ?? new Date().toISOString()),
    updatedAt: String(item.updated_at ?? new Date().toISOString()),
  };

  if (variants.length === 1) {
    return applyVariantToProduct(base, variants[0]);
  }

  if (variants.length > 1) {
    return { ...base, variants };
  }

  return base;
}

export function normalizeApiRoles(roles: unknown): string[] {
  if (!roles) return [];
  if (Array.isArray(roles)) {
    return roles
      .map((role) => {
        if (typeof role === 'string') return role;
        if (role && typeof role === 'object') {
          const record = role as Record<string, unknown>;
          const name = record.name ?? record.code ?? record.role;
          return name ? String(name) : '';
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof roles === 'string') return [roles];
  return [];
}

export function mapApiUser(raw: ApiUser): User {
  const first = raw.firstName ?? raw.first_name ?? '';
  const last = raw.lastName ?? raw.last_name ?? '';
  const roleList = normalizeApiRoles(raw.roles);
  const role = roleList[0];
  const fullName =
    [first, last].filter(Boolean).join(' ') ||
    String(raw.fullName ?? raw.full_name ?? raw.name ?? '').trim() ||
    'User';
  return {
    id: String(raw.id),
    fullName,
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    role: role ? formatRole(role) : undefined,
    createdAt: new Date().toISOString(),
  };
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function mapApiUserToBusiness(raw: ApiUser, orgName?: string): Business {
  return {
    id: String(raw.organizationId ?? raw.organization_id ?? raw.id),
    name: orgName ?? 'Organization',
    type: 'retail',
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    address: '',
    ownerId: String(raw.id),
    createdAt: new Date().toISOString(),
  };
}

function resolveInvoiceItems(raw: ApiInvoice): ApiInvoiceLine[] {
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
      code: line.code ?? line.default_code ?? line.product?.default_code ?? line.product?.template?.default_code,
      excise: line.excise ?? line.excise_tax,
    }));
  }
  return [];
}

function mapInvoiceLine(line: ApiInvoiceLine): SaleItem {
  const qty = Number(line.quantity ?? line.qty ?? 0);
  const unitPrice = Number(line.unit_price ?? line.unitPrice ?? 0);
  const lineTotal = Number(line.subtotal ?? line.total ?? qty * unitPrice);
  const tax = line.tax != null ? Number(line.tax) : undefined;
  const excise =
    line.excise != null
      ? Number(line.excise)
      : line.excise_tax != null
        ? Number(line.excise_tax)
        : undefined;

  return {
    lineId: line.id ? String(line.id) : undefined,
    productId: String(line.product_id ?? line.id ?? ''),
    productName: String(
      line.product_name ?? line.productName ?? line.product?.template?.name ?? 'Item'
    ),
    sku: String(line.code ?? line.sku ?? line.default_code ?? line.product?.default_code ?? ''),
    quantity: qty,
    unitPrice,
    total: lineTotal,
    discount: Number(line.discount ?? 0),
    tax: tax && tax > 0 ? tax : undefined,
    excise: excise && excise > 0 ? excise : undefined,
    uom: line.uom ? String(line.uom) : undefined,
    taxCode: line.tax_code ? String(line.tax_code) : undefined,
  };
}

function mapInvoiceTaxes(raw: ApiInvoice): InvoiceTaxLine[] {
  return (raw.invoiceTaxes ?? []).map((tax) => ({
    name: String(tax.tax_name ?? 'Tax'),
    type: String(tax.tax_type ?? ''),
    rate: Number(tax.rate ?? 0),
    amount: Number(tax.amount ?? 0),
  }));
}

export function mapApiInvoice(raw: ApiInvoice): Sale {
  const items = resolveInvoiceItems(raw).map(mapInvoiceLine);
  const order = raw.order;
  const taxBreakdown = raw.tax_breakdown;
  const taxes = mapInvoiceTaxes(raw);

  const subtotal = Number(
    order?.subtotal ?? raw.subtotal ?? items.reduce((sum, item) => sum + item.total, 0)
  );
  const discount = Number(order?.discount_amount ?? raw.discount ?? 0);
  const taxValue = Number(raw.tax_value ?? order?.tax_amount ?? taxes.reduce((sum, tax) => sum + tax.amount, 0));
  const total = Number(raw.total_value ?? raw.total ?? raw.amount ?? order?.total ?? subtotal + taxValue);
  const paidAmount = Number(raw.paid_amount ?? order?.paid_amount ?? 0);

  const method = String(raw.payment_method ?? raw.paymentMethod ?? 'cash').toLowerCase();
  const paymentMethod =
    method.includes('card')
      ? 'card'
      : method.includes('tele') || method.includes('mobile') || method.includes('wallet')
        ? 'mobile'
        : 'cash';

  return {
    id: String(raw.id),
    invoiceNumber: String(raw.invoice_number ?? raw.invoiceNumber ?? raw.invoice_uuid ?? raw.id),
    invoiceUuid:
      raw.invoice_uuid ?? raw.invoiceUuid
        ? String(raw.invoice_uuid ?? raw.invoiceUuid)
        : undefined,
    posOrderUuid: raw.pos_order_uuid ? String(raw.pos_order_uuid) : order?.uuid,
    orderNumber: order?.order_number ? String(order.order_number) : undefined,
    items,
    subtotal,
    discount,
    taxValue,
    paidAmount,
    total,
    paymentMethod,
    customerName: raw.customer_name ?? raw.client_name ?? 'Guest',
    status: raw.status ? String(raw.status) : undefined,
    invoiceType: String(raw.type ?? raw.invoice_type ?? 'invoice'),
    eirmsStatus:
      raw.eims_status ?? raw.eirms_status
        ? String(raw.eims_status ?? raw.eirms_status)
        : undefined,
    transactionType: raw.transaction_type ? String(raw.transaction_type) : undefined,
    sellerTin: raw.seller_tin ? String(raw.seller_tin) : undefined,
    buyerTin: raw.buyer_tin ? String(raw.buyer_tin) : undefined,
    eirmsDocumentNumber: raw.eirmsDocumentNumber ? String(raw.eirmsDocumentNumber) : undefined,
    eirmsAckDate: raw.eirmsAckDate ? String(raw.eirmsAckDate) : undefined,
    irn:
      raw.eirms_irn ?? raw.eirmsIrn ?? raw.irn
        ? String(raw.eirms_irn ?? raw.eirmsIrn ?? raw.irn)
        : undefined,
    taxes,
  exciseTotal:
    taxBreakdown?.excise_total != null
      ? Number(taxBreakdown.excise_total)
      : Number(order?.excise_amount ?? 0) || undefined,
    vatTotal: taxBreakdown?.vat_only,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    synced: true,
  };
}

export function mapApiReceipt(raw: ApiReceipt): ReceiptRecord {
  const invoice = raw.invoice;
  const salesOrder = invoice?.salesOrder;
  const customer = salesOrder?.customer ?? invoice?.order?.customer;
  const transactionDetails = raw.transaction_details;
  const rrnRaw = raw.eirms_rrn ?? raw.eirmsRrn ?? raw.eirmsIrn ?? raw.eirms_irn;
  const collectedAmount = Number(raw.collected_amount ?? raw.total ?? raw.amount ?? 0);
  const modeOfPayment =
    raw.mode_of_payment ??
    raw.modeOfPayment ??
    transactionDetails?.mode_of_payment ??
    salesOrder?.mode_of_payment;
  const collectorName =
    raw.collector_name ?? transactionDetails?.collector_name ?? undefined;

  const mappedCustomer: ReceiptCustomer | undefined = customer
    ? {
        id: customer.id ? String(customer.id) : undefined,
        name: customer.name ? String(customer.name) : undefined,
        email: customer.email ? String(customer.email) : undefined,
        phone: customer.phone ? String(customer.phone) : undefined,
        taxId: customer.tax_id ? String(customer.tax_id) : undefined,
        vatNumber: customer.vat_number ? String(customer.vat_number) : undefined,
        transactionType: customer.transaction_type
          ? String(customer.transaction_type)
          : undefined,
        city: customer.city ? String(customer.city) : undefined,
        country: customer.country ? String(customer.country) : undefined,
        region: customer.region ? String(customer.region) : undefined,
        zone: customer.zone ? String(customer.zone) : undefined,
        wereda: customer.wereda ? String(customer.wereda) : undefined,
        kebele: customer.kebele ? String(customer.kebele) : undefined,
        street: customer.street ? String(customer.street) : undefined,
        houseNumber: customer.house_number ? String(customer.house_number) : undefined,
        subCity: customer.sub_city ? String(customer.sub_city) : undefined,
      }
    : undefined;

  return {
    id: String(raw.id),
    number: String(
      raw.receipt_number ??
        raw.receiptNumber ??
        raw.invoice_number ??
        raw.invoiceNumber ??
        raw.id
    ),
    clientName: String(
      customer?.name ??
        raw.client_name ??
        raw.customer_name ??
        collectorName ??
        'Guest'
    ),
    amount: collectedAmount,
    collectedAmount: collectedAmount || undefined,
    type: raw.type ? String(raw.type) : 'Receipt',
    status: invoice?.status ? String(invoice.status) : raw.status ? String(raw.status) : undefined,
    eirmsStatus:
      raw.eims_status ?? raw.eirms_status
        ? String(raw.eims_status ?? raw.eirms_status)
        : undefined,
    rrn: rrnRaw ? String(rrnRaw) : undefined,
    eirmsIrn: raw.eirmsIrn ?? raw.eirms_irn ? String(raw.eirmsIrn ?? raw.eirms_irn) : undefined,
    receiptUuid: raw.receipt_uuid ?? raw.receiptUuid
      ? String(raw.receipt_uuid ?? raw.receiptUuid)
      : undefined,
    invoiceUuid: raw.invoice_uuid ?? raw.invoiceUuid
      ? String(raw.invoice_uuid ?? raw.invoiceUuid)
      : undefined,
    paymentCoverage: raw.payment_coverage ?? raw.paymentCoverage
      ? String(raw.payment_coverage ?? raw.paymentCoverage)
      : undefined,
    reason: raw.reason ? String(raw.reason) : undefined,
    eimsErrorMessage:
      raw.eims_error_message ?? raw.eirmsErrorMessage
        ? String(raw.eims_error_message ?? raw.eirmsErrorMessage)
        : undefined,
    modeOfPayment: modeOfPayment ? String(modeOfPayment) : undefined,
    collectorName: collectorName ? String(collectorName) : undefined,
    qrBase64: raw.qr_base64 ?? raw.qrBase64
      ? String(raw.qr_base64 ?? raw.qrBase64)
      : undefined,
    eirmsDocumentNumber:
      raw.eirms_document_number ?? raw.eirmsDocumentNumber
        ? String(raw.eirms_document_number ?? raw.eirmsDocumentNumber)
        : undefined,
    eirmsAckDate: raw.eirmsAckDate ? String(raw.eirmsAckDate) : undefined,
    receiptCounter:
      raw.receipt_counter ?? raw.receiptCounter != null
        ? String(raw.receipt_counter ?? raw.receiptCounter)
        : undefined,
    invoice: invoice
      ? {
          id: invoice.id ? String(invoice.id) : undefined,
          invoiceNumber: invoice.invoice_number ?? invoice.invoiceNumber
            ? String(invoice.invoice_number ?? invoice.invoiceNumber)
            : undefined,
          totalValue: Number(invoice.total_value ?? 0) || undefined,
          paidAmount: Number(invoice.paid_amount ?? 0) || undefined,
          status: invoice.status ? String(invoice.status) : undefined,
          eirmsIrn: invoice.eirmsIrn ?? invoice.eirms_irn
            ? String(invoice.eirmsIrn ?? invoice.eirms_irn)
            : undefined,
          eirmsAckDate: invoice.eirmsAckDate ? String(invoice.eirmsAckDate) : undefined,
          withheldAmount: Number(invoice.withheld_amount ?? 0) || undefined,
          orderNumber: salesOrder?.order_number ?? salesOrder?.orderNumber
            ? String(salesOrder.order_number ?? salesOrder.orderNumber)
            : invoice.order?.order_number
              ? String(invoice.order.order_number)
              : undefined,
          salesOrderSubtotal: Number(salesOrder?.subtotal ?? 0) || undefined,
          salesOrderTaxAmount: Number(salesOrder?.tax_amount ?? 0) || undefined,
          salesOrderExciseAmount: Number(salesOrder?.excise_amount ?? 0) || undefined,
          salesOrderDiscountAmount: Number(salesOrder?.discount_amount ?? 0) || undefined,
          salesOrderTotal: Number(salesOrder?.total ?? 0) || undefined,
          salesOrderStatus: salesOrder?.status ? String(salesOrder.status) : undefined,
          currency: salesOrder?.currency ? String(salesOrder.currency) : undefined,
          modeOfPayment: salesOrder?.mode_of_payment
            ? String(salesOrder.mode_of_payment)
            : undefined,
          customer: mappedCustomer,
        }
      : undefined,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    updatedAt: raw.updated_at ?? raw.updatedAt
      ? String(raw.updated_at ?? raw.updatedAt)
      : undefined,
  };
}

export function mapApiCustomer(raw: ApiCustomer): CustomerRecord {
  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.full_name ?? raw.fullName ?? 'Customer'),
    email: raw.email ? String(raw.email) : undefined,
    phone: raw.phone ?? raw.mobile ? String(raw.phone ?? raw.mobile) : undefined,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
  };
}

export function mapApiWithholdingReceipt(raw: ApiWithholdingReceipt): WithholdingRecord {
  const supplier = raw.supplier;
  const organization = raw.organization;
  const rrnRaw = raw.eirms_rrn ?? raw.eirmsRrn;
  const eirmsIrnRaw = raw.eirms_irn ?? raw.eirmsIrn;
  const invoiceIrnRaw = raw.invoice_irn ?? raw.invoiceIrn;
  const withholdingAmount = Number(raw.withholdingAmount ?? raw.withholding_amount ?? raw.amount ?? raw.total ?? 0);
  const preTaxAmount = Number(raw.preTaxAmount ?? raw.pre_tax_amount ?? 0);
  const exchangeRateRaw = raw.exchangeRate ?? raw.exchange_rate;

  return {
    id: String(raw.id),
    number: String(
      raw.receiptNumber ??
        raw.receipt_number ??
        raw.withholding_number ??
        raw.withholdingNumber ??
        raw.reference ??
        raw.number ??
        raw.id
    ),
    clientName: String(
      supplier?.name ??
        raw.supplier_name ??
        raw.vendor_name ??
        raw.partner_name ??
        raw.client_name ??
        raw.customer_name ??
        raw.buyer_name ??
        'Supplier'
    ),
    amount: withholdingAmount,
    preTaxAmount: preTaxAmount || undefined,
    withholdingAmount: withholdingAmount || undefined,
    status: raw.status ? String(raw.status) : undefined,
    eirmsStatus:
      raw.eims_status ?? raw.eirms_status
        ? String(raw.eims_status ?? raw.eirms_status)
        : undefined,
    rrn: rrnRaw ? String(rrnRaw) : undefined,
    irn: eirmsIrnRaw ? String(eirmsIrnRaw) : invoiceIrnRaw ? String(invoiceIrnRaw) : undefined,
    invoiceIrn: invoiceIrnRaw ? String(invoiceIrnRaw) : undefined,
    reason: raw.reason ? String(raw.reason) : undefined,
    receiptCounter: raw.receiptCounter ?? raw.receipt_counter
      ? String(raw.receiptCounter ?? raw.receipt_counter)
      : undefined,
    manualReceiptNumber: raw.manualReceiptNumber ?? raw.manual_receipt_number
      ? String(raw.manualReceiptNumber ?? raw.manual_receipt_number)
      : undefined,
    sourceSystemType: raw.sourceSystemType ?? raw.source_system_type
      ? String(raw.sourceSystemType ?? raw.source_system_type)
      : undefined,
    sourceSystemNumber: raw.sourceSystemNumber ?? raw.source_system_number
      ? String(raw.sourceSystemNumber ?? raw.source_system_number)
      : undefined,
    currency: raw.currency ? String(raw.currency) : undefined,
    exchangeRate:
      exchangeRateRaw == null || exchangeRateRaw === ''
        ? null
        : Number(exchangeRateRaw),
    withholdType: raw.withholdType ?? raw.withhold_type
      ? String(raw.withholdType ?? raw.withhold_type)
      : undefined,
    withholdRate:
      raw.withholdRate != null || raw.withhold_rate != null
        ? Number(raw.withholdRate ?? raw.withhold_rate)
        : undefined,
    withholdingCategory: raw.withholdingCategory ?? raw.withholding_category
      ? String(raw.withholdingCategory ?? raw.withholding_category)
      : undefined,
    organizationName: organization?.name ? String(organization.name) : undefined,
    qrBase64: raw.qrBase64 ?? raw.qr_base64
      ? String(raw.qrBase64 ?? raw.qr_base64)
      : undefined,
    supplier: supplier
      ? {
          id: supplier.id ? String(supplier.id) : undefined,
          name: supplier.name ? String(supplier.name) : undefined,
          email: supplier.email ? String(supplier.email) : undefined,
          phone: supplier.phone ? String(supplier.phone) : undefined,
          taxId: supplier.tax_id ? String(supplier.tax_id) : undefined,
          transactionType: supplier.transaction_type
            ? String(supplier.transaction_type)
            : undefined,
          address: supplier.address ? String(supplier.address) : undefined,
        }
      : undefined,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    updatedAt: raw.updated_at ?? raw.updatedAt
      ? String(raw.updated_at ?? raw.updatedAt)
      : undefined,
  };
}

export function getAccessToken(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const r = response as Record<string, unknown>;
  const data = r.data as Record<string, unknown> | undefined;
  return String(
    r.access_token ??
      r.accessToken ??
      data?.access_token ??
      data?.accessToken ??
      ''
  ) || null;
}

export function getRefreshToken(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const r = response as Record<string, unknown>;
  const data = r.data as Record<string, unknown> | undefined;
  return String(
    r.refreshToken ??
      r.refresh_token ??
      data?.refreshToken ??
      data?.refresh_token ??
      ''
  ) || null;
}

import { ApiError } from '@/services/apiClient';
import { SalesSessionError } from '@/services/sessionService';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof SalesSessionError) return error.message;
  if (error instanceof ApiError) {
    if (__DEV__) {
      return `${error.message} (${error.status})`;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

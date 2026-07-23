export type PurchaseDocumentType = 'invoices' | 'receipts' | 'returns';

/** Normalized purchase document (supplier invoice, receipt or return). */
export interface PurchaseDocumentRecord {
  id: string;
  number: string;
  supplierName: string;
  total: number;
  currency?: string;
  status?: string;
  eimsStatus?: string;
  reference?: string;
  purchaseOrderNumber?: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  productId?: string;
  description: string;
  uom: string;
  unitPrice: number;
  qty: number;
  discountAmount: number;
  amount: number;
  taxesId: string[];
  lineNumber?: number;
}

export interface PurchaseInvoiceDetail {
  id: string;
  piNumber: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  supplierId?: string;
  supplierName: string;
  supplierTransactionType?: string;
  warehouseId?: string;
  warehouseName?: string;
  status?: string;
  invoiceDate?: string;
  totalQty: number;
  totalAmount: number;
  totalTaxes: number;
  totalDiscount: number;
  grandTotal: number;
  outstandingAmount: number;
  paidAmount: number;
  invoiceIrn?: string;
  remarks?: string;
  items: PurchaseInvoiceItem[];
  createdAt: string;
  updatedAt?: string;
}

/** Loose shape of a purchase document as returned by the API. */
export interface ApiPurchaseDocument {
  id?: string;
  uuid?: string;
  invoice_uuid?: string;

  number?: string;
  document_number?: string;
  documentNumber?: string;
  pi_number?: string;
  pr_number?: string;
  purchase_invoice_number?: string | null;
  invoice_number?: string;
  invoiceNumber?: string;
  receipt_number?: string;
  receiptNumber?: string;
  return_number?: string;
  returnNumber?: string;
  purchase_order_id?: string | null;
  purchase_order_number?: string | null;
  reference?: string;
  reference_number?: string;

  supplier_id?: string;
  supplier_transaction_type?: string;
  supplier_name?: string;
  supplierName?: string;
  vendor_name?: string;
  vendorName?: string;
  partner_name?: string;
  partnerName?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  invoice_date?: string;
  invoice_irn?: string | null;
  remarks?: string | null;
  total_qty?: number | string;
  total_taxes?: number | string;
  total_discount?: number | string;
  items?: ApiPurchaseInvoiceLine[];
  taxes_and_charges?: unknown[];
  supplier?: { name?: string } | null;
  vendor?: { name?: string } | null;
  partner?: { name?: string } | null;

  total?: number | string;
  total_amount?: number | string;
  totalAmount?: number | string;
  amount?: number | string;
  grand_total?: number | string;
  grandTotal?: number | string;
  outstanding_amount?: number | string;
  paid_amount?: number | string;

  currency?: string;

  status?: string;
  payment_status?: string;
  paymentStatus?: string;
  eims_status?: string;
  eimsStatus?: string;
  eirms_status?: string;
  eirmsStatus?: string;

  receipt_date?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ApiPurchaseInvoiceLine {
  id?: string;
  product_id?: string;
  uom?: string;
  description?: string;
  unit_price?: number | string;
  qty?: number | string;
  discount_amount?: number | string;
  amount?: number | string;
  taxes_id?: string[];
  sequence?: number;
  line_number?: number;
}

/** Aggregate report returned alongside a purchase document list. */
export interface PurchaseSummary {
  totalCount: number;
  completedCount: number;
  partialCount: number;
  pendingCount: number;
  paidAmount: number;
  totalOutstanding: number;
}

export interface ApiPurchaseSummary {
  total_count?: number;
  completed_count?: number;
  partial_count?: number;
  pending_count?: number;
  paid_amount?: number;
  total_outstanding?: number;
}

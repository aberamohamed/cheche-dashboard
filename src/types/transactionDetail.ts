import type { InvoiceTaxLine } from '@/types';

export interface TransactionDetailItem {
  key: string;
  lineId?: string;
  productId?: string;
  name: string;
  variantName?: string;
  sku?: string;
  uom?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
  tax?: number;
  excise?: number;
  taxCode?: string;
}

export interface TransactionDetail {
  recordId?: string;
  invoiceNumber: string;
  createdAt: string;
  customerName?: string;
  invoiceType?: string;
  status?: string;
  eirmsStatus?: string;
  irn?: string;
  rrn?: string;
  invoiceUuid?: string;
  posOrderUuid?: string;
  orderNumber?: string;
  transactionType?: string;
  sellerTin?: string;
  buyerTin?: string;
  eirmsDocumentNumber?: string;
  eirmsAckDate?: string;
  items: TransactionDetailItem[];
  subtotal: number;
  discount: number;
  taxValue: number;
  paidAmount: number;
  total: number;
  taxes: InvoiceTaxLine[];
  exciseTotal?: number;
  vatTotal?: number;
  paymentMethod: string;
  receivedAmount?: number;
  changeAmount?: number;
  withholding?: WithholdingDetail;
  receipt?: ReceiptDetail;
}

export interface ReceiptDetail {
  receiptUuid?: string;
  invoiceUuid?: string;
  reason?: string;
  receiptCounter?: string;
  paymentCoverage?: string;
  modeOfPayment?: string;
  collectorName?: string;
  eirmsIrn?: string;
  eirmsRrn?: string;
  eirmsDocumentNumber?: string;
  eirmsAckDate?: string;
  eimsErrorMessage?: string;
  qrBase64?: string;
  updatedAt?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  invoiceTotal?: number;
  invoicePaidAmount?: number;
  invoiceWithheldAmount?: number;
  invoiceEirmsIrn?: string;
  invoiceEirmsAckDate?: string;
  orderNumber?: string;
  salesOrderStatus?: string;
  currency?: string;
  salesOrderSubtotal?: number;
  salesOrderTaxAmount?: number;
  salesOrderExciseAmount?: number;
  salesOrderDiscountAmount?: number;
  salesOrderTotal?: number;
  salesOrderModeOfPayment?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerTaxId?: string;
  customerVatNumber?: string;
  customerTransactionType?: string;
  customerCity?: string;
  customerCountry?: string;
  customerRegion?: string;
  customerZone?: string;
  customerWereda?: string;
  customerKebele?: string;
  customerStreet?: string;
  customerHouseNumber?: string;
  customerSubCity?: string;
  collectedAmount?: number;
}

export interface WithholdingDetail {
  reason?: string;
  receiptCounter?: string;
  manualReceiptNumber?: string;
  sourceSystemType?: string;
  sourceSystemNumber?: string;
  invoiceIrn?: string;
  currency?: string;
  exchangeRate?: number | null;
  withholdType?: string;
  withholdRate?: number;
  withholdingCategory?: string;
  preTaxAmount?: number;
  withholdingAmount?: number;
  organizationName?: string;
  qrBase64?: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierTaxId?: string;
  supplierTransactionType?: string;
  supplierAddress?: string;
  updatedAt?: string;
}

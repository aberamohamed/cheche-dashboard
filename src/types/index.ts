export type PaymentMethod = 'cash' | 'card' | 'mobile';

export type BusinessType =
  | 'retail'
  | 'restaurant'
  | 'grocery'
  | 'pharmacy'
  | 'electronics'
  | 'other';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  profilePhoto?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  location?: string;
  ownerId: string;
  createdAt: string;
}

export interface OrganizationBranch {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  stock: number;
  taxesIds?: string[];
  image?: string;
}

export interface Product {
  id: string;
  /** UUID sent as `product_id` on POS order lines */
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  categoryId?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  uomId?: string;
  taxesIds?: string[];
  /** Sale-tax snapshot for offline catalog (rates preserved without the taxes store). */
  taxes?: Array<{
    id: string;
    name: string;
    rate: number;
    taxType?: string;
  }>;
  variants?: ProductVariant[];
  variantName?: string;
  description?: string;
  image?: string;
  lowStockAlert: number;
  productType?: string;
  brandId?: string;
  brandName?: string;
  hsCode?: string;
  hsRate?: number;
  maxStockQty?: number;
  isStockItem?: boolean;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product_id: string;
  product: Product;
  quantity: number;
}

export interface InvoiceTaxLine {
  name: string;
  type: string;
  rate: number;
  amount: number;
}

export interface SaleItem {
  lineId?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
  tax?: number;
  excise?: number;
  uom?: string;
  taxCode?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  invoiceUuid?: string;
  posOrderUuid?: string;
  orderNumber?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  taxValue: number;
  paidAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  receivedAmount?: number;
  changeAmount?: number;
  customerName?: string;
  status?: string;
  invoiceType?: string;
  eirmsStatus?: string;
  transactionType?: string;
  sellerTin?: string;
  buyerTin?: string;
  eirmsDocumentNumber?: string;
  eirmsAckDate?: string;
  irn?: string;
  taxes: InvoiceTaxLine[];
  exciseTotal?: number;
  vatTotal?: number;
  createdAt: string;
  synced: boolean;
}

export interface ReceiptCustomer {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  vatNumber?: string;
  transactionType?: string;
  city?: string;
  country?: string;
  region?: string;
  zone?: string;
  wereda?: string;
  kebele?: string;
  street?: string;
  houseNumber?: string;
  subCity?: string;
}

export interface ReceiptInvoiceSummary {
  id?: string;
  invoiceNumber?: string;
  totalValue?: number;
  paidAmount?: number;
  status?: string;
  eirmsIrn?: string;
  eirmsAckDate?: string;
  withheldAmount?: number;
  orderNumber?: string;
  salesOrderSubtotal?: number;
  salesOrderTaxAmount?: number;
  salesOrderExciseAmount?: number;
  salesOrderDiscountAmount?: number;
  salesOrderTotal?: number;
  salesOrderStatus?: string;
  currency?: string;
  modeOfPayment?: string;
  customer?: ReceiptCustomer;
}

export interface ReceiptRecord {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  type?: string;
  status?: string;
  eirmsStatus?: string;
  /** Receipt reference number for tax document lookup */
  rrn?: string;
  createdAt: string;
  updatedAt?: string;
  receiptUuid?: string;
  invoiceUuid?: string;
  collectedAmount?: number;
  paymentCoverage?: string;
  reason?: string;
  eirmsIrn?: string;
  eimsErrorMessage?: string;
  modeOfPayment?: string;
  collectorName?: string;
  qrBase64?: string;
  eirmsDocumentNumber?: string;
  eirmsAckDate?: string;
  receiptCounter?: string;
  invoice?: ReceiptInvoiceSummary;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface WithholdingSupplier {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  transactionType?: string;
  address?: string;
}

export interface WithholdingRecord {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status?: string;
  eirmsStatus?: string;
  irn?: string;
  rrn?: string;
  createdAt: string;
  updatedAt?: string;
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
  supplier?: WithholdingSupplier;
}

export interface DashboardStats {
  todaySales: number;
  totalRevenue: number;
  totalOrders: number;
  productsSold: number;
  profit: number;
  averageSale: number;
  salesChange: number;
  ordersChange: number;
  productsChange: number;
  profitChange: number;
}

export interface DashboardData extends DashboardStats {
  totalProducts: number;
  totalPurchases: number;
  chartData: ChartDataPoint[];
  statTrends: {
    sales: number[];
    transactions: number[];
    itemsSold: number[];
    averageSale: number[];
  };
  topProducts: TopProduct[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TopProduct {
  product: Product;
  quantitySold: number;
  revenue: number;
}

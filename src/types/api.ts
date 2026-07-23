export interface ApiPaginated<T> {
  data?: T[];
  total?: number;
  page?: number;
  page_size?: number;
}

export interface ApiUser {
  id: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  organization_id?: string;
  roles?: string[];
}

export interface ApiOrganization {
  id: string;
  name?: string;
  organizationName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logo?: string;
  logoUrl?: string;
  image?: string;
}

export interface ApiBranch {
  id: string;
  name?: string;
  branch_name?: string;
  workspace_name?: string;
  workspaceName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  organization_id?: string;
  organizationId?: string;
}

export interface ApiLoginResponse {
  access_token?: string;
  accessToken?: string;
  refreshToken?: string;
  refresh_token?: string;
  mfaRequired?: boolean;
  user?: ApiUser;
  data?: {
    access_token?: string;
    accessToken?: string;
    refreshToken?: string;
    refresh_token?: string;
    user?: ApiUser;
    mfaRequired?: boolean;
  };
}

export interface ApiCategory {
  id: string;
  name: string;
  code?: string;
  default_code?: string;
  description?: string;
  parent_id?: string;
  parent_category_id?: string;
  taxes_id?: string[];
  supplier_taxes_id?: string[];
  effective_taxes_id?: string[];
  active?: boolean;
  is_active?: boolean;
  eirms_item_category_id?: string;
  eirms_item_category_name?: string;
  eirms_item_category_code?: string;
  eirms_tax_code?: string;
}

export interface ApiGovernmentItemCategory {
  id: string;
  name: string;
  code: string;
  natureOfSupplyCode?: string;
  parentId?: string | null;
  defaultTaxCode?: string;
  taxCodes?: string[];
}

export interface ApiProduct {
  id?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  default_code?: string;
  sku?: string;
  barcode?: string | null;
  category_id?: string;
  category_name?: string;
  category?: string | ApiCategory;
  standard_price?: number | string;
  cost_price?: number | string;
  list_price?: number | string;
  selling_price?: number | string;
  qty_on_hand?: number;
  qty_available?: number;
  stock?: number;
  quantity?: number;
  uom_id?: string;
  uom_name?: string;
  uom?: { id?: string; name?: string };
  taxes_id?: string[];
  effective_taxes_id?: string[];
  use_category_tax?: boolean;
  unit?: string;
  description?: string;
  image_url?: string | null;
  min_stock_qty?: number | string;
  max_stock_qty?: number | string;
  low_stock_alert?: number;
  type?: string;
  brand_id?: string | null;
  brand_name?: string;
  hs_code?: string;
  hs_rate?: number | string;
  is_stock_item?: boolean;
  expiry_date?: string;
  expiration_date?: string;
  created_at?: string;
  updated_at?: string;
  variants?: Array<{
    id?: string;
    default_code?: string;
    barcode?: string | null;
    combination_name?: string | null;
    list_price_extra?: number | string;
    standard_price?: number | string;
    qty_available?: number;
    effective_taxes_id?: string[];
    image_url?: string | null;
  }>;
}

export interface ApiPaymentMethod {
  id: number | string;
  name?: string;
  code?: string;
  method?: string;
  type?: string;
}

export interface ApiPaymentTerm {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiSalesSession {
  id: string;
  uuid?: string;
  status?: string;
  openingCashAmount?: number;
}

export interface ApiCustomer {
  id: string;
  name?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  created_at?: string;
  createdAt?: string;
}

export interface ApiInvoiceLine {
  id?: string;
  product_id?: string;
  product_name?: string;
  productName?: string;
  sku?: string;
  default_code?: string;
  code?: string;
  quantity?: number | string;
  qty?: number | string;
  unit_price?: number | string;
  unitPrice?: number | string;
  subtotal?: number | string;
  total?: number;
  discount?: number | string;
  tax?: number | string;
  excise?: number | string;
  excise_tax?: number | string;
  tax_code?: string;
  uom?: string;
  nature?: string;
  product?: {
    default_code?: string;
    template?: { name?: string; default_code?: string };
  };
}

export interface ApiInvoiceTax {
  id?: number | string;
  tax_name?: string;
  tax_type?: string;
  rate?: number | string;
  amount?: number | string;
}

export interface ApiInvoiceTaxBreakdown {
  excise_total?: number;
  vat_only?: number;
  vat_plus_excise?: number;
  invoice_total?: number;
  payment_total?: number;
}

export interface ApiInvoiceOrder {
  uuid?: string;
  order_number?: string;
  subtotal?: number | string;
  tax_amount?: number | string;
  discount_amount?: number | string;
  total?: number | string;
  paid_amount?: number | string;
  excise_amount?: number | string;
  lines?: ApiInvoiceLine[];
}

export interface ApiInvoice {
  id: string;
  organizationId?: string;
  invoice_number?: string;
  invoiceNumber?: string;
  invoice_uuid?: string;
  invoiceUuid?: string;
  pos_order_uuid?: string;
  total?: number;
  amount?: number;
  total_value?: number | string;
  paid_amount?: number | string;
  tax_value?: number | string;
  subtotal?: number;
  discount?: number;
  status?: string;
  payment_method?: string;
  paymentMethod?: string;
  customer_name?: string;
  client_name?: string;
  type?: string;
  invoice_type?: string;
  transaction_type?: string;
  seller_tin?: string;
  buyer_tin?: string;
  eims_status?: string;
  eirms_status?: string;
  eirms_irn?: string;
  eirmsIrn?: string;
  irn?: string;
  eirmsDocumentNumber?: string;
  eirmsAckDate?: string;
  created_at?: string;
  createdAt?: string;
  lines?: ApiInvoiceLine[];
  items?: ApiInvoiceLine[];
  invoiceTaxes?: ApiInvoiceTax[];
  tax_breakdown?: ApiInvoiceTaxBreakdown;
  order?: ApiInvoiceOrder;
}

export interface ApiReceiptCustomer {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  vat_number?: string;
  transaction_type?: string;
  city?: string;
  country?: string;
  region?: string;
  zone?: string;
  wereda?: string;
  kebele?: string;
  street?: string;
  house_number?: string;
  sub_city?: string;
}

export interface ApiReceiptSalesOrder {
  id?: string;
  order_number?: string;
  orderNumber?: string;
  status?: string;
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  excise_amount?: string | number;
  discount_amount?: string | number;
  total?: string | number;
  mode_of_payment?: string;
  buyer_tin?: string | null;
  customer?: ApiReceiptCustomer;
}

export interface ApiReceiptInvoice {
  id?: string;
  invoice_number?: string;
  invoiceNumber?: string;
  total_value?: string | number;
  paid_amount?: string | number;
  status?: string;
  eirmsIrn?: string;
  eirms_irn?: string;
  eirmsAckDate?: string;
  withheld_amount?: number | string;
  salesOrder?: ApiReceiptSalesOrder;
  order?: {
    customer?: ApiReceiptCustomer | null;
    order_number?: string;
  };
}

export interface ApiReceipt {
  id: string;
  receipt_uuid?: string;
  receiptUuid?: string;
  receipt_number?: string;
  receiptNumber?: string;
  invoice_uuid?: string;
  invoiceUuid?: string;
  invoice_number?: string;
  invoiceNumber?: string;
  client_name?: string;
  customer_name?: string;
  collector_name?: string;
  collected_amount?: string | number;
  payment_coverage?: string;
  paymentCoverage?: string;
  reason?: string;
  total?: number;
  amount?: number;
  status?: string;
  type?: string;
  eims_status?: string;
  eirms_status?: string;
  eims_error_message?: string | null;
  eirmsErrorMessage?: string | null;
  eirms_rrn?: string;
  eirmsRrn?: string;
  eirmsIrn?: string;
  eirms_irn?: string;
  eirms_document_number?: string | null;
  eirmsDocumentNumber?: string | null;
  eirmsAckDate?: string | null;
  mode_of_payment?: string;
  modeOfPayment?: string;
  qr_base64?: string;
  qrBase64?: string;
  receipt_counter?: string | number;
  receiptCounter?: string | number;
  transaction_details?: {
    mode_of_payment?: string;
    collector_name?: string;
  };
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  invoice?: ApiReceiptInvoice;
}

export interface ApiWithholdingSupplier {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  transaction_type?: string;
  address?: string;
}

export interface ApiWithholdingOrganization {
  id?: string;
  name?: string;
}

export interface ApiWithholdingReceipt {
  id: string;
  receipt_number?: string;
  receiptNumber?: string;
  withholding_number?: string;
  withholdingNumber?: string;
  number?: string;
  reference?: string;
  reason?: string;
  receipt_counter?: string;
  receiptCounter?: string;
  manual_receipt_number?: string;
  manualReceiptNumber?: string;
  source_system_type?: string;
  sourceSystemType?: string;
  source_system_number?: string;
  sourceSystemNumber?: string;
  invoice_irn?: string;
  invoiceIrn?: string;
  currency?: string;
  exchange_rate?: number | string | null;
  exchangeRate?: number | string | null;
  withhold_type?: string;
  withholdType?: string;
  withhold_rate?: number | string;
  withholdRate?: number | string;
  withholding_category?: string;
  withholdingCategory?: string;
  pre_tax_amount?: number | string;
  preTaxAmount?: number | string;
  withholding_amount?: number | string;
  withholdingAmount?: number | string;
  supplier_name?: string;
  vendor_name?: string;
  partner_name?: string;
  client_name?: string;
  customer_name?: string;
  buyer_name?: string;
  total?: number | string;
  amount?: number | string;
  status?: string;
  eims_status?: string;
  eirms_status?: string;
  eirms_rrn?: string;
  eirmsRrn?: string;
  eirms_irn?: string;
  eirmsIrn?: string;
  irn?: string;
  qr_base64?: string;
  qrBase64?: string;
  supplier?: ApiWithholdingSupplier;
  organization?: ApiWithholdingOrganization;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ApiPurchaseOrder {
  id: string;
  total?: number;
  amount?: number;
  created_at?: string;
}

export interface ApiCouponValidation {
  valid?: boolean;
  discount_amount?: number;
  discountAmount?: number;
  message?: string;
}

export interface ApiGiftCardBalance {
  code?: string;
  balance?: number;
  available_balance?: number;
}

export interface ApiPosOrder {
  uuid?: string;
  id?: string;
  order_number?: string;
  status?: string;
  total?: number;
  pending?: boolean;
  invoice_uuid?: string;
  invoice_number?: string;
  invoiceNumber?: string;
  cheche_transaction_id?: string;
  checheTransactionId?: string;
  cheche_order_id?: string;
  checheOrderId?: string;
}

export interface PosPaymentPayload {
  method_id: number | string;
  method: string;
  amount: number;
  currency?: string;
}

export interface CreatePosOrderLinePayload {
  product_id: string;
  uom_id: string;
  qty: number;
  unit_price: number;
  discount: number;
  taxes_id: string[];
}

export interface CreatePosOrderPayload {
  order_number: string;
  currency: string;
  lines: CreatePosOrderLinePayload[];
  payments: PosPaymentPayload[];
  session_id: string;
  payment_mode: 'CASH' | 'CREDIT';
  payment_term_id?: string | null;
  customer_id?: string | null;
  walk_in_phone?: string | null;
  coupon_id: null;
  coupon_discount: number;
  gift_card_number: null;
  gift_card_discount: number;
  loyalty_points: number;
  loyalty_discount: number;
  applied_promotions: unknown[];
  total_discount: number;
}

export interface ApiIrnBody {
  statusCode?: number;
  message?: string;
  body?: {
    irn?: string;
    ackDate?: string;
    signedQR?: string;
    status?: string;
    documentNumber?: string;
    signedInvoice?: string;
    errorMessage?: string | null;
  };
}

export interface ApiPosPaymentRecord {
  id?: string;
  reference?: string;
  amount?: string | number;
  currency?: string;
  status?: string;
  method_id?: string;
}

export interface ApiPayOrderResponse {
  id?: string;
  invoice_uuid?: string;
  invoice_number?: string;
  invoiceNumber?: string;
  status?: string;
  total?: number;
  total_value?: string;
  pending?: boolean;
  cheche_transaction_id?: string;
  checheTransactionId?: string;
  cheche_order_id?: string;
  checheOrderId?: string;
  eirmsIrn?: string | null;
  irn?: string;
  irnBody?: ApiIrnBody;
  payments?: ApiPosPaymentRecord[];
  message?: string;
}

export interface PayOrderPayload {
  payments: PosPaymentPayload[];
  phoneNumber?: string;
  gift_card_code?: string;
  coupon_code?: string;
  bank_name?: string;
}

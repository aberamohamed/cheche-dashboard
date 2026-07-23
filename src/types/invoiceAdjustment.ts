export type MemoType = 'CRE' | 'DEB';

export interface MemoLineItem {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  discount: number;
  original_qty: number;
  original_price: number;
  original_discount: number;
  tax_code?: string;
  uom?: string;
  code?: string;
  reference_tax: number;
  reference_excise: number;
}

export interface MemoSubmitItem {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  discount: number;
}

export interface MemoTaxSummary {
  grossSubtotal: number;
  discount: number;
  excise: number;
  taxableTotal: number;
  vat: number;
  grandTotal: number;
}

export interface MemoLineTotals {
  base: number;
  excise: number;
  vat: number;
  total: number;
}

export interface EimsCancelReason {
  code: string;
  label: string;
}

export const EIMS_CANCEL_REASONS: EimsCancelReason[] = [
  { code: '1', label: 'Duplicate Issue11111' },
  { code: '2', label: 'Data Entry Error' },
  { code: '3', label: 'Order Cancelled' },
  { code: '4', label: 'Goods Returned' },
  { code: '5', label: 'Invoice Issued in Error' },
  { code: '6', label: 'Other' },
];

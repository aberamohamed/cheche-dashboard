import type { CartItem } from '@/types';

export interface ReceiptData {
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  receivedAmount?: number;
  changeAmount?: number;
  businessName?: string;
  businessLogo?: string;
  businessAddress?: string;
  businessPhone?: string;
  operatorName?: string;
  customerName?: string;
  customerPhone?: string;
  taxAmount?: number;
  vatAmount?: number;
  otherTaxAmount?: number;
  createdAt: string;
  /** Payment reference from pay response — thermal receipt number */
  receiptNumber?: string;
  /** IRN from pay-order response — used for official tax document print/download */
  irn?: string;
  /** RRN from receipt record — used for receipt tax documents */
  rrn?: string;
  /** Invoice record id — used when IRN is unavailable */
  invoiceId?: string;
  /** True for offline sales awaiting sync — no fiscal IRN has been issued yet. */
  provisional?: boolean;
  /** Fiscal QR image (raw base64, no data: prefix) for receipt footer. */
  qrBase64?: string;
  /** Optional service charge shown after subtotal (restaurant-style receipts). */
  serviceChargeAmount?: number;
}

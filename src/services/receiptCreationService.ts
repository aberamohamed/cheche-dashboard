//Credit sales payment service

import { apiRequest } from '@/services/apiClient';

export type PaymentCoverage = 'FULL' | 'PARTIAL';
export type ReceiptPaymentMode = 'CASH' | 'BANK' | 'CHEQUE' | 'OTHER';

export interface CreateReceiptInvoiceInput {
  id: string;
  irn?: string;
  paymentCoverage: PaymentCoverage;
  invoicePaidAmount: number;
  remainingAmount: number;
  totalAmount: number;
}

export interface CreateReceiptInput {
  reason: string;
  collectedAmount: number;
  invoice: CreateReceiptInvoiceInput;
  modeOfPayment: ReceiptPaymentMode;
  collectorName: string;
  provider?: string;
  providerName?: string;
  accountNumber?: string;
  transactionNumber?: string;
}

export async function createInvoiceReceipt(input: CreateReceiptInput): Promise<unknown> {
  return apiRequest('/invoicing/receipts', {
    method: 'POST',
    body: {
      reason: input.reason,
      collected_amount: input.collectedAmount,
      invoices: [
        {
          id: input.invoice.id,
          irn: input.invoice.irn || 'null',
          payment_coverage: input.invoice.paymentCoverage,
          invoice_paid_amount: input.invoice.invoicePaidAmount,
          discount_amount: null,
          remaining_amount: input.invoice.remainingAmount,
          total_amount: input.invoice.totalAmount,
        },
      ],
      transaction_details: {
        mode_of_payment: input.modeOfPayment,
        cheque_number: null,
        cpo_number: null,
        document_number: null,
        collector_name: input.collectorName,
        payment_service_provider: input.provider || '',
        payment_service_provider_name: input.providerName || '',
        other_payment_service_provider_name: null,
        account_number: input.accountNumber || '',
        transaction_number: input.transactionNumber || '',
      },
    },
  });
}

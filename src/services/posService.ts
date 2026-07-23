import { POS_CURRENCY, POS_ORDER_DEFAULTS, POS_UOM_ID } from '@/constants/pos';
import { apiRequest } from '@/services/apiClient';
import type {
  ApiCouponValidation,
  ApiGiftCardBalance,
  ApiPayOrderResponse,
  ApiPaymentMethod,
  ApiPaymentTerm,
  ApiPosOrder,
  CreatePosOrderPayload,
  PayOrderPayload,
  PosPaymentPayload,
} from '@/types/api';
import { unwrapData, unwrapList, unwrapPaginated } from '@/utils/apiHelpers';

export function resolvePayOrderIrn(result: ApiPayOrderResponse): string | undefined {
  const irn = result.irn ?? result.irnBody?.body?.irn ?? result.eirmsIrn ?? undefined;
  return irn ? String(irn) : undefined;
}

export function resolvePayOrderReference(result: ApiPayOrderResponse): string | undefined {
  const payments = result.payments;
  if (!payments?.length) return undefined;

  for (const payment of payments) {
    const reference = payment.reference?.trim();
    if (reference) return reference;
  }

  return undefined;
}

function normalizePayOrderResponse(response: unknown): ApiPayOrderResponse {
  if (!response || typeof response !== 'object') {
    return response as ApiPayOrderResponse;
  }

  const record = response as Record<string, unknown>;
  const data =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;
  const irnBody = (record.irnBody ?? data.irnBody) as ApiPayOrderResponse['irnBody'];
  const payments = Array.isArray(record.payments)
    ? (record.payments as ApiPayOrderResponse['payments'])
    : Array.isArray(data.payments)
      ? (data.payments as ApiPayOrderResponse['payments'])
      : undefined;

  const merged: ApiPayOrderResponse = {
    ...(data as ApiPayOrderResponse),
    irnBody,
    payments,
    message: typeof record.message === 'string' ? record.message : undefined,
  };

  const irn = resolvePayOrderIrn(merged);
  if (irn) merged.irn = irn;

  return merged;
}

export interface CreatePosOrderLineInput {
  productId: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  uomId?: string;
  taxesIds?: string[];
}

export type PaymentMode = 'CASH' | 'CREDIT';

export interface CreatePosOrderInput {
  orderNumber: string;
  sessionId: string;
  lines: CreatePosOrderLineInput[];
  payments: Omit<PosPaymentPayload, 'currency'>[];
  paymentMode?: PaymentMode;
  paymentTermId?: string | null;
  customerId?: string | null;
  /** Walk-in contact (phone or email) when no existing customer is selected. */
  walkInPhone?: string | null;
}

/** Builds a create-order body matching the Postman /pos/direct-orders contract. */
export function buildCreatePosOrderPayload(input: CreatePosOrderInput): CreatePosOrderPayload {
  const paymentMode = input.paymentMode ?? 'CASH';
  const customerId = input.customerId?.trim() || null;
  const walkInPhone = input.walkInPhone?.trim() || null;
  const isWalkIn = !customerId && !!walkInPhone;

  const payload: CreatePosOrderPayload = {
    order_number: input.orderNumber,
    currency: POS_CURRENCY,
    lines: input.lines.map((line) => ({
      product_id: line.productId,
      uom_id: line.uomId ?? POS_UOM_ID,
      qty: line.qty,
      unit_price: line.unitPrice,
      discount: line.discount ?? 0,
      taxes_id: line.taxesIds?.length ? [...line.taxesIds] : [],
    })),
    payments: input.payments.map((payment) => ({
      method_id: String(payment.method_id),
      method: payment.method,
      amount: payment.amount,
      currency: POS_CURRENCY,
    })),
    session_id: input.sessionId,
    payment_mode: paymentMode,
    payment_term_id: paymentMode === 'CREDIT' ? input.paymentTermId ?? null : null,
    ...POS_ORDER_DEFAULTS,
    applied_promotions: [...POS_ORDER_DEFAULTS.applied_promotions],
  };

  if (isWalkIn) {
    payload.walk_in_phone = walkInPhone;
  } else if (customerId) {
    payload.customer_id = customerId;
  }

  return payload;
}

export async function getPaymentMethods(): Promise<ApiPaymentMethod[]> {
  const response = await apiRequest<unknown>('/pos/payment-methods');
  return unwrapList<ApiPaymentMethod>(response);
}

export async function getPaymentTerms(): Promise<ApiPaymentTerm[]> {
  const response = await apiRequest<unknown>('/sales/payment-terms?page_size=100');
  return unwrapPaginated<ApiPaymentTerm>(response).data;
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  customerId?: string
): Promise<ApiCouponValidation> {
  const response = await apiRequest<unknown>('/pricing/coupons/validate', {
    method: 'POST',
    body: {
      code,
      cart_total: cartTotal,
      customer_id: customerId,
    },
  });
  return unwrapData<ApiCouponValidation>(response);
}

export async function getGiftCardBalance(code: string): Promise<ApiGiftCardBalance> {
  const response = await apiRequest<unknown>(
    `/pricing/gift-cards/${encodeURIComponent(code)}/balance`
  );
  return unwrapData<ApiGiftCardBalance>(response);
}

export async function createPosOrder(payload: CreatePosOrderPayload): Promise<ApiPosOrder> {
  const response = await apiRequest<unknown>('/pos/direct-orders', {
    method: 'POST',
    body: payload,
  });
  return unwrapData<ApiPosOrder>(response);
}

export async function payPosOrder(
  orderUuid: string,
  payload: PayOrderPayload
): Promise<ApiPayOrderResponse> {
  const response = await apiRequest<unknown>(`/pos/direct-orders/${orderUuid}/pay`, {
    method: 'POST',
    body: payload,
  });
  return normalizePayOrderResponse(response);
}

export async function verifyChecheWalletOtp(
  orderUuid: string,
  otp: string,
  transactionId: string,
  orderId: string
): Promise<ApiPayOrderResponse> {
  const response = await apiRequest<unknown>(
    `/pos/direct-orders/${orderUuid}/cheche-verify-otp`,
    {
      method: 'POST',
      body: {
        otp,
        transactionId,
        orderId,
      },
    }
  );
  return normalizePayOrderResponse(response);
}

export function resolvePaymentMethodCode(method: ApiPaymentMethod): string {
  return String(method.code ?? method.method ?? method.type ?? method.name ?? 'CASH').toUpperCase();
}

export function resolvePaymentMethodLabel(method: ApiPaymentMethod): string {
  return String(method.name ?? method.code ?? method.method ?? 'Payment');
}

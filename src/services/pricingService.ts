import { apiRequest } from '@/services/apiClient';
import type { CreateCouponForm, CreateGiftCardForm } from '@/features/pricing/schemas';
import type { CreateExchangeRateForm } from '@/features/pricing/exchangeRateSchemas';
import { DEFAULT_CURRENCY_CODES } from '@/features/pricing/exchangeRateSchemas';
import type { CreateItemPriceForm } from '@/features/pricing/itemPriceSchemas';
import {
  DEFAULT_PRICE_TYPES,
  type PriceOption,
} from '@/features/pricing/itemPriceSchemas';
import type { CreatePromotionForm } from '@/features/pricing/promotionSchemas';
import {
  DEFAULT_PROMOTION_CONDITIONS,
  DEFAULT_PROMOTION_REWARDS,
  type PromotionOption,
} from '@/features/pricing/promotionSchemas';
import { unwrapData, unwrapList } from '@/utils/apiHelpers';

function parseOptionalNumber(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalLimit(value?: string): number | null {
  if (!value?.trim() || value.trim() === '∞') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapPromotionOptions(raw: unknown, fallback: PromotionOption[]): PromotionOption[] {
  if (!raw) return fallback;
  if (Array.isArray(raw)) {
    const mapped = raw
      .map((item) => {
        if (typeof item === 'string') return { id: item, label: item };
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const id = String(record.id ?? record.value ?? record.code ?? '');
          const label = String(record.name ?? record.label ?? id);
          if (!id) return null;
          return { id, label };
        }
        return null;
      })
      .filter((item): item is PromotionOption => !!item);
    return mapped.length > 0 ? mapped : fallback;
  }

  const data = unwrapData<unknown>(raw);
  return mapPromotionOptions(data, fallback);
}

export interface PromotionListItem {
  id: string;
  name: string;
  description?: string;
  promotionType?: string;
  application?: string;
  condition?: string;
  rewardType?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  priority?: number;
  createdAt?: string;
}

function mapPromotionListItem(raw: Record<string, unknown>): PromotionListItem {
  return {
    id: String(raw.id ?? raw.uuid ?? raw.name ?? ''),
    name: String(raw.name ?? 'Promotion'),
    description: raw.description ? String(raw.description) : undefined,
    promotionType: raw.promotion_type
      ? String(raw.promotion_type)
      : raw.promotionType
        ? String(raw.promotionType)
        : undefined,
    application: raw.application ? String(raw.application) : undefined,
    condition: raw.condition ? String(raw.condition) : undefined,
    rewardType: raw.reward_type
      ? String(raw.reward_type)
      : raw.rewardType
        ? String(raw.rewardType)
        : undefined,
    active:
      typeof raw.active === 'boolean'
        ? raw.active
        : raw.is_active != null
          ? Boolean(raw.is_active)
          : undefined,
    startDate: raw.start_date
      ? String(raw.start_date)
      : raw.startDate
        ? String(raw.startDate)
        : undefined,
    endDate: raw.end_date
      ? String(raw.end_date)
      : raw.endDate
        ? String(raw.endDate)
        : undefined,
    priority: Number(raw.priority ?? NaN) || undefined,
    createdAt: raw.created_at
      ? String(raw.created_at)
      : raw.createdAt
        ? String(raw.createdAt)
        : undefined,
  };
}

export async function fetchPromotions(): Promise<PromotionListItem[]> {
  const response = await apiRequest<unknown>('/pricing/promotions?page_size=100');
  return unwrapList<Record<string, unknown>>(response).map(mapPromotionListItem);
}

export async function fetchPromotionConditions(): Promise<PromotionOption[]> {
  try {
    const response = await apiRequest<unknown>('/pricing/promotions/conditions', { silent: true });
    return mapPromotionOptions(response, DEFAULT_PROMOTION_CONDITIONS);
  } catch {
    return DEFAULT_PROMOTION_CONDITIONS;
  }
}

export async function fetchPromotionRewardTypes(): Promise<PromotionOption[]> {
  try {
    const response = await apiRequest<unknown>('/pricing/promotions/reward-types', { silent: true });
    return mapPromotionOptions(response, DEFAULT_PROMOTION_REWARDS);
  } catch {
    return DEFAULT_PROMOTION_REWARDS;
  }
}

export async function createPromotion(data: CreatePromotionForm): Promise<Record<string, unknown>> {
  const response = await apiRequest<unknown>('/pricing/promotions', {
    method: 'POST',
    body: {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      promotion_type: data.promotionType,
      application: data.application,
      priority: data.priority,
      condition: data.condition,
      reward_type: data.rewardType,
      max_discount_cap: parseOptionalNumber(data.maxDiscountCap),
      start_date: data.startDate?.trim() || undefined,
      end_date: data.endDate?.trim() || undefined,
      stackable: data.stackable,
      exclude_already_discounted: data.excludeAlreadyDiscounted,
      max_uses_total: parseOptionalLimit(data.maxUsesTotal),
      max_uses_per_customer: parseOptionalLimit(data.maxUsesPerCustomer),
      max_uses_per_order: parseOptionalLimit(data.maxUsesPerOrder) ?? 1,
      active: data.active,
    },
  });
  return unwrapData<Record<string, unknown>>(response);
}

export function formatPromotionTypeLabel(type?: string): string {
  if (!type) return 'Promotion';
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export interface ItemPriceListItem {
  id: string;
  productId?: string;
  productName?: string;
  priceType?: string;
  customerId?: string;
  customerName?: string;
  price?: number;
  minQuantity?: number;
  validFrom?: string;
  validUntil?: string;
  createdAt?: string;
}

function mapPriceOptions(raw: unknown, fallback: PriceOption[]): PriceOption[] {
  if (!raw) return fallback;
  if (Array.isArray(raw)) {
    const mapped = raw
      .map((item) => {
        if (typeof item === 'string') return { id: item, label: item };
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const id = String(record.id ?? record.value ?? record.code ?? '');
          const label = String(record.name ?? record.label ?? id);
          if (!id) return null;
          return { id, label };
        }
        return null;
      })
      .filter((item): item is PriceOption => !!item);
    return mapped.length > 0 ? mapped : fallback;
  }

  const data = unwrapData<unknown>(raw);
  return mapPriceOptions(data, fallback);
}

function mapItemPriceListItem(raw: Record<string, unknown>): ItemPriceListItem {
  const product = raw.product as Record<string, unknown> | undefined;
  const customer = raw.customer as Record<string, unknown> | undefined;

  return {
    id: String(raw.id ?? raw.uuid ?? ''),
    productId: raw.product_id
      ? String(raw.product_id)
      : raw.productId
        ? String(raw.productId)
        : product?.id
          ? String(product.id)
          : undefined,
    productName: product?.name
      ? String(product.name)
      : raw.product_name
        ? String(raw.product_name)
        : raw.productName
          ? String(raw.productName)
          : undefined,
    priceType: raw.type
      ? String(raw.type)
      : raw.price_type
        ? String(raw.price_type)
        : raw.priceType
          ? String(raw.priceType)
          : undefined,
    customerId: raw.customer_id
      ? String(raw.customer_id)
      : raw.customerId
        ? String(raw.customerId)
        : customer?.id
          ? String(customer.id)
          : undefined,
    customerName: customer?.name
      ? String(customer.name)
      : raw.customer_name
        ? String(raw.customer_name)
        : raw.customerName
          ? String(raw.customerName)
          : undefined,
    price: Number(raw.price ?? NaN) || undefined,
    minQuantity: Number(raw.min_quantity ?? raw.minQuantity ?? NaN) || undefined,
    validFrom: raw.date_start
      ? String(raw.date_start)
      : raw.valid_from
        ? String(raw.valid_from)
        : raw.validFrom
          ? String(raw.validFrom)
          : undefined,
    validUntil: raw.date_end
      ? String(raw.date_end)
      : raw.valid_until
        ? String(raw.valid_until)
        : raw.validUntil
          ? String(raw.validUntil)
          : undefined,
    createdAt: raw.created_at
      ? String(raw.created_at)
      : raw.createdAt
        ? String(raw.createdAt)
        : undefined,
  };
}

export async function fetchItemPrices(): Promise<ItemPriceListItem[]> {
  const response = await apiRequest<unknown>('/inventory/item-prices?page_size=100');
  return unwrapList<Record<string, unknown>>(response).map(mapItemPriceListItem);
}

export async function fetchPriceTypes(): Promise<PriceOption[]> {
  try {
    const response = await apiRequest<unknown>('/inventory/item-prices/types', { silent: true });
    return mapPriceOptions(response, DEFAULT_PRICE_TYPES);
  } catch {
    return DEFAULT_PRICE_TYPES;
  }
}

export async function createItemPrice(data: CreateItemPriceForm): Promise<Record<string, unknown>> {
  const response = await apiRequest<unknown>('/inventory/item-prices', {
    method: 'POST',
    body: {
      type: data.priceType,
      price: data.price,
      date_start: data.validFrom,
      date_end: data.validUntil?.trim() || null,
      min_quantity: data.minQuantity,
      customer_id: data.customerId?.trim() ? data.customerId : null,
      supplier_id: null,
      product_id: data.productId,
    },
  });
  return unwrapData<Record<string, unknown>>(response);
}

export function formatPriceTypeLabel(type?: string): string {
  if (!type) return 'Price';
  const match = DEFAULT_PRICE_TYPES.find((option) => option.id === type);
  if (match) return match.label;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export interface ExchangeRateListItem {
  id: string;
  currencyCode?: string;
  effectiveDate?: string;
  rateToEtb?: number;
  createdAt?: string;
}

function mapExchangeRateListItem(raw: Record<string, unknown>): ExchangeRateListItem {
  return {
    id: String(raw.id ?? raw.uuid ?? ''),
    currencyCode: raw.currency_code
      ? String(raw.currency_code)
      : raw.currencyCode
        ? String(raw.currencyCode)
        : raw.currency
          ? String(raw.currency)
          : undefined,
    effectiveDate: raw.effective_date
      ? String(raw.effective_date)
      : raw.effectiveDate
        ? String(raw.effectiveDate)
        : undefined,
    rateToEtb:
      Number(raw.rate_to_etb ?? raw.rateToEtb ?? raw.rate ?? raw.exchange_rate ?? NaN) || undefined,
    createdAt: raw.created_at
      ? String(raw.created_at)
      : raw.createdAt
        ? String(raw.createdAt)
        : undefined,
  };
}

function mapCurrencyCodes(raw: unknown): string[] {
  if (!raw) return [...DEFAULT_CURRENCY_CODES];
  if (Array.isArray(raw)) {
    const mapped = raw
      .map((item) => {
        if (typeof item === 'string') return item.toUpperCase();
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const code = String(record.code ?? record.currency_code ?? record.currencyCode ?? record.id ?? '');
          return code.trim().toUpperCase();
        }
        return '';
      })
      .filter((code) => code.length === 3);
    return mapped.length > 0 ? Array.from(new Set(mapped)) : [...DEFAULT_CURRENCY_CODES];
  }

  const data = unwrapData<unknown>(raw);
  return mapCurrencyCodes(data);
}

export async function fetchExchangeRates(): Promise<ExchangeRateListItem[]> {
  const response = await apiRequest<unknown>('/pricing/exchange-rates?page_size=100');
  return unwrapList<Record<string, unknown>>(response).map(mapExchangeRateListItem);
}

export async function fetchCurrencyCodes(): Promise<string[]> {
  try {
    const response = await apiRequest<unknown>('/pricing/currencies', { silent: true });
    return mapCurrencyCodes(response);
  } catch {
    try {
      const response = await apiRequest<unknown>('/pricing/exchange-rates/currencies', {
        silent: true,
      });
      return mapCurrencyCodes(response);
    } catch {
      return [...DEFAULT_CURRENCY_CODES];
    }
  }
}

export async function createExchangeRate(
  data: CreateExchangeRateForm
): Promise<Record<string, unknown>> {
  const response = await apiRequest<unknown>('/pricing/exchange-rates', {
    method: 'POST',
    body: {
      currency_code: data.currencyCode,
      effective_date: data.effectiveDate,
      rate_to_etb: data.rateToEtb,
      rate: data.rateToEtb,
    },
  });
  return unwrapData<Record<string, unknown>>(response);
}

export interface CouponListItem {
  id: string;
  code: string;
  name?: string;
  discountType?: string;
  discountValue?: number;
  active?: boolean;
  maxUsage?: number;
  minimumPurchase?: number;
  createdAt?: string;
}

export interface GiftCardListItem {
  id: string;
  code: string;
  balance?: number;
  initialBalance?: number;
  expiryDate?: string;
  createdAt?: string;
}

export interface ApiCoupon {
  id?: string;
  code?: string;
}

export interface ApiGiftCard {
  id?: string;
  code?: string;
  card_number?: string;
  balance?: number;
  initial_balance?: number;
  expiry_date?: string;
}

function mapCouponListItem(raw: Record<string, unknown>): CouponListItem {
  return {
    id: String(raw.id ?? raw.uuid ?? raw.code ?? ''),
    code: String(raw.code ?? ''),
    name: raw.name ? String(raw.name) : undefined,
    discountType: raw.discount_type
      ? String(raw.discount_type)
      : raw.discountType
        ? String(raw.discountType)
        : undefined,
    discountValue: Number(raw.discount_value ?? raw.discountValue ?? NaN) || undefined,
    active:
      typeof raw.active === 'boolean'
        ? raw.active
        : raw.is_active != null
          ? Boolean(raw.is_active)
          : undefined,
    maxUsage: Number(raw.max_usage ?? raw.maxUsage ?? NaN) || undefined,
    minimumPurchase: Number(raw.minimum_purchase ?? raw.minimumPurchase ?? NaN) || undefined,
    createdAt: raw.created_at
      ? String(raw.created_at)
      : raw.createdAt
        ? String(raw.createdAt)
        : undefined,
  };
}

function mapGiftCardListItem(raw: Record<string, unknown>): GiftCardListItem {
  const cardNumber = raw.card_number ?? raw.cardNumber ?? raw.code;

  return {
    id: String(raw.id ?? raw.uuid ?? cardNumber ?? ''),
    code: cardNumber ? String(cardNumber) : '',
    balance: Number(raw.balance ?? raw.available_balance ?? raw.availableBalance ?? NaN) || undefined,
    initialBalance:
      Number(raw.initial_balance ?? raw.initialBalance ?? raw.balance ?? NaN) || undefined,
    expiryDate: raw.expiry_date
      ? String(raw.expiry_date)
      : raw.expiryDate
        ? String(raw.expiryDate)
        : undefined,
    createdAt: raw.created_at
      ? String(raw.created_at)
      : raw.createdAt
        ? String(raw.createdAt)
        : undefined,
  };
}

export async function fetchCoupons(): Promise<CouponListItem[]> {
  const response = await apiRequest<unknown>('/pricing/coupons?page_size=100');
  return unwrapList<Record<string, unknown>>(response).map(mapCouponListItem);
}

export async function fetchGiftCards(): Promise<GiftCardListItem[]> {
  const response = await apiRequest<unknown>('/pricing/gift-cards?page_size=100');
  return unwrapList<Record<string, unknown>>(response).map(mapGiftCardListItem);
}

export async function createCoupon(data: CreateCouponForm): Promise<ApiCoupon> {
  const response = await apiRequest<unknown>('/pricing/coupons', {
    method: 'POST',
    body: {
      code: data.code.trim().toUpperCase(),
      name: data.name?.trim() || undefined,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      max_usage: parseOptionalNumber(data.maxUsage),
      per_customer_limit: data.perCustomerLimit,
      minimum_purchase: parseOptionalNumber(data.minimumPurchase),
      active: data.active,
    },
  });
  return unwrapData<ApiCoupon>(response);
}

export async function issueGiftCard(data: CreateGiftCardForm): Promise<ApiGiftCard> {
  const response = await apiRequest<unknown>('/pricing/gift-cards/issue', {
    method: 'POST',
    body: {
      card_number: data.cardNumber.trim().toUpperCase(),
      initial_balance: data.initialBalance,
      expiry_date: data.expiryDate?.trim() || null,
    },
  });
  return unwrapData<ApiGiftCard>(response);
}

export function formatDiscountLabel(coupon: CouponListItem): string {
  if (!coupon.discountValue) return 'Discount';
  if (coupon.discountType === 'fixed') {
    return `ETB ${coupon.discountValue.toFixed(2)} off`;
  }
  return `${coupon.discountValue}% off`;
}

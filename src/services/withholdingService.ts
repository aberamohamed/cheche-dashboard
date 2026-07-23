import { apiRequest } from '@/services/apiClient';
import type { WithholdingRecord } from '@/types';
import type { ApiWithholdingReceipt } from '@/types/api';
import { mapApiWithholdingReceipt, unwrapData } from '@/utils/apiHelpers';

export type WithholdingFormType = 'standard' | 'vat';

export interface OrganizationWithholdingConfig {
  withholdRate: number;
  vatWithholdRate: number;
  sourceSystemNumber: string;
  sourceSystemType?: string;
  withholdingCategories: string[];
}

export interface RegisterWithholdingInput {
  invoiceIrn: string;
  manualReceiptNumber?: string;
  preTaxAmount: number;
  withholdingCategory: string;
  withholdRate: number;
  withholdingAmount: number;
  reason: string;
  sourceSystemNumber: string;
}

export interface RegisterVatWithholdingInput {
  invoiceIrn: string;
  manualReceiptNumber?: string;
  vatAmount: number;
  withholdRate: number;
  withholdingAmount: number;
  reason: string;
  sourceSystemNumber: string;
}

const DEFAULT_CONFIG: OrganizationWithholdingConfig = {
  withholdRate: 3,
  vatWithholdRate: 50,
  sourceSystemNumber: '',
  withholdingCategories: ['B2B', 'B2C'],
};

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseOrganizationConfig(raw: Record<string, unknown>): OrganizationWithholdingConfig {
  const nested =
    raw.organization && typeof raw.organization === 'object'
      ? (raw.organization as Record<string, unknown>)
      : raw;

  const categoriesRaw = nested.withholding_categories ?? nested.withholdingCategories;
  const categories =
    Array.isArray(categoriesRaw) && categoriesRaw.length > 0
      ? categoriesRaw.map((item) => String(item))
      : DEFAULT_CONFIG.withholdingCategories;

  return {
    withholdRate: readNumber(
      nested.withhold_rate ??
        nested.withholdRate ??
        nested.b2b_withhold_rate ??
        nested.b2bWithholdRate ??
        nested.withholding_rate ??
        nested.withholdingRate,
      DEFAULT_CONFIG.withholdRate
    ),
    vatWithholdRate: readNumber(
      nested.vat_withhold_rate ??
        nested.vatWithholdRate ??
        nested.vat_withholding_rate ??
        nested.vatWithholdingRate,
      DEFAULT_CONFIG.vatWithholdRate
    ),
    sourceSystemNumber:
      readString(nested.source_system_number ?? nested.sourceSystemNumber) ??
      DEFAULT_CONFIG.sourceSystemNumber,
    sourceSystemType: readString(
      nested.source_system_type ?? nested.sourceSystemType
    ),
    withholdingCategories: categories,
  };
}

export async function fetchOrganizationWithholdingConfig(
  organizationId: string
): Promise<OrganizationWithholdingConfig> {
  try {
    const response = await apiRequest<unknown>(`/auth/organizations/${organizationId}`);
    return parseOrganizationConfig(unwrapData<Record<string, unknown>>(response));
  } catch {
    try {
      const response = await apiRequest<unknown>('/auth/organizations');
      const organizations = unwrapData<Record<string, unknown>[]>(response);
      const match = organizations.find((org) => String(org.id) === organizationId);
      if (match) return parseOrganizationConfig(match);
    } catch {
      // fall through
    }
    return DEFAULT_CONFIG;
  }
}

function buildStandardPayload(input: RegisterWithholdingInput): Record<string, unknown> {
  return {
    invoice_irn: input.invoiceIrn.trim(),
    manual_receipt_number: input.manualReceiptNumber?.trim() ?? '',
    pre_tax_amount: input.preTaxAmount,
    withholding_category: input.withholdingCategory,
    withhold_rate: input.withholdRate,
    withholding_amount: input.withholdingAmount,
    reason: input.reason.trim(),
    source_system_number: input.sourceSystemNumber.trim(),
  };
}

function buildVatPayload(input: RegisterVatWithholdingInput): Record<string, unknown> {
  return {
    invoice_irn: input.invoiceIrn.trim(),
    manual_receipt_number: input.manualReceiptNumber?.trim() ?? '',
    vat_amount: input.vatAmount,
    withhold_rate: input.withholdRate,
    withholding_amount: input.withholdingAmount,
    reason: input.reason.trim(),
    source_system_number: input.sourceSystemNumber.trim(),
  };
}

export async function registerWithholdingReceipt(
  input: RegisterWithholdingInput
): Promise<WithholdingRecord> {
  const response = await apiRequest<unknown>('/purchase/withholding-receipts', {
    method: 'POST',
    body: buildStandardPayload(input),
  });
  const raw = unwrapData<ApiWithholdingReceipt>(response);
  return mapApiWithholdingReceipt(raw);
}

export async function registerVatWithholdingReceipt(
  input: RegisterVatWithholdingInput
): Promise<WithholdingRecord> {
  const response = await apiRequest<unknown>('/purchase/vat-withholding-receipts', {
    method: 'POST',
    body: buildVatPayload(input),
  });
  const raw = unwrapData<ApiWithholdingReceipt>(response);
  return mapApiWithholdingReceipt(raw);
}

export function computeWithholdingAmount(baseAmount: number, rate: number): number {
  if (!Number.isFinite(baseAmount) || !Number.isFinite(rate)) return 0;
  return Math.round((baseAmount * rate) / 100 * 100) / 100;
}

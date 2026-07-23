import { z } from 'zod';

export const DEFAULT_CURRENCY_CODES = [
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'CNY',
  'JPY',
  'KES',
  'SOS',
  'DJF',
  'SDG',
] as const;

export const createExchangeRateSchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .min(3, 'Enter a 3-letter currency code')
    .max(3, 'Currency code must be 3 letters')
    .transform((value) => value.toUpperCase()),
  effectiveDate: z.string().trim().min(1, 'Effective date is required'),
  rateToEtb: z.number().gt(0, 'Enter a valid exchange rate'),
});

export type CreateExchangeRateForm = z.infer<typeof createExchangeRateSchema>;

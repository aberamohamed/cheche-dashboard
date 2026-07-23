import { z } from 'zod';

export type PriceTypeId = 'selling' | 'cost' | 'wholesale' | 'list';

export type PriceOption = {
  id: string;
  label: string;
};

export const DEFAULT_PRICE_TYPES: PriceOption[] = [
  { id: 'selling', label: 'Selling Price' },
  { id: 'cost', label: 'Cost Price' },
  { id: 'wholesale', label: 'Wholesale Price' },
  { id: 'list', label: 'List Price' },
];

export const ALL_CUSTOMERS_OPTION = {
  id: '',
  label: 'All Customers',
} as const;

export const createItemPriceSchema = z
  .object({
    productId: z.string().trim().min(1, 'Select a product'),
    priceType: z.string().trim().min(1, 'Select price type'),
    customerId: z.string().optional(),
    price: z.number().min(0, 'Enter a valid price'),
    minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1'),
    validFrom: z.string().trim().min(1, 'Valid from date is required'),
    validUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.validUntil && data.validFrom && data.validUntil < data.validFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid until must be on or after valid from',
        path: ['validUntil'],
      });
    }
  });

export type CreateItemPriceForm = z.infer<typeof createItemPriceSchema>;

import { z } from 'zod';

export const DISCOUNT_TYPES = [
  { id: 'percentage', label: 'Percentage' },
  { id: 'fixed', label: 'Fixed Amount' },
] as const;

export type DiscountTypeId = (typeof DISCOUNT_TYPES)[number]['id'];

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(1, 'Coupon code is required').max(32),
    name: z.string().trim().max(80).optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(0, 'Enter a valid discount value'),
    maxUsage: z.string().optional(),
    perCustomerLimit: z.number().int().min(1, 'Must be at least 1'),
    minimumPurchase: z.string().optional(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage cannot exceed 100',
        path: ['discountValue'],
      });
    }
  });

export type CreateCouponForm = z.infer<typeof createCouponSchema>;

export const createGiftCardSchema = z.object({
  cardNumber: z.string().trim().min(4, 'Card number is required').max(32),
  initialBalance: z.number().min(0, 'Enter a valid balance'),
  expiryDate: z.string().trim().optional(),
});

export type CreateGiftCardForm = z.infer<typeof createGiftCardSchema>;

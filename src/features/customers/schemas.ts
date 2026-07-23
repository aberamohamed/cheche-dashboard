import { isValidLocalPhone, stripToLocalPhone } from '@/utils/phone';
import { z } from 'zod';

const optionalPhone = z
  .string()
  .optional()
  .refine((value) => !value?.trim() || isValidLocalPhone(stripToLocalPhone(value)), {
    message: 'Enter a valid 9-digit number starting with 9',
  });

export const addCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  phone: optionalPhone,
  email: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()), {
      message: 'Enter a valid email address',
    }),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  wereda: z.string().optional(),
  kebele: z.string().optional(),
  locality: z.string().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  transactionType: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
});

export type AddCustomerForm = z.infer<typeof addCustomerSchema>;

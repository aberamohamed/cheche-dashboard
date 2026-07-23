import { isValidLocalPhone, stripToLocalPhone } from '@/utils/phone';
import { z } from 'zod';

const pinField = z
  .string()
  .regex(/^\d{6}$/, 'PIN must be exactly 6 digits')
  .refine((value) => value !== '123456', 'PIN is too weak');

export const loginPhoneSchema = z.object({
  phone: z
    .string()
    .transform(stripToLocalPhone)
    .refine(isValidLocalPhone, 'Enter a valid 9-digit number starting with 9'),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .transform(stripToLocalPhone)
    .refine(isValidLocalPhone, 'Enter a valid 9-digit number starting with 9'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const businessSchema = z
  .object({
    businessName: z.string().min(2, 'Business name is required'),
    legalName: z.string().optional(),
    tin: z.string().min(5, 'TIN is required'),
    businessType: z.string().min(1, 'Select a business type'),
    otherBusinessType: z.string().optional(),
    phone: z
      .string()
      .transform(stripToLocalPhone)
      .refine(isValidLocalPhone, 'Enter a valid 9-digit number starting with 9'),
    email: z.string().email('Valid email required'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    country: z.string().optional(),
    region: z.string().optional(),
    zone: z.string().optional(),
    wereda: z.string().optional(),
    workspaceName: z.string().optional(),
    businessLicenseUri: z.string().optional(),
  })
  .refine(
    (data) =>
      data.businessType !== 'other' || (data.otherBusinessType?.trim().length ?? 0) >= 2,
    {
      message: 'Enter your business type',
      path: ['otherBusinessType'],
    }
  );

export const guestFormSchema = z
  .object({
    phone: z
      .string()
      .transform(stripToLocalPhone)
      .refine(isValidLocalPhone, 'Enter a valid 9-digit number starting with 9'),
    password: pinField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'PINs do not match',
    path: ['confirmPassword'],
  });

export type GuestForm = z.infer<typeof guestFormSchema>;

export const ownerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email required'),
    phone: z
      .string()
      .transform(stripToLocalPhone)
      .refine(isValidLocalPhone, 'Enter a valid 9-digit number starting with 9'),
    password: pinField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'PINs do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const phoneField = z
  .string()
  .transform(stripToLocalPhone)
  .refine(isValidLocalPhone, 'Enter a valid 9-digit number starting with 9');

export const forgotPasswordPhoneSchema = z.object({
  phone: phoneField,
});

export const forgotPasswordResetSchema = z
  .object({
    phone: phoneField,
    otp: z.string().min(4, 'Enter the OTP sent to your phone'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginPhoneForm = z.infer<typeof loginPhoneSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type BusinessForm = z.infer<typeof businessSchema>;
export type OwnerForm = z.infer<typeof ownerSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordPhoneForm = z.infer<typeof forgotPasswordPhoneSchema>;
export type ForgotPasswordResetForm = z.infer<typeof forgotPasswordResetSchema>;

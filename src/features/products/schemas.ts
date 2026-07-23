import { z } from 'zod';

const optionalNumber = z
  .string()
  .optional()
  .refine((value) => !value?.trim() || !Number.isNaN(Number(value)), 'Enter a valid number');

export const addItemSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  productType: z.string().min(1, 'Product type is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  uomId: z.string().optional(),
  isStockItem: z.boolean(),
  minStockQty: optionalNumber,
  maxStockQty: optionalNumber,
  sellingPrice: z
    .string()
    .trim()
    .min(1, 'Sale price is required')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Enter a valid price'),
  costPrice: optionalNumber,
  hsCode: z.string().optional(),
  hsRate: optionalNumber,
  useTaxesFromCategory: z.boolean(),
  saleTaxIds: z.array(z.string()),
  purchaseTaxIds: z.array(z.string()),
  multiVariantEnabled: z.boolean(),
});

export type AddItemForm = z.infer<typeof addItemSchema>;

export const addCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  code: z.string().optional(),
  parentCategoryId: z.string().optional(),
  description: z.string().optional(),
  saleTaxIds: z.array(z.string()),
  purchaseTaxIds: z.array(z.string()),
  isActive: z.boolean(),
  governmentCategoryId: z.string().min(1, 'Government item category is required'),
  governmentCategoryName: z.string().optional(),
  governmentCategoryCode: z.string().optional(),
  governmentTaxCode: z.string().optional(),
});

export type AddCategoryForm = z.infer<typeof addCategorySchema>;

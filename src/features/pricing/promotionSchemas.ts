import {
  BarChart3,
  Clock,
  CreditCard,
  Gift,
  Layers,
  Package,
  Percent,
  ShoppingCart,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { z } from 'zod';

export type PromotionTypeId =
  | 'discount'
  | 'buy_x_get_y'
  | 'bundle_deal'
  | 'tiered_discount'
  | 'happy_hour'
  | 'customer_segment'
  | 'multi_buy'
  | 'combo_deal'
  | 'flat_price'
  | 'cashback';

export type PromotionOption = {
  id: string;
  label: string;
};

export type PromotionTypeOption = {
  id: PromotionTypeId;
  label: string;
  description: string;
  Icon: LucideIcon;
};

export const PROMOTION_TYPES: PromotionTypeOption[] = [
  { id: 'discount', label: 'Discount', description: 'Simple percentage or fixed amount off', Icon: Percent },
  { id: 'buy_x_get_y', label: 'Buy X Get Y', description: 'Buy a quantity and get items free or discounted', Icon: Gift },
  { id: 'bundle_deal', label: 'Bundle Deal', description: 'Discount when buying a bundle of products', Icon: Package },
  { id: 'tiered_discount', label: 'Tiered Discount', description: 'Higher discounts at higher spend tiers', Icon: BarChart3 },
  { id: 'happy_hour', label: 'Happy Hour', description: 'Time-based promotional pricing', Icon: Clock },
  { id: 'customer_segment', label: 'Customer Segment', description: 'Target specific customer groups', Icon: Users },
  { id: 'multi_buy', label: 'Multi-Buy', description: 'Volume-based pricing for multiple items', Icon: ShoppingCart },
  { id: 'combo_deal', label: 'Combo Deal', description: 'Fixed price for a product combination', Icon: Layers },
  { id: 'flat_price', label: 'Flat Price', description: 'Set a fixed promotional price', Icon: Tag },
  { id: 'cashback', label: 'Cashback', description: 'Return value to the customer wallet or balance', Icon: CreditCard },
];

export const PROMOTION_APPLICATIONS: PromotionOption[] = [
  { id: 'automatic', label: 'Automatic' },
  { id: 'manual', label: 'Manual' },
  { id: 'coupon_code', label: 'Coupon Code' },
];

export const DEFAULT_PROMOTION_CONDITIONS: PromotionOption[] = [
  { id: 'minimum_purchase', label: 'Minimum Purchase Amount' },
  { id: 'specific_products', label: 'Specific Products' },
  { id: 'product_category', label: 'Product Category' },
  { id: 'customer_segment', label: 'Customer Segment' },
  { id: 'time_window', label: 'Time Window' },
  { id: 'quantity_threshold', label: 'Quantity Threshold' },
];

export const DEFAULT_PROMOTION_REWARDS: PromotionOption[] = [
  { id: 'percentage_off', label: 'Percentage Off' },
  { id: 'fixed_amount_off', label: 'Fixed Amount Off' },
  { id: 'free_item', label: 'Free Item' },
  { id: 'buy_x_get_y', label: 'Buy X Get Y' },
  { id: 'flat_price', label: 'Flat Price' },
  { id: 'cashback', label: 'Cashback' },
];

export const createPromotionSchema = z
  .object({
    promotionType: z.enum([
      'discount',
      'buy_x_get_y',
      'bundle_deal',
      'tiered_discount',
      'happy_hour',
      'customer_segment',
      'multi_buy',
      'combo_deal',
      'flat_price',
      'cashback',
    ]),
    name: z.string().trim().min(1, 'Promotion name is required').max(120),
    description: z.string().trim().max(500).optional(),
    application: z.string().trim().min(1, 'Select application'),
    priority: z.number().int().min(0, 'Priority must be 0 or greater'),
    condition: z.string().trim().min(1, 'Select condition'),
    rewardType: z.string().trim().min(1, 'Select reward type'),
    maxDiscountCap: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    stackable: z.boolean(),
    excludeAlreadyDiscounted: z.boolean(),
    maxUsesTotal: z.string().optional(),
    maxUsesPerCustomer: z.string().optional(),
    maxUsesPerOrder: z.string().optional(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['endDate'],
      });
    }
  });

export type CreatePromotionForm = z.infer<typeof createPromotionSchema>;

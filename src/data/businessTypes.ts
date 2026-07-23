import type { BusinessType } from '@/types';
import type { Ionicons } from '@expo/vector-icons';

export const OTHER_BUSINESS_TYPE: BusinessType = 'other';

export const BUSINESS_TYPES: {
  label: string;
  value: BusinessType;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'Retail Store', value: 'retail', icon: 'storefront-outline' },
  { label: 'Restaurant', value: 'restaurant', icon: 'restaurant-outline' },
  { label: 'Grocery', value: 'grocery', icon: 'basket-outline' },
  { label: 'Pharmacy', value: 'pharmacy', icon: 'medkit-outline' },
  { label: 'Electronics', value: 'electronics', icon: 'hardware-chip-outline' },
  { label: 'Other', value: OTHER_BUSINESS_TYPE, icon: 'grid-outline' },
];

export function resolveBusinessTypeValue(
  businessType: string,
  otherBusinessType?: string
): string {
  if (businessType === OTHER_BUSINESS_TYPE) {
    return otherBusinessType?.trim() ?? '';
  }
  return businessType;
}

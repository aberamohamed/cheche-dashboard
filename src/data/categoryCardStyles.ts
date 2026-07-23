import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface CategoryCardStyle {
  icon: IoniconName;
  bg: string;
  iconColor: string;
}

const CATEGORY_CARD_STYLES: CategoryCardStyle[] = [
  { icon: 'cube-outline', bg: '#E8F5E9', iconColor: '#2E7D32' },
  { icon: 'cafe-outline', bg: '#E3F2FD', iconColor: '#1565C0' },
  { icon: 'fast-food-outline', bg: '#FFF3E0', iconColor: '#E65100' },
  { icon: 'pricetag-outline', bg: '#F3E5F5', iconColor: '#7B1FA2' },
  { icon: 'medkit-outline', bg: '#E0F7FA', iconColor: '#00838F' },
  { icon: 'phone-portrait-outline', bg: '#E8EAF6', iconColor: '#3949AB' },
  { icon: 'leaf-outline', bg: '#F1F8E9', iconColor: '#558B2F' },
  { icon: 'gift-outline', bg: '#FCE4EC', iconColor: '#C2185B' },
  { icon: 'basket-outline', bg: '#FFF8E1', iconColor: '#F9A825' },
  { icon: 'water-outline', bg: '#E1F5FE', iconColor: '#0277BD' },
  { icon: 'pizza-outline', bg: '#FFEBEE', iconColor: '#D32F2F' },
  { icon: 'beer-outline', bg: '#FFFDE7', iconColor: '#F57F17' },
];

export const STOCK_REPORT_CARD_STYLE: CategoryCardStyle = {
  icon: 'bar-chart-outline',
  bg: Brand.primaryMuted,
  iconColor: Brand.primary,
};

export const OTHER_CATEGORY_CARD_STYLE: CategoryCardStyle = {
  icon: 'grid-outline',
  bg: '#ECEFF1',
  iconColor: '#546E7A',
};

export function getCategoryCardStyle(index: number): CategoryCardStyle {
  return CATEGORY_CARD_STYLES[index % CATEGORY_CARD_STYLES.length];
}

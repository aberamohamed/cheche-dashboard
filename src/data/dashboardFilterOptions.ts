import type { FilterOption } from '@/types/dashboardFilters';

export const PAYMENT_TYPE_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All Payments' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'mobile', label: 'Mobile / Telebirr' },
  { id: 'wallet', label: 'Cheche Wallet' },
];

export const STATUS_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All Status' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'cancelled', label: 'Cancelled' },
];

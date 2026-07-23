import type { FilterOption } from '@/types/dashboardFilters';
import { PAYMENT_TYPE_OPTIONS, STATUS_OPTIONS } from '@/data/dashboardFilterOptions';

export const PRODUCT_STATUS_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All Status' },
  { id: 'in_stock', label: 'In Stock' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'out_of_stock', label: 'Out of Stock' },
];

export const HISTORY_STATUS_OPTIONS: FilterOption[] = STATUS_OPTIONS;

export const HISTORY_PAYMENT_OPTIONS: FilterOption[] = PAYMENT_TYPE_OPTIONS;

export const HISTORY_DATE_OPTIONS: FilterOption[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All' },
];

export const EIRMS_STATUS_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All EIRMS Status' },
  { id: 'success', label: 'Success' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
];

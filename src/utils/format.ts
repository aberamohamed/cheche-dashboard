import {
    differenceInCalendarDays,
    format,
    isSameDay,
    isToday,
    startOfDay,
    subDays,
} from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Numeric amount for line items (no currency code). */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function generateInvoiceNumber(count: number): string {
  return `INV-${String(count + 1).padStart(6, '0')}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function formatDashboardDateRangeSubtitle(startDate: string | Date, endDate: string | Date): string {
  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function formatDashboardDateRangePeriod(startDate: string | Date, endDate: string | Date): string {
  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));
  const days = differenceInCalendarDays(end, start) + 1;
  const today = startOfDay(new Date());

  if (isSameDay(start, end)) {
    return isToday(end) ? 'Today' : format(end, 'MMM d, yyyy');
  }

  if (isSameDay(end, today)) {
    if (days === 7 && isSameDay(start, subDays(today, 6))) return 'Last 7 days';
    if (days === 30 && isSameDay(start, subDays(today, 29))) return 'Last 30 days';
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
  }

  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

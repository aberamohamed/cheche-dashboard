import type { WithholdingRecord } from '@/types';
import { buildChartBuckets } from '@/utils/dashboardChartBuckets';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export interface WithholdingMetricAnalytics {
  amount: number;
  trend: number[];
}

export interface WithholdingAnalytics {
  today: WithholdingMetricAnalytics;
  week: WithholdingMetricAnalytics;
  month: WithholdingMetricAnalytics;
  custom: WithholdingMetricAnalytics;
  customLabel: string;
}

/** Analytics-only filters; the list is not affected. */
export interface WithholdingAnalyticsFilters {
  customStartDate: string;
  customEndDate: string;
  status: string;
}

export function getDefaultWithholdingAnalyticsFilters(): WithholdingAnalyticsFilters {
  const now = new Date();
  return {
    customStartDate: startOfMonth(now).toISOString(),
    customEndDate: endOfDay(now).toISOString(),
    status: 'all',
  };
}

export const DEFAULT_WITHHOLDING_ANALYTICS_FILTERS = getDefaultWithholdingAnalyticsFilters();

export function isWithholdingAnalyticsFilterActive(
  filters: WithholdingAnalyticsFilters
): boolean {
  if (filters.status !== 'all') return true;

  const now = new Date();
  const start = startOfDay(new Date(filters.customStartDate));
  const end = startOfDay(new Date(filters.customEndDate));
  const defaultStart = startOfMonth(now);
  const defaultEnd = endOfDay(now);

  return !isSameDay(start, defaultStart) || !isSameDay(end, defaultEnd);
}

function getRecordAmount(record: WithholdingRecord): number {
  return record.withholdingAmount ?? record.amount ?? 0;
}

function parseRecordDate(createdAt: string): Date {
  const parsed = parseISO(createdAt);
  return Number.isNaN(parsed.getTime()) ? new Date(createdAt) : parsed;
}

function sumWithholdingAmount(records: WithholdingRecord[]): number {
  return records.reduce((sum, record) => sum + getRecordAmount(record), 0);
}

export function filterWithholdingForAnalytics(
  records: WithholdingRecord[],
  filters: Pick<WithholdingAnalyticsFilters, 'status'>
): WithholdingRecord[] {
  if (filters.status === 'all') return records;

  return records.filter((record) => {
    const status = (record.status ?? '').toLowerCase();
    return status === filters.status;
  });
}

function filterWithholdingByInterval(
  records: WithholdingRecord[],
  start: Date,
  end: Date
): WithholdingRecord[] {
  const interval = { start: startOfDay(start), end: endOfDay(end) };
  return records.filter((record) =>
    isWithinInterval(parseRecordDate(record.createdAt), interval)
  );
}

function buildWithholdingAmountTrend(
  records: WithholdingRecord[],
  start: Date,
  end: Date
): number[] {
  const buckets = buildChartBuckets(
    format(start, 'yyyy-MM-dd'),
    format(end, 'yyyy-MM-dd')
  );

  return buckets.map((bucket) =>
    records
      .filter((record) => {
        const date = parseRecordDate(record.createdAt);
        return date >= bucket.start && date <= bucket.end;
      })
      .reduce((sum, record) => sum + getRecordAmount(record), 0)
  );
}

function buildMetricAnalytics(
  records: WithholdingRecord[],
  start: Date,
  end: Date
): WithholdingMetricAnalytics {
  const inRange = filterWithholdingByInterval(records, start, end);
  return {
    amount: sumWithholdingAmount(inRange),
    trend: buildWithholdingAmountTrend(inRange, start, end),
  };
}

export function formatWithholdingAnalyticsPeriodLabel(
  filters: Pick<WithholdingAnalyticsFilters, 'customStartDate' | 'customEndDate'>
): string {
  const start = new Date(filters.customStartDate);
  const end = new Date(filters.customEndDate);

  return isSameDay(start, end)
    ? format(start, 'MMM d, yyyy')
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

/** Amounts from the loaded list only; replace with API analytics later. */
export function computeWithholdingAnalytics(
  records: WithholdingRecord[],
  filters: WithholdingAnalyticsFilters
): WithholdingAnalytics {
  const scoped = filterWithholdingForAnalytics(records, filters);
  const now = new Date();
  const customStart = new Date(filters.customStartDate);
  const customEnd = new Date(filters.customEndDate);

  const customLabel = formatWithholdingAnalyticsPeriodLabel(filters);

  return {
    today: buildMetricAnalytics(scoped, startOfDay(now), endOfDay(now)),
    week: buildMetricAnalytics(
      scoped,
      startOfWeek(now, WEEK_OPTIONS),
      endOfWeek(now, WEEK_OPTIONS)
    ),
    month: buildMetricAnalytics(scoped, startOfMonth(now), endOfMonth(now)),
    custom: buildMetricAnalytics(scoped, customStart, customEnd),
    customLabel,
  };
}

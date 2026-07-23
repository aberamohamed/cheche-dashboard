import type { ChartDataPoint } from '@/types';
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';

export type ChartGranularity = 'daily' | 'weekly' | 'monthly';

export type ChartBucket = {
  start: Date;
  end: Date;
  label: string;
};

export function getChartGranularity(startDate: string, endDate: string): ChartGranularity {
  const start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));
  const days = differenceInCalendarDays(end, start) + 1;

  if (days <= 7) return 'daily';
  if (days < 60) return 'weekly';
  return 'monthly';
}

export function buildChartBuckets(startDate: string, endDate: string): ChartBucket[] {
  const start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));
  const granularity = getChartGranularity(startDate, endDate);

  if (granularity === 'daily') {
    return eachDayOfInterval({ start, end }).map((day) => ({
      start: startOfDay(day),
      end: endOfDay(day),
      label: format(day, 'EEE'),
    }));
  }

  if (granularity === 'weekly') {
    const totalDays = differenceInCalendarDays(end, start) + 1;
    const bucketSize = Math.max(1, Math.ceil(totalDays / 4));
    const buckets: ChartBucket[] = [];

    let cursor = start;
    while (cursor <= end && buckets.length < 4) {
      const bucketEnd = addDays(cursor, bucketSize - 1);
      const clampedEnd = bucketEnd > end ? end : bucketEnd;
      buckets.push({
        start: startOfDay(cursor),
        end: endOfDay(clampedEnd),
        label: `W${buckets.length + 1}`,
      });
      cursor = addDays(clampedEnd, 1);
    }

    return buckets;
  }

  return eachMonthOfInterval({ start, end }).map((monthStart) => {
    const bucketStart = monthStart < start ? start : startOfMonth(monthStart);
    const monthEnd = endOfMonth(monthStart);
    const bucketEnd = monthEnd > end ? end : monthEnd;

    return {
      start: startOfDay(bucketStart),
      end: endOfDay(bucketEnd),
      label: format(monthStart, 'MMM'),
    };
  });
}

type SaleLike = {
  createdAt: string;
  total: number;
  items: { quantity: number }[];
};

export type DashboardTrendSeries = {
  sales: number[];
  transactions: number[];
  itemsSold: number[];
  averageSale: number[];
};

export function buildDashboardTrends(
  sales: SaleLike[],
  startDate: string,
  endDate: string
): { chartData: ChartDataPoint[]; statTrends: DashboardTrendSeries } {
  const buckets = buildChartBuckets(startDate, endDate);

  const salesValues: number[] = [];
  const transactionValues: number[] = [];
  const itemsSoldValues: number[] = [];
  const averageSaleValues: number[] = [];
  const chartData: ChartDataPoint[] = [];

  for (const bucket of buckets) {
    const bucketSales = sales.filter((sale) => {
      const date = parseISO(sale.createdAt);
      return date >= bucket.start && date <= bucket.end;
    });

    const revenue = bucketSales.reduce((sum, sale) => sum + sale.total, 0);
    const orders = bucketSales.length;
    const items = bucketSales.reduce(
      (sum, sale) => sum + sale.items.reduce((count, item) => count + item.quantity, 0),
      0
    );
    const avgSale = orders > 0 ? revenue / orders : 0;

    chartData.push({ label: bucket.label, value: revenue });
    salesValues.push(revenue);
    transactionValues.push(orders);
    itemsSoldValues.push(items);
    averageSaleValues.push(avgSale);
  }

  return {
    chartData,
    statTrends: {
      sales: salesValues,
      transactions: transactionValues,
      itemsSold: itemsSoldValues,
      averageSale: averageSaleValues,
    },
  };
}

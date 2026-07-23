import { apiRequest } from '@/services/apiClient';
import { fetchApiInvoices } from '@/services/invoiceService';
import type { ApiProduct, ApiPurchaseOrder } from '@/types/api';
import type { DashboardData, TopProduct } from '@/types';
import { mapApiInvoice, mapApiProduct, unwrapList } from '@/utils/apiHelpers';
import { buildDashboardTrends } from '@/utils/dashboardChartBuckets';
import type { DashboardFilters } from '@/types/dashboardFilters';
import { DEFAULT_DASHBOARD_FILTERS } from '@/types/dashboardFilters';
import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';

async function fetchInvoices(pageSize = 1000) {
  return fetchApiInvoices(1, pageSize);
}

async function fetchPurchaseOrders(pageSize = 1000): Promise<ApiPurchaseOrder[]> {
  try {
    const response = await apiRequest<unknown>(
      `/purchase/orders?page=1&page_size=${pageSize}`
    );
    return unwrapList<ApiPurchaseOrder>(response);
  } catch {
    return [];
  }
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function applySalesFilters(sales: ReturnType<typeof mapApiInvoice>[], filters: DashboardFilters) {
  const start = startOfDay(parseISO(filters.startDate));
  const end = endOfDay(parseISO(filters.endDate));

  return sales.filter((sale) => {
    const date = parseISO(sale.createdAt);
    if (date < start || date > end) return false;

    if (filters.paymentType !== 'all') {
      const method = sale.paymentMethod.toLowerCase();
      if (filters.paymentType === 'mobile' && !method.includes('mobile') && !method.includes('tele')) {
        return false;
      }
      if (filters.paymentType === 'wallet' && !method.includes('wallet')) return false;
      if (filters.paymentType === 'cash' && !method.includes('cash')) return false;
      if (filters.paymentType === 'card' && !method.includes('card')) return false;
    }

    return true;
  });
}

export async function getDashboardStats(
  filters: DashboardFilters = DEFAULT_DASHBOARD_FILTERS
): Promise<DashboardData> {
  const [invoices, productsResponse, purchases] = await Promise.all([
    fetchInvoices(),
    apiRequest<unknown>('/inventory/products?page=1&page_size=1000'),
    fetchPurchaseOrders(),
  ]);

  const products = unwrapList<ApiProduct>(productsResponse).map(mapApiProduct);
  const allSales = invoices.map(mapApiInvoice);
  const sales = applySalesFilters(allSales, filters);

  const todaySales = sales.filter((s) => isToday(parseISO(s.createdAt)));
  const yesterdaySales = sales.filter((s) => isYesterday(parseISO(s.createdAt)));
  const weekSales = sales.filter((s) => isThisWeek(parseISO(s.createdAt)));
  const monthSales = sales.filter((s) => isThisMonth(parseISO(s.createdAt)));

  const sumTotal = (items: typeof sales) => items.reduce((sum, s) => sum + s.total, 0);
  const countItems = (items: typeof sales) =>
    items.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.quantity, 0), 0);

  const todayRevenue = sumTotal(todaySales);
  const yesterdayRevenue = sumTotal(yesterdaySales);
  const monthRevenue = sumTotal(monthSales);
  const totalRevenue = sumTotal(sales);
  const totalOrders = sales.length;
  const productsSold = countItems(sales);
  const averageSale = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalPurchases = purchases.reduce(
    (sum, p) => sum + Number(p.total ?? p.amount ?? 0),
    0
  );

  const productStats = new Map<string, TopProduct>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const existing = productStats.get(item.productId);
      const product = products.find(
        (p) => p.productId === item.productId || p.id === item.productId
      );
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += item.total;
      } else if (product) {
        productStats.set(item.productId, {
          product,
          quantitySold: item.quantity,
          revenue: item.total,
        });
      }
    }
  }

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const { chartData, statTrends } = buildDashboardTrends(
    sales,
    filters.startDate,
    filters.endDate
  );

  return {
    todaySales: totalRevenue,
    totalRevenue,
    totalOrders,
    productsSold,
    profit: monthRevenue * 0.2,
    averageSale,
    totalProducts: products.length,
    totalPurchases,
    salesChange: pctChange(todayRevenue, yesterdayRevenue),
    ordersChange: pctChange(todaySales.length, yesterdaySales.length),
    productsChange: pctChange(countItems(weekSales), countItems(monthSales)),
    profitChange: pctChange(monthRevenue, sumTotal(sales.filter((s) => !isThisMonth(parseISO(s.createdAt))))),
    chartData,
    statTrends,
    topProducts,
  };
}

export async function getTodaySalesAmount(): Promise<number> {
  const invoices = await fetchInvoices();
  const todaySales = invoices
    .map(mapApiInvoice)
    .filter((sale) => isToday(parseISO(sale.createdAt)));

  return todaySales.reduce((sum, sale) => sum + sale.total, 0);
}

export type SalesFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

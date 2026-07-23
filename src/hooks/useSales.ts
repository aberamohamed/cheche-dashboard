import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getTodaySalesAmount } from '@/services/dashboardService';
import { getInvoices, type InvoiceFilter } from '@/services/invoiceService';
import { usePaymentMethodsStore } from '@/store/paymentMethodsStore';
import { useDashboardFilterStore } from '@/store/dashboardFilterStore';

export type SalesFilter = InvoiceFilter;

export function useDashboard() {
  const filters = useDashboardFilterStore((s) => s.applied);
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => getDashboardStats(filters),
  });
}

export function useTodaySales() {
  return useQuery({
    queryKey: ['todaySales'],
    queryFn: getTodaySalesAmount,
  });
}

export function useSales(filter: SalesFilter = 'all') {
  return useQuery({ queryKey: ['sales', filter], queryFn: () => getInvoices(filter) });
}

export function usePaymentMethods() {
  const methods = usePaymentMethodsStore((s) => s.methods);
  return { data: methods, isLoading: false };
}

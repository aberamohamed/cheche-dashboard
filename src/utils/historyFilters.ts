import type { Sale } from '@/types';
import type { SalesFilter } from '@/services/salesService';

export interface HistoryModalFilters {
  date: SalesFilter;
  status: string;
  payment: string;
}

export const DEFAULT_HISTORY_MODAL_FILTERS: HistoryModalFilters = {
  date: 'all',
  status: 'all',
  payment: 'all',
};

export function isHistoryFilterActive(filters: HistoryModalFilters): boolean {
  return filters.date !== 'all' || filters.status !== 'all' || filters.payment !== 'all';
}

export function filterSalesBySearch(sales: Sale[], query: string): Sale[] {
  const q = query.trim().toLowerCase();
  if (q.length <= 1) return sales;

  return sales.filter((sale) => {
    if (sale.invoiceNumber.toLowerCase().includes(q)) return true;
    if (String(sale.paymentMethod).toLowerCase().includes(q)) return true;
    if (sale.customerName?.toLowerCase().includes(q)) return true;

    return sale.items.some(
      (item) =>
        item.productName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    );
  });
}

export interface InvoiceModalFilters {
  date: SalesFilter;
  status: string;
  eirmsStatus: string;
}

export const DEFAULT_INVOICE_MODAL_FILTERS: InvoiceModalFilters = {
  date: 'all',
  status: 'all',
  eirmsStatus: 'all',
};

export function isInvoiceFilterActive(filters: InvoiceModalFilters): boolean {
  return filters.date !== 'all' || filters.status !== 'all' || filters.eirmsStatus !== 'all';
}

function matchesEirmsStatusFilter(eirmsStatus: string | undefined, filter: string): boolean {
  if (filter === 'all') return true;

  const eirms = (eirmsStatus ?? '').trim().toLowerCase();
  if (filter === 'success') return eirms.includes('success');
  if (filter === 'failed') return eirms.includes('fail');
  if (filter === 'pending') {
    return (
      !eirms ||
      eirms.includes('pending') ||
      eirms.includes('draft') ||
      eirms.includes('processing')
    );
  }

  return true;
}

export function filterSalesByInvoiceModal(
  sales: Sale[],
  filters: Pick<InvoiceModalFilters, 'status' | 'eirmsStatus'>
): Sale[] {
  return sales.filter((sale) => {
    if (filters.status !== 'all') {
      const saleStatus = (sale.status ?? 'completed').toLowerCase();
      if (saleStatus !== filters.status) return false;
    }

    if (!matchesEirmsStatusFilter(sale.eirmsStatus, filters.eirmsStatus)) {
      return false;
    }

    return true;
  });
}

export function filterSalesByModal(
  sales: Sale[],
  filters: Pick<HistoryModalFilters, 'status' | 'payment'>
): Sale[] {
  return sales.filter((sale) => {
    if (filters.status !== 'all') {
      const saleStatus = (sale.status ?? 'completed').toLowerCase();
      if (saleStatus !== filters.status) return false;
    }

    if (filters.payment !== 'all') {
      const method = String(sale.paymentMethod).toLowerCase();
      if (filters.payment === 'cash' && !method.includes('cash')) return false;
      if (filters.payment === 'card' && !method.includes('card')) return false;
      if (filters.payment === 'mobile' && !method.includes('tele') && !method.includes('mobile')) {
        return false;
      }
      if (filters.payment === 'wallet' && !method.includes('wallet')) return false;
    }

    return true;
  });
}

export interface DashboardFilters {
  paymentType: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface FilterOption {
  id: string;
  label: string;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  paymentType: 'all',
  status: 'all',
  startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
};

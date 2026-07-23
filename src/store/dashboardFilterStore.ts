import type { DashboardFilters } from '@/types/dashboardFilters';
import { DEFAULT_DASHBOARD_FILTERS } from '@/types/dashboardFilters';
import { create } from 'zustand';

interface DashboardFilterState {
  applied: DashboardFilters;
  setApplied: (filters: DashboardFilters) => void;
  reset: () => void;
}

export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  applied: { ...DEFAULT_DASHBOARD_FILTERS },
  setApplied: (filters) => set({ applied: filters }),
  reset: () => set({ applied: { ...DEFAULT_DASHBOARD_FILTERS } }),
}));

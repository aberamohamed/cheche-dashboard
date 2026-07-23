import { LanguageDropdown } from '@/components/settings/LanguageDropdown';
import type { ProductStockSort, ProductStockTab } from '@/utils/productFilters';
import type { RefObject } from 'react';
import type { View } from 'react-native';

const SORT_OPTIONS: { id: ProductStockSort; label: string; tabs?: ProductStockTab[] }[] = [
  { id: 'name', label: 'Name' },
  { id: 'nearest_expiry', label: 'Nearest Expiry', tabs: ['expiring'] },
  { id: 'stock_desc', label: 'Stock High to Low' },
  { id: 'stock_asc', label: 'Stock Low to High' },
];

export function getStockSortOptions(tab: ProductStockTab) {
  return SORT_OPTIONS.filter((option) => !option.tabs || option.tabs.includes(tab)).map(
    ({ id, label }) => ({ id, label }),
  );
}

export function getStockSortLabel(sort: ProductStockSort, tab: ProductStockTab) {
  return getStockSortOptions(tab).find((option) => option.id === sort)?.label ?? 'Name';
}

interface StockReportSortPickerProps {
  visible: boolean;
  selectedId: ProductStockSort;
  tab: ProductStockTab;
  anchorRef: RefObject<View | null>;
  onClose: () => void;
  onSelect: (sort: ProductStockSort) => void;
}

export function StockReportSortPicker({
  visible,
  selectedId,
  tab,
  anchorRef,
  onClose,
  onSelect,
}: StockReportSortPickerProps) {
  return (
    <LanguageDropdown
      selectedId={selectedId}
      onSelect={(id) => onSelect(id as ProductStockSort)}
      options={getStockSortOptions(tab)}
      variant="default"
      visible={visible}
      onClose={onClose}
      hideTrigger
      anchorRef={anchorRef}
      dropdownWidth={220}
    />
  );
}

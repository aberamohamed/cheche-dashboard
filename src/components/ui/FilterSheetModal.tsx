import {
  FilterChipRow,
  FilterModal,
  FilterSection,
} from '@/components/ui/FilterModal';
import type { FilterOption } from '@/types/dashboardFilters';
import { useEffect, useState } from 'react';

export interface FilterSheetSection {
  key: string;
  title: string;
  options: FilterOption[];
}

interface FilterSheetModalProps {
  visible: boolean;
  title?: string;
  sections: FilterSheetSection[];
  values: Record<string, string>;
  onClose: () => void;
  onApply: (values: Record<string, string>) => void;
  onReset: () => void;
}

/** Chip-section filter sheet built on the shared FilterModal shell. */
export function FilterSheetModal({
  visible,
  title = 'Filters',
  sections,
  values,
  onClose,
  onApply,
  onReset,
}: FilterSheetModalProps) {
  const [draft, setDraft] = useState(values);

  useEffect(() => {
    if (visible) setDraft(values);
  }, [visible, values]);

  return (
    <FilterModal
      visible={visible}
      title={title}
      onClose={onClose}
      onReset={onReset}
      onApply={() => onApply(draft)}
    >
      {sections.map((section) => (
        <FilterSection key={section.key} title={section.title}>
          <FilterChipRow
            options={section.options}
            selectedId={draft[section.key] ?? section.options[0]?.id ?? 'all'}
            onSelect={(id) => setDraft((prev) => ({ ...prev, [section.key]: id }))}
          />
        </FilterSection>
      ))}
    </FilterModal>
  );
}

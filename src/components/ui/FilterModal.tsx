import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import type { FilterOption } from '@/types/dashboardFilters';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface FilterModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'gradient';
  resetLabel?: string;
  applyLabel?: string;
  /** Max height for the scrollable filter body. */
  maxBodyHeight?: number;
}

/** Shared shell for all filter bottom sheets: scroll body + fixed footer, no extra bottom gap. */
export function FilterModal({
  visible,
  title = 'Filters',
  onClose,
  onReset,
  onApply,
  children,
  variant = 'default',
  resetLabel = 'Reset',
  applyLabel = 'Apply Filters',
  maxBodyHeight = 480,
}: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      variant={variant}
      fitContent
      footer={
        <View style={styles.footerActions}>
          <Button
            title={resetLabel}
            variant="outline"
            onPress={onReset}
            fullWidth={false}
            style={styles.resetBtn}
          />
          <Button title={applyLabel} onPress={onApply} style={styles.applyBtn} />
        </View>
      }
    >
      <ScrollView
        style={[styles.scroll, { maxHeight: maxBodyHeight }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {children}
      </ScrollView>
    </Modal>
  );
}

export function FilterSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export function FilterChipRow({
  options,
  selectedId,
  onSelect,
}: {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(option.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: 'transparent',
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 0,
    paddingBottom: 4,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionHint: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
  chipText: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Brand.primary, fontWeight: '600' },
  footerActions: { flexDirection: 'row', gap: 10, paddingBottom: 20 },
  resetBtn: { flex: 1 },
  applyBtn: { flex: 2 },
});

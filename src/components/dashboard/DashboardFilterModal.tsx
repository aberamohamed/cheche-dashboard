import {
  FilterChipRow,
  FilterModal,
  FilterSection,
} from '@/components/ui/FilterModal';
import { Button } from '@/components/ui/Button';
import {
  PAYMENT_TYPE_OPTIONS,
  STATUS_OPTIONS,
} from '@/data/dashboardFilterOptions';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Colors, Radius, Typography } from '@/constants/theme';
import type { DashboardFilters } from '@/types/dashboardFilters';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface DashboardFilterModalProps {
  visible: boolean;
  filters: DashboardFilters;
  onClose: () => void;
  onApply: (filters: DashboardFilters) => void;
  onReset: () => void;
}

export function DashboardFilterModal({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}: DashboardFilterModalProps) {
  const darkMode = useDarkMode();
  const [draft, setDraft] = useState(filters);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    } else {
      setPickerTarget(null);
    }
  }, [visible, filters]);

  const startDate = new Date(draft.startDate);
  const endDate = new Date(draft.endDate);

  const handleDateChange = (_event: { type?: string }, date?: Date) => {
    if (_event.type === 'dismissed') {
      if (Platform.OS === 'android') setPickerTarget(null);
      return;
    }
    if (!date || !pickerTarget) return;
    if (Platform.OS === 'android') setPickerTarget(null);
    setDraft((prev) => ({
      ...prev,
      [pickerTarget === 'start' ? 'startDate' : 'endDate']: date.toISOString(),
    }));
  };

  return (
    <FilterModal
      visible={visible}
      title="Dashboard Filters"
      variant={darkMode ? 'gradient' : 'default'}
      onClose={onClose}
      onReset={onReset}
      onApply={() => onApply(draft)}
    >
      <FilterSection title="Date Range">
        <View style={styles.dateRow}>
          <Pressable
            style={[styles.dateField, darkMode && styles.dateFieldDark]}
            onPress={() => setPickerTarget('start')}
          >
            <Calendar size={16} color={darkMode ? 'rgba(255,255,255,0.72)' : Colors.textSecondary} />
            <View>
              <Text style={[styles.dateLabel, darkMode && styles.textDarkMuted]}>From</Text>
              <Text style={[styles.dateValue, darkMode && styles.textDark]}>
                {format(startDate, 'MMM d, yyyy')}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.dateField, darkMode && styles.dateFieldDark]}
            onPress={() => setPickerTarget('end')}
          >
            <Calendar size={16} color={darkMode ? 'rgba(255,255,255,0.72)' : Colors.textSecondary} />
            <View>
              <Text style={[styles.dateLabel, darkMode && styles.textDarkMuted]}>To</Text>
              <Text style={[styles.dateValue, darkMode && styles.textDark]}>
                {format(endDate, 'MMM d, yyyy')}
              </Text>
            </View>
          </Pressable>
        </View>
        {pickerTarget ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={pickerTarget === 'start' ? startDate : endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
              maximumDate={pickerTarget === 'start' ? endDate : new Date()}
              minimumDate={pickerTarget === 'end' ? startDate : undefined}
              onChange={handleDateChange}
            />
            {Platform.OS === 'ios' ? (
              <Button title="OK" onPress={() => setPickerTarget(null)} style={styles.pickerOkBtn} />
            ) : null}
          </View>
        ) : null}
      </FilterSection>

      <FilterSection title="Payment Type">
        <FilterChipRow
          options={PAYMENT_TYPE_OPTIONS}
          selectedId={draft.paymentType}
          onSelect={(id) => setDraft((prev) => ({ ...prev, paymentType: id }))}
        />
      </FilterSection>

      <FilterSection title="Status">
        <FilterChipRow
          options={STATUS_OPTIONS}
          selectedId={draft.status}
          onSelect={(id) => setDraft((prev) => ({ ...prev, status: id }))}
        />
      </FilterSection>
    </FilterModal>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  dateFieldDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateLabel: { ...Typography.caption2, color: Colors.textSecondary },
  dateValue: { ...Typography.subhead, color: Colors.text, fontWeight: '500', marginTop: 2 },
  textDark: { color: '#FFFFFF' },
  textDarkMuted: { color: 'rgba(255, 255, 255, 0.72)' },
  pickerWrap: { marginTop: 8, gap: 8 },
  pickerOkBtn: { marginTop: 4 },
});

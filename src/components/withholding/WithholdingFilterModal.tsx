import {
  FilterChipRow,
  FilterModal,
  FilterSection,
} from '@/components/ui/FilterModal';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Typography } from '@/constants/theme';
import { HISTORY_STATUS_OPTIONS } from '@/data/listFilterOptions';
import type { WithholdingAnalyticsFilters } from '@/utils/withholdingAnalytics';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface WithholdingFilterModalProps {
  visible: boolean;
  filters: WithholdingAnalyticsFilters;
  onClose: () => void;
  onApply: (filters: WithholdingAnalyticsFilters) => void;
  onReset: () => void;
}

export function WithholdingFilterModal({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}: WithholdingFilterModalProps) {
  const [draft, setDraft] = useState(filters);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    } else {
      setPickerTarget(null);
    }
  }, [visible, filters]);

  const startDate = new Date(draft.customStartDate);
  const endDate = new Date(draft.customEndDate);

  const handleDateChange = (_event: { type?: string }, date?: Date) => {
    if (_event.type === 'dismissed') {
      if (Platform.OS === 'android') setPickerTarget(null);
      return;
    }
    if (!date || !pickerTarget) return;
    if (Platform.OS === 'android') setPickerTarget(null);
    setDraft((prev) => ({
      ...prev,
      [pickerTarget === 'start' ? 'customStartDate' : 'customEndDate']: date.toISOString(),
    }));
  };

  return (
    <FilterModal
      visible={visible}
      title="Analytics Filters"
      onClose={onClose}
      onReset={onReset}
      onApply={() => onApply(draft)}
    >
      <FilterSection
        title="Custom Range"
        hint="Used for the custom analytics card. Today, this week, and this month always use the current calendar day, week, and month."
      >
        <View style={styles.dateRow}>
          <Pressable style={styles.dateField} onPress={() => setPickerTarget('start')}>
            <Calendar size={16} color={Colors.textSecondary} />
            <View>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{format(startDate, 'MMM d, yyyy')}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.dateField} onPress={() => setPickerTarget('end')}>
            <Calendar size={16} color={Colors.textSecondary} />
            <View>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{format(endDate, 'MMM d, yyyy')}</Text>
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

      <FilterSection title="Status">
        <FilterChipRow
          options={HISTORY_STATUS_OPTIONS}
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
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateLabel: { ...Typography.caption2, color: Colors.textSecondary },
  dateValue: { ...Typography.subhead, color: Colors.text, fontWeight: '500', marginTop: 2 },
  pickerWrap: { marginTop: 8, gap: 8 },
  pickerOkBtn: { marginTop: 4 },
});

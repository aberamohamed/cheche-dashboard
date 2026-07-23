import { Button } from '@/components/ui/Button';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { format, isValid, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type DatePickerFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  clearable?: boolean;
};

function parseDateValue(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = 'mm/dd/yyyy',
  minimumDate,
  maximumDate,
  clearable = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const pickerDate = selectedDate ?? minimumDate ?? new Date();

  const displayValue = selectedDate ? format(selectedDate, 'MM/dd/yyyy') : '';

  const handleChange = (_event: { type?: string }, date?: Date) => {
    if (_event.type === 'dismissed') {
      if (Platform.OS === 'android') setOpen(false);
      return;
    }
    if (!date) return;
    if (Platform.OS === 'android') setOpen(false);
    onChange(format(date, 'yyyy-MM-dd'));
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={[styles.container, open && !error && styles.containerFocused, error && styles.containerError]}
        onPress={() => setOpen(true)}
      >
        <View style={styles.icon}>
          <Calendar size={20} color={Colors.textSecondary} />
        </View>
        <Text style={[styles.value, !displayValue && styles.placeholder]} numberOfLines={1}>
          {displayValue || placeholder}
        </Text>
        {clearable && displayValue ? (
          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onChange('');
              setOpen(false);
            }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </Pressable>
      {open ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Button title="Done" onPress={() => setOpen(false)} style={styles.doneBtn} />
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  containerFocused: { borderColor: Brand.primary },
  containerError: { borderColor: Colors.danger },
  icon: { marginRight: 10 },
  value: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  placeholder: { color: Colors.textTertiary },
  clearBtn: { paddingLeft: 8 },
  clearText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
  },
  pickerWrap: { marginTop: 8, gap: 8 },
  doneBtn: { marginTop: 4 },
  error: { ...Typography.caption1, color: Colors.danger },
});

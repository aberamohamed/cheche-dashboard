import { Brand, Colors, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export interface FilterChipOption {
  key: string;
  label: string;
}

type ChipInput = string | FilterChipOption;

function normalizeOptions(options: ChipInput[]): FilterChipOption[] {
  return options.map((option) =>
    typeof option === 'string' ? { key: option, label: option } : option
  );
}

interface FilterChipsProps {
  options: ChipInput[];
  selected: string;
  onSelect: (value: string) => void;
  /** When using keyed options, match selection by key instead of label */
  matchByKey?: boolean;
}

export function FilterChips({ options, selected, onSelect, matchByKey = false }: FilterChipsProps) {
  const chips = normalizeOptions(options);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => {
        const active = matchByKey ? chip.key === selected : chip.label === selected;
        return (
          <Pressable
            key={chip.key}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(matchByKey ? chip.key : chip.label);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F2F2F7',
  },
  chipActive: { backgroundColor: Brand.primary },
  label: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  labelActive: { color: '#fff', fontWeight: '600' },
});

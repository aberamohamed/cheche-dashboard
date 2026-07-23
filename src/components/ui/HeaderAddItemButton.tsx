import { Brand, Typography } from '@/constants/theme';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

interface HeaderAddItemButtonProps {
  onPress: () => void;
  label?: string;
}

export function HeaderAddItemButton({ onPress, label = 'Add Item' }: HeaderAddItemButtonProps) {
  return (
    <Pressable style={styles.btn} onPress={onPress} hitSlop={8}>
      <Plus size={16} color={Brand.primary} strokeWidth={2.5} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  label: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
  },
});

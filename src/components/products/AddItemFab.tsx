import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

interface AddItemFabProps {
  onPress: () => void;
  bottom: number;
  label?: string;
}

export function AddItemFab({ onPress, bottom, label = 'Add Item' }: AddItemFabProps) {
  return (
    <Pressable style={[styles.fab, { bottom }]} onPress={onPress}>
      <Plus size={20} color="#fff" strokeWidth={2.5} />
      <Text style={styles.fabText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 18,
    paddingRight: 20,
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    ...Shadow.card,
  },
  fabText: {
    ...Typography.subhead,
    color: Colors.white,
    fontWeight: '700',
  },
});

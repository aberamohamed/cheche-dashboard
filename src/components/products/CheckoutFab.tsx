import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { CreditCard } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface CheckoutFabProps {
  bottom: number;
  itemCount: number;
  onPress: () => void;
}

export function CheckoutFab({ bottom, itemCount, onPress }: CheckoutFabProps) {
  const { checkout } = useSellTranslation();
  if (itemCount <= 0) return null;

  return (
    <Pressable style={[styles.fab, { bottom }]} onPress={onPress}>
      <CreditCard size={20} color="#fff" strokeWidth={2.25} />
      <Text style={styles.fabText}>{checkout}</Text>
      <View style={styles.fabBadge}>
        <Text style={styles.fabBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 20,
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
  fabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 2,
  },
  fabBadgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
});

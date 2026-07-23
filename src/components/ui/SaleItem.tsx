import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { CartItem } from '@/types';
import { Minus, Package, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SaleItemProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function SaleItem({ item, onIncrease, onDecrease, onRemove }: SaleItemProps) {
  const { product, quantity } = item;
  const lineTotal = product.sellingPrice * quantity;

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <View style={styles.row}>
      <Pressable style={styles.deleteBtn} onPress={() => { haptic(); onRemove(); }} hitSlop={8}>
        <Trash2 size={16} color={Colors.danger} />
      </Pressable>

      <View style={styles.imageWrap}>
        <Package size={22} color={Brand.primary} />
      </View>

      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.sku}>{product.sku}</Text>
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyBtn} onPress={() => { haptic(); onDecrease(); }}>
            <Minus size={14} color={Brand.primary} />
          </Pressable>
          <Text style={styles.qty}>{quantity}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => { haptic(); onIncrease(); }}>
            <Plus size={14} color={Brand.primary} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.price}>{formatCurrency(lineTotal)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: 12,
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 1,
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, gap: 2, paddingRight: 72 },
  name: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  sku: { ...Typography.caption1, color: Colors.textSecondary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { ...Typography.subhead, color: Colors.text, minWidth: 18, textAlign: 'center', fontWeight: '600' },
  price: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
    alignSelf: 'center',
    minWidth: 88,
    textAlign: 'right',
  },
});

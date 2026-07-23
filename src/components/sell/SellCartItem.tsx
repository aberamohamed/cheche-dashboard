import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { formatAmount } from '@/utils/format';
import type { CartItem } from '@/types';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SellCartItemProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function SellCartItem({ item, onIncrease, onDecrease }: SellCartItemProps) {
  const { product, quantity } = item;

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <View style={styles.row}>
      <ProductThumbnail uri={product.image} size={44} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {product.variantName ? (
          <Text style={styles.variantName} numberOfLines={1}>{product.variantName}</Text>
        ) : product.sku ? (
          <Text style={styles.variantName} numberOfLines={1}>{product.sku}</Text>
        ) : null}
        <Text style={styles.unitPrice}>{formatAmount(product.sellingPrice)}</Text>
      </View>

      <View style={styles.qtyWrap}>
        <Pressable style={styles.qtyBtn} onPress={() => { haptic(); onDecrease(); }}>
          <Minus size={20} color="#2F80ED" />
        </Pressable>
        <Text style={styles.qty}>{quantity}</Text>
        <Pressable style={styles.qtyBtn} onPress={() => { haptic(); onIncrease(); }}>
          <Plus size={20} color={Brand.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  info: { flex: 1, gap: 2, minWidth: 0 },
  name: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  variantName: { ...Typography.caption1, color: Colors.textSecondary },
  unitPrice: { ...Typography.caption1, color: '#2F80ED', fontWeight: '500' },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 12,
    minHeight: 48,
    minWidth: 132,
  },
  qtyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
});

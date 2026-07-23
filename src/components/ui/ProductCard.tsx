import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';
import { Package } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showStock?: boolean;
}

export function ProductCard({ product, onPress, showStock = true }: ProductCardProps) {
  const isLowStock = product.stock <= product.lowStockAlert;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        <Package size={24} color={Brand.primary} />
      </View>

      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {product.name}
        </Text>
        <Text style={styles.sku} numberOfLines={1} ellipsizeMode="tail">
          {product.barcode || product.sku}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
        {showStock && (
          <View style={[styles.stockBadge, isLowStock && styles.stockBadgeLow]}>
            <Text style={[styles.stockText, isLowStock && styles.stockTextLow]}>
              {isLowStock ? 'Low stock' : `${product.stock} in stock`}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  pressed: { backgroundColor: Colors.background },
  imageWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  center: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  sku: { ...Typography.caption1, color: Colors.textSecondary },
  right: { alignItems: 'flex-end', gap: 4, minWidth: 88, flexShrink: 0 },
  price: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#B8E6C8',
  },
  stockBadgeLow: {
    backgroundColor: Colors.dangerBg,
    borderColor: '#FFB4AB',
  },
  stockText: { ...Typography.caption2, color: Colors.success, fontWeight: '600' },
  stockTextLow: { color: Colors.danger },
});

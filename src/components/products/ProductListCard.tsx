import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';
import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ProductListCardProps {
  product: Product;
  onPress?: () => void;
  showStock?: boolean;
}

export function ProductListCard({
  product,
  onPress,
  showStock = true,
}: ProductListCardProps) {
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockAlert;
  const isOutOfStock = product.stock <= 0;
  const StockIcon = isOutOfStock ? XCircle : isLowStock ? TriangleAlert : CheckCircle2;
  const stockIconColor = isOutOfStock ? Colors.danger : isLowStock ? Colors.warning : Colors.success;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        <ProductThumbnail uri={product.image} size={80} style={styles.image} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.sku} numberOfLines={1}>
              {product.barcode || product.sku}
            </Text>
          </View>
          <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
        </View>

        {showStock ? (
          <View
            style={[
              styles.stockBadge,
              isOutOfStock && styles.stockBadgeOut,
              isLowStock && styles.stockBadgeLow,
            ]}
          >
            <StockIcon size={12} color={stockIconColor} strokeWidth={2.5} />
            <Text
              style={[
                styles.stockText,
                isOutOfStock && styles.stockTextOut,
                isLowStock && styles.stockTextLow,
              ]}
            >
              {product.stock}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    padding: 12,
    gap: 12,
    ...Shadow.iosCard,
  },
  pressed: { opacity: 0.92 },
  imageWrap: {
    width: 80,
    height: 80,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  sku: {
    ...Typography.caption2,
    color: Colors.textSecondary,
  },
  price: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#B8E6C8',
  },
  stockBadgeLow: {
    backgroundColor: Colors.warningBg,
    borderColor: '#FFD59A',
  },
  stockBadgeOut: {
    backgroundColor: Colors.dangerBg,
    borderColor: '#FFB4AB',
  },
  stockText: {
    ...Typography.caption2,
    color: Colors.success,
    fontWeight: '600',
  },
  stockTextLow: {
    color: Colors.warning,
  },
  stockTextOut: {
    color: Colors.danger,
  },
});

import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, ShoppingCart, TriangleAlert, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ProductGridCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  cartQuantity?: number;
  showStock?: boolean;
  layout?: 'default' | 'store' | 'stock';
}

export function ProductGridCard({
  product,
  onPress,
  onAddToCart,
  cartQuantity = 0,
  showStock = true,
  layout = 'default',
}: ProductGridCardProps) {
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockAlert;
  const isOutOfStock = product.stock <= 0;

  if (layout === 'store') {
    return (
      <View style={styles.card}>
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
          <View style={styles.storeImageWrap}>
            <ProductThumbnail uri={product.image} size={96} style={styles.image} />
            {showStock ? (
              <View
                style={[
                  styles.stockCorner,
                  isOutOfStock && styles.stockCornerOut,
                  isLowStock && styles.stockCornerLow,
                ]}
              >
                <Text
                  style={[
                    styles.stockCornerText,
                    isOutOfStock && styles.stockCornerTextOut,
                    isLowStock && styles.stockCornerTextLow,
                  ]}
                >
                  {product.stock}
                </Text>
              </View>
            ) : null}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.72)']}
              style={styles.nameOverlay}
            >
              <Text style={styles.storeName} numberOfLines={2}>
                {product.name}
              </Text>
            </LinearGradient>
          </View>
        </Pressable>

        <View style={styles.storeFooter}>
          <Text style={styles.storePrice}>{formatCurrency(product.sellingPrice)}</Text>
          {onAddToCart ? (
            <View style={styles.cartBtnWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.cartBtn,
                  isOutOfStock && styles.cartBtnDisabled,
                  pressed && !isOutOfStock && styles.cartBtnPressed,
                ]}
                onPress={onAddToCart}
                disabled={isOutOfStock}
                hitSlop={8}
              >
                <ShoppingCart size={16} color={isOutOfStock ? Colors.textTertiary : '#fff'} />
              </Pressable>
              {cartQuantity > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartQuantity > 99 ? '99+' : cartQuantity}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  if (layout === 'stock') {
    const StockIcon = isOutOfStock ? XCircle : isLowStock ? TriangleAlert : CheckCircle2;
    const stockIconColor = isOutOfStock ? Colors.danger : isLowStock ? Colors.warning : Colors.success;

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.imageWrap}>
          <ProductThumbnail uri={product.image} size={120} style={styles.image} />
        </View>

        <View style={[styles.body, styles.stockBody]}>
          <Text style={styles.stockName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.stockSku} numberOfLines={1}>
            {product.barcode || product.sku}
          </Text>

          {showStock ? (
            <View
              style={[
                styles.stockIconBadge,
                isOutOfStock && styles.stockBadgeOut,
                isLowStock && styles.stockBadgeLow,
              ]}
            >
              <StockIcon size={12} color={stockIconColor} strokeWidth={2.5} />
              <Text
                style={[
                  styles.stockCount,
                  isOutOfStock && styles.stockTextOut,
                  isLowStock && styles.stockTextLow,
                  !isOutOfStock && !isLowStock && styles.stockText,
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        <ProductThumbnail uri={product.image} size={120} style={styles.image} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.sku} numberOfLines={1}>
          {product.barcode || product.sku}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
          {showStock ? (
            <View
              style={[
                styles.stockBadge,
                isOutOfStock && styles.stockBadgeOut,
                isLowStock && styles.stockBadgeLow,
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  isOutOfStock && styles.stockTextOut,
                  isLowStock && styles.stockTextLow,
                ]}
                numberOfLines={1}
              >
                {isOutOfStock
                  ? 'Out of stock'
                  : isLowStock
                    ? 'Low stock'
                    : `${product.stock} in stock`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  pressed: { opacity: 0.92 },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storeImageWrap: {
    width: '100%',
    height: 104,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  stockCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.successBg,
  },
  stockCornerLow: {
    borderColor: Colors.warningBg,
  },
  stockCornerOut: {
    borderColor: Colors.dangerBg,
  },
  stockCornerText: {
    ...Typography.caption2,
    color: Colors.success,
    fontWeight: '700',
  },
  stockCornerTextLow: {
    color: Colors.warning,
  },
  stockCornerTextOut: {
    color: Colors.danger,
  },
  nameOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  storeName: {
    ...Typography.caption1,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 16,
  },
  storeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  storePrice: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  cartBtnWrap: {
    position: 'relative',
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnPressed: {
    opacity: 0.88,
  },
  cartBtnDisabled: {
    backgroundColor: Colors.borderLight,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  body: {
    padding: 10,
    gap: 4,
    minHeight: 96,
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
  footer: {
    marginTop: 'auto',
    paddingTop: 6,
    gap: 6,
  },
  price: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#B8E6C8',
    maxWidth: '100%',
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
  stockBody: {
    padding: 8,
    minHeight: 72,
    gap: 3,
  },
  stockName: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 16,
  },
  stockSku: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  stockIconBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#B8E6C8',
    maxWidth: '100%',
  },
  stockCount: {
    ...Typography.caption2,
    fontWeight: '700',
    fontSize: 11,
  },
});

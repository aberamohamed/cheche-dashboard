import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/utils/format';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: products = [] } = useProducts('all');
  const insets = useSafeAreaInsets();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Product Detail" onBack={() => router.back()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Product not found</Text>
        </View>
      </View>
    );
  }

  const isLowStock = product.stock > 0 && product.stock <= product.lowStockAlert;
  const isOutOfStock = product.stock <= 0;
  const StockIcon = isOutOfStock ? XCircle : isLowStock ? TriangleAlert : CheckCircle2;
  const stockIconColor = isOutOfStock ? Colors.danger : isLowStock ? Colors.warning : Colors.success;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="Product Detail" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageSection}>
          <ProductThumbnail uri={product.image} size={200} />
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
          {isLowStock || isOutOfStock ? (
            <View
              style={[
                styles.stockBadge,
                isOutOfStock && styles.stockBadgeOut,
                isLowStock && styles.stockBadgeLow,
              ]}
            >
              <StockIcon size={14} color={stockIconColor} strokeWidth={2.5} />
              <Text
                style={[
                  styles.stockText,
                  isOutOfStock && styles.stockTextOut,
                  isLowStock && styles.stockTextLow,
                ]}
              >
                {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Product ID</Text>
            <Text style={styles.value}>{product.id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>POS Product ID</Text>
            <Text style={styles.value}>{product.id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Product Type</Text>
            <Text style={styles.value}>{product.type || 'Service'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{product.category || 'Uncategorized'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Brand</Text>
            <Text style={styles.value}>{product.brand || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>SKU</Text>
            <Text style={styles.value}>{product.sku}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Barcode</Text>
            <Text style={styles.value}>{product.barcode || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Unit</Text>
            <Text style={styles.value}>{product.unit || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Stock On Hand</Text>
            <Text style={styles.value}>{product.stock}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Min Stock Qty</Text>
            <Text style={styles.value}>{product.lowStockAlert}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.lg,
  },
  priceSection: {
    alignItems: 'center',
    gap: 12,
  },
  name: {
    ...Typography.title2,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  price: {
    ...Typography.title1,
    fontWeight: '700',
    color: Brand.primary,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E7F9F0',
    borderWidth: 1,
    borderColor: '#B8E6C8',
  },
  stockBadgeLow: {
    backgroundColor: '#FFF4E6',
    borderColor: '#FFD59A',
  },
  stockBadgeOut: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFB4AB',
  },
  stockText: {
    ...Typography.caption1,
    color: Colors.success,
    fontWeight: '600',
  },
  stockTextLow: {
    color: Colors.warning,
  },
  stockTextOut: {
    color: Colors.danger,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});

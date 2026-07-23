import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { PRODUCT_TYPES } from '@/data/productFormOptions';
import { useProductDetail, useTaxes } from '@/hooks/useProducts';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface ProductDetailModalProps {
  productId: string | null;
  fallback?: Product | null;
  onClose: () => void;
}

function formatDetailValue(value?: string | number | boolean | null): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatDateValue(value?: string): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'PPpp');
  } catch {
    return value;
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const stacked = value.length > 28 || label === 'Description';

  if (stacked) {
    return (
      <View style={styles.detailRowStack}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValueStack}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function resolveProductTypeLabel(productType?: string): string {
  if (!productType) return '—';
  return PRODUCT_TYPES.find((option) => option.id === productType)?.label ?? productType;
}

export function ProductDetailModal({ productId, fallback, onClose }: ProductDetailModalProps) {
  const { data: detail, isLoading } = useProductDetail(productId ?? undefined);
  const { data: taxes = [] } = useTaxes();
  const product = detail ?? fallback ?? null;

  const taxLabel =
    product?.taxesIds?.length
      ? product.taxesIds
          .map((taxId) => {
            const tax = taxes.find((item) => item.id === taxId);
            return tax ? `${tax.name} (${tax.rate}%)` : taxId;
          })
          .join(', ')
      : '—';

  const handleEdit = () => {
    if (!product) return;
    onClose();
    setTimeout(() => {
      router.push({ pathname: '/add-item', params: { id: product.id } });
    }, 0);
  };

  return (
    <Modal visible={!!productId} onClose={onClose} title="Product Detail">
      {isLoading && !product ? (
        <Loading />
      ) : product ? (
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.content}>
            <View style={styles.image}>
              <ProductThumbnail uri={product.image} size={120} />
            </View>
            <Text style={styles.name}>{product.name}</Text>
            {product.variantName ? (
              <Text style={styles.variantName}>{product.variantName}</Text>
            ) : null}
            <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
            <View style={[styles.stockBadge, product.stock <= product.lowStockAlert && styles.stockLow]}>
              <Text style={[styles.stockText, product.stock <= product.lowStockAlert && styles.stockTextLow]}>
                {product.stock <= product.lowStockAlert ? 'Low Stock' : `${product.stock} in stock`}
              </Text>
            </View>

            <View style={styles.details}>
              <DetailRow label="Product ID" value={formatDetailValue(product.id)} />
              <DetailRow label="POS Product ID" value={formatDetailValue(product.productId)} />
              <DetailRow label="Product Type" value={resolveProductTypeLabel(product.productType)} />
              <DetailRow label="Category" value={formatDetailValue(product.category)} />
              <DetailRow label="Brand" value={formatDetailValue(product.brandName)} />
              <DetailRow label="SKU" value={formatDetailValue(product.sku)} />
              <DetailRow label="Barcode" value={formatDetailValue(product.barcode)} />
              <DetailRow label="Unit" value={formatDetailValue(product.unit)} />
              <DetailRow label="Stock On Hand" value={formatDetailValue(product.stock)} />
              <DetailRow label="Min Stock Qty" value={formatDetailValue(product.lowStockAlert)} />
              <DetailRow label="Max Stock Qty" value={formatDetailValue(product.maxStockQty)} />
              <DetailRow label="Stock Item" value={formatDetailValue(product.isStockItem)} />
              <DetailRow label="Cost Price" value={formatCurrency(product.costPrice)} />
              <DetailRow label="Selling Price" value={formatCurrency(product.sellingPrice)} />
              <DetailRow label="HS Code" value={formatDetailValue(product.hsCode)} />
              <DetailRow label="HS Rate" value={formatDetailValue(product.hsRate)} />
              <DetailRow label="Sale Taxes" value={taxLabel} />
              <DetailRow label="Description" value={formatDetailValue(product.description)} />
              <DetailRow label="Created At" value={formatDateValue(product.createdAt)} />
              <DetailRow label="Updated At" value={formatDateValue(product.updatedAt)} />
            </View>

            <Button title="Edit" onPress={handleEdit} style={styles.editBtn} />
          </View>
        </ScrollView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 100 },
  image: {
    height: 160,
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...Typography.title2, color: Colors.text, textAlign: 'center' },
  variantName: { ...Typography.subhead, color: Colors.textSecondary, textAlign: 'center' },
  price: { ...Typography.title1, color: Brand.primary, textAlign: 'center' },
  stockBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockLow: { backgroundColor: Colors.dangerBg },
  stockText: { ...Typography.caption1, color: Colors.success, fontWeight: '600' },
  stockTextLow: { color: Colors.danger },
  details: {
    gap: 10,
    paddingVertical: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  detailRowStack: {
    gap: 4,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  detailLabel: { ...Typography.subhead, color: Colors.textSecondary, flexShrink: 0 },
  detailValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailValueStack: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '500',
  },
  editBtn: { marginTop: 4 },
});

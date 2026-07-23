import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import type { Product, ProductVariant } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface ProductVariantPickerModalProps {
  product: Product | null;
  selectedVariantIds?: string[];
  multiSelect?: boolean;
  onClose: () => void;
  onSelect?: (variant: ProductVariant) => void;
  onConfirm?: (variants: ProductVariant[]) => void;
}

export function ProductVariantPickerModal({
  product,
  selectedVariantIds = [],
  multiSelect = false,
  onClose,
  onSelect,
  onConfirm,
}: ProductVariantPickerModalProps) {
  const t = useSellTranslation();
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!product) {
      setPickedIds(new Set());
      return;
    }
    setPickedIds(new Set(selectedVariantIds));
  }, [product, selectedVariantIds]);

  const variants = product?.variants ?? [];
  const pickedCount = pickedIds.size;

  const selectedVariants = useMemo(
    () => variants.filter((variant) => pickedIds.has(variant.id)),
    [pickedIds, variants]
  );

  if (!product) return null;

  const toggleVariant = (variant: ProductVariant) => {
    if (!multiSelect) {
      onSelect?.(variant);
      return;
    }

    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(variant.id)) next.delete(variant.id);
      else next.add(variant.id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm?.(selectedVariants);
    onClose();
  };

  return (
    <Modal visible={!!product} onClose={onClose} title={t.selectVariant}>
      <View style={styles.header}>
        <ProductThumbnail uri={product.image} size={56} />
        <View style={styles.headerText}>
          <Text style={styles.productName}>{product.name}</Text>
          {multiSelect ? (
            <Text style={styles.helperText}>{t.selectVariantsHint}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {variants.map((variant) => {
          const inStock = variant.stock > 0;
          const selected = pickedIds.has(variant.id);

          return (
            <Pressable
              key={variant.id}
              onPress={() => toggleVariant(variant)}
              style={[
                styles.variantCard,
                selected && styles.variantCardSelected,
              ]}
            >
              <ProductThumbnail uri={variant.image ?? product.image} size={56} />
              <View style={styles.variantInfo}>
                <Text style={styles.variantName}>
                  {variant.name}
                </Text>
                {variant.sku ? (
                  <Text style={styles.variantMeta}>SKU: {variant.sku}</Text>
                ) : null}
                <Text style={styles.variantPrice}>{formatCurrency(variant.sellingPrice)}</Text>
                <Text style={inStock ? styles.inStock : styles.outOfStock}>
                  {inStock ? t.inStock : t.outOfStock}
                </Text>
              </View>
              {multiSelect ? (
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {multiSelect ? (
        <Button
          title={
            pickedCount > 0 ? t.addSelected(pickedCount) : t.clearSelection
          }
          onPress={handleConfirm}
          style={styles.confirmBtn}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    marginBottom: 16,
  },
  headerText: { flex: 1, gap: 4 },
  productName: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  helperText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  variantCardSelected: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  variantInfo: {
    flex: 1,
    gap: 4,
  },
  variantName: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  variantMeta: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  variantPrice: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  inStock: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.success,
  },
  outOfStock: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.danger,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  confirmBtn: {
    marginTop: 12,
  },
});

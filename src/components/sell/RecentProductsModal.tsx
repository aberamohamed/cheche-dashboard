import { Modal } from '@/components/ui/Modal';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { useRecentProductsStore } from '@/store/recentProductsStore';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface RecentProductsModalProps {
  visible: boolean;
  onClose: () => void;
  onAddToCart: (products: Product[]) => void;
}

export function RecentProductsModal({
  visible,
  onClose,
  onAddToCart,
}: RecentProductsModalProps) {
  const t = useSellTranslation();
  const products = useRecentProductsStore((s) => s.products);
  const hydrate = useRecentProductsStore((s) => s.hydrate);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      void hydrate();
      setSelectedIds(new Set());
    }
  }, [visible, hydrate]);

  const toggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleAddToCart = () => {
    const selected = products.filter((product) => selectedIds.has(product.productId));
    if (selected.length === 0) return;
    onAddToCart(selected);
    onClose();
  };

  const selectedCount = selectedIds.size;

  return (
    <Modal visible={visible} onClose={onClose} title={t.recentProducts}>
      {selectedCount > 0 ? (
        <Pressable style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.addBtnText}>{t.addToCartCount(selectedCount)}</Text>
        </Pressable>
      ) : null}

      {products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t.noRecentTitle}</Text>
          <Text style={styles.emptySubtitle}>
            {t.noRecentMessage}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.productId);
            return (
              <Pressable
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => toggleProduct(item.productId)}
              >
                <ProductThumbnail uri={item.image} size={48} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.variantName ? (
                    <Text style={styles.variant} numberOfLines={1}>
                      {item.variantName}
                    </Text>
                  ) : null}
                  <Text style={styles.price}>{formatCurrency(item.sellingPrice)}</Text>
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    marginBottom: 12,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    ...Typography.subhead,
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    maxHeight: 420,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowSelected: {
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.md,
    borderBottomColor: 'transparent',
    marginBottom: 2,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  variant: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  price: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
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
  empty: {
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

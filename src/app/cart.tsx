import { SellCartItem } from '@/components/sell/SellCartItem';
import { Button } from '@/components/ui/Button';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useCheckoutTranslation } from '@/hooks/useCheckoutTranslation';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/utils/format';
import { navigateToCheckout } from '@/utils/navigateToCheckout';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const t = useCheckoutTranslation();
  const sell = useSellTranslation();
  const items = useCartStore((s) => s.items);
  const discount = useCartStore((s) => s.discount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCheckoutSource = useCartStore((s) => s.setCheckoutSource);

  const itemCount = getItemCount();
  const cartTotal = getTotal();
  const isEmpty = items.length === 0;

  const handleClearAll = () => {
    if (isEmpty) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearCart();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.sheetTop}>
        <View style={styles.handle} />
        <ModalSheetHeader
          title={sell.selectedItems(itemCount)}
          subtitle={!isEmpty ? formatCurrency(cartTotal) : undefined}
          onBack={() => router.back()}
          right={
            <Pressable onPress={handleClearAll} hitSlop={8} disabled={isEmpty}>
              <Text style={[styles.clearBtn, isEmpty && styles.clearBtnMuted]}>{sell.clearAll}</Text>
            </Pressable>
          }
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SellCartItem
            item={item}
            onIncrease={() => updateQuantity(item.product_id, item.quantity + 1)}
            onDecrease={() => updateQuantity(item.product_id, item.quantity - 1)}
          />
        )}
      />

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>{t.subtotal}</Text>
          <Text style={styles.value}>{formatCurrency(getSubtotal())}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>{t.discount}</Text>
            <Text style={[styles.value, styles.discount]}>-{formatCurrency(discount)}</Text>
          </View>
        )}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t.total}</Text>
          <Text style={styles.totalValue}>{formatCurrency(getTotal())}</Text>
        </View>
        <Button
          title={sell.checkout}
          onPress={() => {
            setCheckoutSource('cart');
            navigateToCheckout(true);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  sheetTop: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  clearBtn: { ...Typography.subhead, color: Brand.primary, fontWeight: '600' },
  clearBtnMuted: { opacity: 0.45 },
  list: { flex: 1, backgroundColor: Colors.white },
  listContent: { paddingBottom: 200, backgroundColor: Colors.white },
  summary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...Typography.subhead, color: Colors.textSecondary },
  value: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  discount: { color: Colors.success },
  totalRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginBottom: 8 },
  totalLabel: { ...Typography.headline, color: Colors.text },
  totalValue: { ...Typography.title3, color: Brand.primary },
});

import { BarcodeScannerView } from '@/components/sell/BarcodeScannerView';
import { SellCartItem } from '@/components/sell/SellCartItem';
import { Button } from '@/components/ui/Button';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useSellLayoutMetrics } from '@/hooks/useSellLayoutMetrics';
import { useSellBottomPadding } from '@/hooks/useTabBarInsets';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/utils/format';
import { navigateToCheckout } from '@/utils/navigateToCheckout';
import * as Haptics from 'expo-haptics';
import { ChevronRight, CreditCard, Package, ShoppingBag } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SellScanPanelProps {
  onBarcodeScanned: (barcode: string) => void;
}

export function SellScanPanel({ onBarcodeScanned }: SellScanPanelProps) {
  const t = useSellTranslation();
  const {
    scannerHeight,
    sheetOverlap,
    sheetTopRadius,
    emptyIllustrationSize,
    horizontalPadding,
  } = useSellLayoutMetrics();
  const sellBottomPadding = useSellBottomPadding();

  const [flash, setFlash] = useState(false);

  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCheckoutSource = useCartStore((s) => s.setCheckoutSource);

  const isEmpty = items.length === 0;
  const canCheckout = itemCount > 0;
  const checkoutLabel = t.checkoutLabel(itemCount);

  const handleClearAll = () => {
    if (isEmpty) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearCart();
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    setCheckoutSource('cart');
    navigateToCheckout();
  };

  return (
    <View style={styles.panel}>
      <View style={styles.scannerSection}>
        <View style={[styles.scannerAnchor, { height: scannerHeight + sheetOverlap }]}>
          <BarcodeScannerView
            height={scannerHeight + sheetOverlap}
            visibleCameraHeight={scannerHeight - sheetOverlap}
            flash={flash}
            onFlashToggle={() => setFlash((on) => !on)}
            onBarcodeScanned={onBarcodeScanned}
          />
        </View>

        <View
          style={[
            styles.sheet,
            {
              top: scannerHeight - sheetOverlap,
              borderTopLeftRadius: sheetTopRadius,
              borderTopRightRadius: sheetTopRadius,
            },
          ]}
        >
          <View style={[styles.sheetHeader, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.sheetHeaderLeft}>
              <Text style={styles.sheetTitle}>{t.selectedItems(itemCount)}</Text>
              {!isEmpty ? (
                <Text style={styles.sheetTotal}>{formatCurrency(cartTotal)}</Text>
              ) : null}
            </View>
            <Pressable onPress={handleClearAll} hitSlop={8} disabled={isEmpty}>
              <Text style={[styles.clearBtn, isEmpty && styles.clearBtnMuted]}>{t.clearAll}</Text>
            </Pressable>
          </View>

          <View style={styles.sheetBody}>
            {isEmpty ? (
              <ScrollView
                style={styles.emptyScroll}
                contentContainerStyle={styles.emptyScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.selectedEmptyRow, { marginHorizontal: horizontalPadding }]}>
                  <View style={styles.selectedEmptyIcon}>
                    <ShoppingBag size={22} color={Brand.primary} />
                  </View>
                  <View style={styles.selectedEmptyText}>
                    <Text style={styles.selectedEmptyTitle}>{t.noItemsSelected}</Text>
                    <Text style={styles.selectedEmptySubtitle}>
                      {t.scanToAdd}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>

                <View style={styles.cartEmptySection}>
                  <View
                    style={[
                      styles.cartEmptyIllustration,
                      {
                        width: emptyIllustrationSize,
                        height: emptyIllustrationSize,
                      },
                    ]}
                  >
                    <Package
                      size={Math.round(emptyIllustrationSize * 0.47)}
                      color={Colors.border}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text style={styles.cartEmptyTitle}>{t.cartEmpty}</Text>
                  <Text style={styles.cartEmptySubtitle}>
                    {t.cartEmptyHint}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item.product_id}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 12 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <SellCartItem
                    item={item}
                    onIncrease={() => updateQuantity(item.product_id, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.product_id, item.quantity - 1)}
                  />
                )}
              />
            )}
          </View>

          <View
            style={[
              styles.footer,
              { paddingHorizontal: horizontalPadding, paddingBottom: sellBottomPadding },
            ]}
          >
            <Button
              title={checkoutLabel}
              onPress={handleCheckout}
              disabled={!canCheckout}
              style={styles.checkoutBtn}
              icon={<CreditCard size={18} color="#FFFFFF" strokeWidth={2.25} />}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: Colors.white },
  scannerSection: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  scannerAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sheetHeaderLeft: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  sheetTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  sheetTotal: { ...Typography.headline, color: Colors.text, fontWeight: '700' },
  clearBtn: { ...Typography.subhead, color: Brand.primary, fontWeight: '600' },
  clearBtnMuted: { opacity: 0.45 },
  sheetBody: {
    flex: 1,
    minHeight: 0,
  },
  emptyScroll: { flex: 1 },
  emptyScrollContent: { flexGrow: 1 },
  selectedEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 12,
  },
  selectedEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmptyText: { flex: 1, gap: 2 },
  selectedEmptyTitle: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  selectedEmptySubtitle: { ...Typography.caption1, color: Colors.textSecondary },
  cartEmptySection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
  },
  cartEmptyIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cartEmptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  cartEmptySubtitle: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  list: { flex: 1 },
  footer: {
    flexShrink: 0,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  checkoutBtn: {
    height: 55,
    borderRadius: 14,
    backgroundColor: Brand.primary,
  },
});

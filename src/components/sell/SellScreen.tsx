import { ProductVariantPickerModal } from '@/components/sell/ProductVariantPickerModal';
import { RecentProductsModal } from '@/components/sell/RecentProductsModal';
import { SellItemsPanel } from '@/components/sell/SellItemsPanel';
import { SellKeypadPanel } from '@/components/sell/SellKeypadPanel';
import { SellModeTabs, type SellMode } from '@/components/sell/SellModeTabs';
import { SellScanPanel } from '@/components/sell/SellScanPanel';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { GradientHeaderShell } from '@/components/ui/GradientHeaderShell';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import {
  SCREEN_HEADER_PADDING_BOTTOM,
  SCREEN_HEADER_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
  screenHeaderTitleText,
} from '@/constants/screenHeader';
import { useGuestRegistrationGate } from '@/hooks/useGuestRegistrationGate';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { getProductByBarcode } from '@/services/productService';
import { useCartStore } from '@/store/cartStore';
import { useTaxesStore } from '@/store/taxesStore';
import { useRecentProductsStore } from '@/store/recentProductsStore';
import type { Product, ProductVariant } from '@/types';
import { appAlert } from '@/utils/alert';
import { formatCurrency } from '@/utils/format';
import { navigateToCheckout } from '@/utils/navigateToCheckout';
import { applyVariantToProduct, needsVariantSelection } from '@/utils/productVariants';
import { touchSessionActivity } from '@/utils/sessionActivity';
import { withLoading } from '@/utils/withLoading';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Package, ShoppingCart } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function SellScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [activeMode, setActiveMode] = useState<SellMode>('keypad');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);
  const [recentVisible, setRecentVisible] = useState(false);
  const [modalQty, setModalQty] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const setCheckoutSource = useCartStore((s) => s.setCheckoutSource);
  const hydrateRecent = useRecentProductsStore((s) => s.hydrate);
  const { requireRegistration, modal: guestRegistrationModal } = useGuestRegistrationGate();
  const darkMode = useDarkMode();
  const t = useSellTranslation();

  useEffect(() => {
    void hydrateRecent();
  }, [hydrateRecent]);

  const prefetchTaxes = useTaxesStore((s) => s.prefetchTaxes);

  useEffect(() => {
    prefetchTaxes();
  }, [prefetchTaxes]);

  const handleHeaderCartPress = useCallback(() => {
    if (cartItemCount === 0) return;
    if (!requireRegistration()) return;
    setCheckoutSource('cart');
    navigateToCheckout();
  }, [cartItemCount, requireRegistration, setCheckoutSource]);

  const handleSelectProduct = useCallback((product: Product) => {
    if (needsVariantSelection(product)) {
      setVariantPickerProduct(product);
      return;
    }
    addItem(product);
  }, [addItem]);

  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    if (!variantPickerProduct) return;
    addItem(applyVariantToProduct(variantPickerProduct, variant));
    setVariantPickerProduct(null);
  }, [addItem, variantPickerProduct]);

  const handleAddProductsToCart = useCallback((products: Product[]) => {
    products.forEach((product) => {
      addItem(product);
    });

    useCartStore.getState().setCheckoutSource('cart');
    navigateToCheckout();
  }, [addItem]);

  const handleAddRecentToCart = useCallback((products: Product[]) => {
    handleAddProductsToCart(products);
  }, [handleAddProductsToCart]);

  const handleKeypadCheckout = useCallback(() => {
    navigateToCheckout();
  }, []);

  const handleBarcode = useCallback(async (barcode: string) => {
    await withLoading(async () => {
      touchSessionActivity();
      const product = await getProductByBarcode(barcode);
      if (product) {
        handleSelectProduct(product);
      } else {
        appAlert(t.productNotFound, t.productNotFoundMessage(barcode), undefined, {
          variant: 'info',
        });
      }
    }, t.lookingUpProduct);
  }, [handleSelectProduct, t]);

  const handleAddFromModal = () => {
    if (selectedProduct) {
      addItem(selectedProduct, modalQty);
      setSelectedProduct(null);
    }
  };

  const renderModeContent = () => {
    if (activeMode === 'keypad') {
      return (
        <SellKeypadPanel
          onCheckout={handleKeypadCheckout}
          onViewAllServices={() => setActiveMode('items')}
        />
      );
    }

    if (activeMode === 'items') {
      return (
        <SellItemsPanel />
      );
    }

    if (!permission) {
      return (
        <View style={styles.permissionWrap}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionWrap}>
          <EmptyState
            title={t.cameraAccessTitle}
            message={t.cameraAccessMessage}
            actionLabel={t.grantPermission}
            onAction={requestPermission}
          />
        </View>
      );
    }

    return (
      <SellScanPanel onBarcodeScanned={handleBarcode} />
    );
  };

  return (
    <View style={styles.screen}>
      <GradientHeaderShell>
        <View style={styles.headerRow}>
          <HeaderBackButton
            onPress={() => router.navigate('/(tabs)/home')}
            variant={darkMode ? 'dark' : 'light'}
            accessibilityLabel={t.backToHome}
          />
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, !darkMode && styles.headerTitleLight]} numberOfLines={1}>
              {t.tabTitle}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[
                styles.headerCartBtn,
                !darkMode && styles.headerCartBtnLight,
                cartItemCount === 0 && styles.headerCartBtnDisabled,
              ]}
              onPress={handleHeaderCartPress}
              disabled={cartItemCount === 0}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.cart}
            >
              <ShoppingCart size={18} color={darkMode ? '#FFFFFF' : Brand.primary} strokeWidth={2.25} />
              {cartItemCount > 0 ? (
                <View style={styles.headerCartBadge}>
                  <Text style={styles.headerCartBadgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
      </GradientHeaderShell>

      {guestRegistrationModal}

      <SellModeTabs active={activeMode} onChange={setActiveMode} />
      <View style={styles.content}>{renderModeContent()}</View>

      <RecentProductsModal
        visible={recentVisible}
        onClose={() => setRecentVisible(false)}
        onAddToCart={handleAddRecentToCart}
      />

      <ProductVariantPickerModal
        product={variantPickerProduct}
        onClose={() => setVariantPickerProduct(null)}
        onSelect={handleVariantSelect}
      />

      <Modal visible={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={t.productDetails}>
        {selectedProduct && (
          <View style={styles.modalContent}>
            <View style={styles.modalImage}>
              <Package size={48} color={Brand.primary} />
            </View>
            <Text style={styles.modalName}>{selectedProduct.name}</Text>
            <Text style={styles.modalPrice}>{formatCurrency(selectedProduct.sellingPrice)}</Text>
            <View style={styles.modalQty}>
              <Pressable style={styles.qtyBtn} onPress={() => setModalQty(Math.max(1, modalQty - 1))}>
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.modalQtyText}>{modalQty}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => setModalQty(modalQty + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
            <Button title={t.addToSale} onPress={handleAddFromModal} />
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: SCREEN_HEADER_PADDING_TOP,
    paddingBottom: SCREEN_HEADER_PADDING_BOTTOM,
    gap: 10,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...screenHeaderTitleText,
    color: Colors.white,
  },
  headerTitleLight: {
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: SCREEN_HEADER_SIDE_SIZE,
  },
  headerCartBtn: {
    width: SCREEN_HEADER_SIDE_SIZE,
    height: SCREEN_HEADER_SIDE_SIZE,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCartBtnLight: {
    backgroundColor: Brand.primaryMuted,
    borderColor: 'transparent',
  },
  headerCartBtnDisabled: {
    opacity: 0.55,
  },
  headerCartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  headerCartBadgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  content: { flex: 1, minHeight: 0 },
  permissionWrap: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { gap: 12 },
  modalImage: {
    height: 120,
    backgroundColor: Brand.primaryMuted,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalName: { ...Typography.title3, color: Colors.text, textAlign: 'center' },
  modalPrice: { ...Typography.title2, color: Brand.primary, textAlign: 'center' },
  modalQty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { ...Typography.title3, color: Brand.primary },
  modalQtyText: { ...Typography.title2, color: Colors.text },
});

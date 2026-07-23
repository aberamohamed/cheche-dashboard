import { ProductVariantPickerModal } from '@/components/sell/ProductVariantPickerModal';
import { Button } from '@/components/ui/Button';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { FilterSheetModal } from '@/components/ui/FilterSheetModal';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useOfflineProductsStore } from '@/store/offlineProductsStore';
import { useRecentProductsStore } from '@/store/recentProductsStore';
import type { CartItem, Product, ProductVariant } from '@/types';
import { formatCurrency } from '@/utils/format';
import {
  OTHER_CATEGORY_TAB_ID,
  productMatchesCategoryTab,
} from '@/utils/productFilters';
import { useGuestRegistrationGate } from '@/hooks/useGuestRegistrationGate';
import { useSellBottomPadding } from '@/hooks/useTabBarInsets';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { navigateToCheckout } from '@/utils/navigateToCheckout';
import { applyVariantToProduct, needsVariantSelection } from '@/utils/productVariants';
import { ChevronDown, ChevronUp, CreditCard, ListFilter, Minus, Plus, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ListRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'product'; id: string; product: Product };

function getCartVariantIdsForTemplate(product: Product, cartItems: CartItem[]): string[] {
  return cartItems
    .filter((item) => item.product.id === product.id)
    .map((item) => item.product.productId);
}

function getCartSelectionsForTemplate(templateId: string, cartItems: CartItem[]): Product[] {
  return cartItems
    .filter((item) => item.product.id === templateId)
    .map((item) => item.product);
}

function appendProductRows(products: Product[], rows: ListRow[], idPrefix: string) {
  for (const product of products) {
    rows.push({
      type: 'product',
      id: `${idPrefix}-${product.productId}`,
      product,
    });
  }
}

function buildCategoryProductRows(
  products: Product[],
  categoryNameById: Map<string, string>,
  categoryOrder: string[],
  groupByCategory: boolean,
  categoryLabels: { other: string; uncategorized: string }
): ListRow[] {
  if (products.length === 0) return [];

  if (!groupByCategory) {
    const rows: ListRow[] = [];
    appendProductRows(products, rows, 'filtered');
    return rows;
  }

  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.categoryId?.trim() || OTHER_CATEGORY_TAB_ID;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(product);
    } else {
      groups.set(key, [product]);
    }
  }

  const orderedKeys: string[] = [];
  const seen = new Set<string>();

  for (const categoryId of categoryOrder) {
    if (groups.has(categoryId)) {
      orderedKeys.push(categoryId);
      seen.add(categoryId);
    }
  }

  const remainingKeys = Array.from(groups.keys())
    .filter((key) => !seen.has(key) && key !== OTHER_CATEGORY_TAB_ID)
    .sort((left, right) => {
      const leftName =
        categoryNameById.get(left) ??
        groups.get(left)?.[0]?.category ??
        left;
      const rightName =
        categoryNameById.get(right) ??
        groups.get(right)?.[0]?.category ??
        right;
      return leftName.localeCompare(rightName);
    });

  orderedKeys.push(...remainingKeys);
  if (groups.has(OTHER_CATEGORY_TAB_ID)) {
    orderedKeys.push(OTHER_CATEGORY_TAB_ID);
  }

  const rows: ListRow[] = [];
  for (const categoryId of orderedKeys) {
    const categoryProducts = [...(groups.get(categoryId) ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    if (categoryProducts.length === 0) continue;

    const title =
      categoryNameById.get(categoryId) ??
      categoryProducts[0]?.category ??
      (categoryId === OTHER_CATEGORY_TAB_ID ? categoryLabels.other : categoryLabels.uncategorized);

    rows.push({ type: 'header', id: `header-${categoryId}`, title });
    appendProductRows(categoryProducts, rows, categoryId);
  }

  return rows;
}

export function SellItemsPanel() {
  const t = useSellTranslation();
  const sellBottomPadding = useSellBottomPadding();
  const { requireRegistration, modal: guestRegistrationModal } = useGuestRegistrationGate();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const {
    data: onlineProducts = [],
    isLoading: onlineLoading,
    refetch: refetchOnlineProducts,
    isRefetching: onlineRefetching,
  } = useProducts();
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const offlineProducts = useOfflineProductsStore((s) => s.products);
  const offlineLoading = useOfflineProductsStore((s) => s.loading);
  const refreshOfflineProducts = useOfflineProductsStore((s) => s.refresh);

  // Offline: the Sell catalog comes from the manually-curated offline DB, not the API.
  const dbProducts = isOnline ? onlineProducts : offlineProducts;
  const isLoading = isOnline ? onlineLoading : offlineLoading;
  const isRefetching = isOnline ? onlineRefetching : false;
  const refetchProducts = isOnline ? refetchOnlineProducts : refreshOfflineProducts;
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const cartSubtotal = useCartStore((state) => state.getSubtotal());
  const addItem = useCartStore((state) => state.addItem);
  const setCheckoutSource = useCartStore((state) => state.setCheckoutSource);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const updateCartQuantity = useCartStore((state) => state.updateQuantity);
  const recentProducts = useRecentProductsStore((s) => s.products);
  const hydrateRecent = useRecentProductsStore((s) => s.hydrate);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    void hydrateRecent();
  }, [hydrateRecent]);

  const dbById = useMemo(
    () => new Map(dbProducts.map((product) => [product.productId, product])),
    [dbProducts]
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const categoryOrder = useMemo(
    () => categories.map((category) => category.id),
    [categories]
  );

  const hasOtherCategory = useMemo(
    () => dbProducts.some((product) => productMatchesCategoryTab(product, OTHER_CATEGORY_TAB_ID)),
    [dbProducts]
  );

  const categoryFilterOptions = useMemo(
    () => [
      { id: 'all', label: t.allCategories },
      ...categories.map((category) => ({ id: category.id, label: category.name })),
      ...(hasOtherCategory ? [{ id: OTHER_CATEGORY_TAB_ID, label: t.otherCategory }] : []),
    ],
    [categories, hasOtherCategory, t.allCategories, t.otherCategory]
  );

  const categoryLabels = useMemo(
    () => ({ other: t.otherCategory, uncategorized: t.uncategorized }),
    [t.otherCategory, t.uncategorized]
  );

  const categoryFilterActive = categoryFilter !== 'all';

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesSearch = (product: Product) => {
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.barcode.toLowerCase().includes(query)
      );
    };
    const matchesCategory = (product: Product) => {
      if (categoryFilter === 'all') return true;
      return productMatchesCategoryTab(product, categoryFilter);
    };
    const matchesFilters = (product: Product) =>
      matchesSearch(product) && matchesCategory(product);

    const recentAvailable = recentProducts
      .map((product) => dbById.get(product.productId) ?? product)
      .filter((product) => dbById.has(product.productId) && matchesFilters(product));

    const recentIds = new Set(recentAvailable.map((product) => product.productId));
    const catalogProducts = dbProducts.filter(
      (product) => !recentIds.has(product.productId) && matchesFilters(product)
    );

    const next: ListRow[] = [];
    if (recentAvailable.length > 0) {
      next.push({ type: 'header', id: 'header-recent', title: t.recent });
      appendProductRows(recentAvailable, next, 'recent');
    }
    if (catalogProducts.length > 0) {
      next.push(
        ...buildCategoryProductRows(
          catalogProducts,
          categoryNameById,
          categoryOrder,
          categoryFilter === 'all',
          categoryLabels
        )
      );
    }

    // Hide product rows that belong to a collapsed section header.
    const visible: ListRow[] = [];
    let sectionCollapsed = false;
    for (const row of next) {
      if (row.type === 'header') {
        sectionCollapsed = collapsedSections.has(row.id);
        visible.push(row);
      } else if (!sectionCollapsed) {
        visible.push(row);
      }
    }
    return visible;
  }, [
    categoryFilter,
    categoryNameById,
    categoryOrder,
    collapsedSections,
    dbById,
    dbProducts,
    recentProducts,
    categoryLabels,
    search,
    t.recent,
  ]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    Haptics.selectionAsync();
  };

  const getCartQuantity = (product: Product): number => {
    if (needsVariantSelection(product)) {
      return cartItems
        .filter((item) => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
    }
    return (
      cartItems.find((item) => item.product_id === product.productId)?.quantity ?? 0
    );
  };

  const handleIncrement = (product: Product) => {
    if (needsVariantSelection(product)) {
      setVariantPickerProduct(product);
      return;
    }

    addItem(product);
    setCheckoutSource('cart');
    Haptics.selectionAsync();
  };

  const handleDecrement = (product: Product) => {
    if (needsVariantSelection(product)) {
      setVariantPickerProduct(product);
      return;
    }

    const current = getCartQuantity(product);
    if (current <= 0) return;
    updateCartQuantity(product.productId, current - 1);
    Haptics.selectionAsync();
  };

  const handleVariantConfirm = (variants: ProductVariant[]) => {
    if (!variantPickerProduct) return;

    const templateId = variantPickerProduct.id;
    const selectedIds = new Set(variants.map((variant) => variant.id));

    cartItems
      .filter(
        (item) =>
          item.product.id === templateId && !selectedIds.has(item.product.productId)
      )
      .forEach((item) => removeCartItem(item.product_id));

    const cartProductIds = new Set(cartItems.map((item) => item.product_id));
    variants.forEach((variant) => {
      const resolved = applyVariantToProduct(variantPickerProduct, variant);
      if (!cartProductIds.has(resolved.productId)) {
        addItem(resolved);
      }
    });

    setCheckoutSource('cart');
    setVariantPickerProduct(null);
    Haptics.selectionAsync();
  };

  const cartActionEnabled = cartItems.length > 0;
  const checkoutLabel = t.checkoutLabel(cartItemCount);

  const handleCheckout = useCallback(() => {
    if (!cartActionEnabled) return;
    if (!requireRegistration()) return;
    setCheckoutSource('cart');
    navigateToCheckout();
  }, [cartActionEnabled, requireRegistration, setCheckoutSource]);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Promise.all([refetchProducts(), refetchCategories()]);
  }, [refetchCategories, refetchProducts]);

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={handleRefresh}
      tintColor={Brand.primary}
      colors={[Brand.primary]}
    />
  );

  const renderProductRow = (product: Product) => {
    const selectedVariants = getCartSelectionsForTemplate(product.id, cartItems);
    const quantity = getCartQuantity(product);
    const inCart = quantity > 0;
    const isVariantProduct = needsVariantSelection(product);
    const resolved = selectedVariants[0];
    const variantLabel =
      selectedVariants.length > 1
        ? `${selectedVariants.length} variants`
        : resolved?.variantName ?? product.variantName;
    const displayPrice =
      selectedVariants.length > 1
        ? Math.min(...selectedVariants.map((entry) => entry.sellingPrice))
        : resolved?.sellingPrice ?? product.sellingPrice;
    const stockLabel = Number.isFinite(product.stock) ? String(product.stock) : '0';
    const rowTotal = isVariantProduct
      ? cartItems
          .filter((item) => item.product.id === product.id)
          .reduce((sum, item) => sum + item.quantity * item.product.sellingPrice, 0)
      : quantity * product.sellingPrice;

    return (
      <Pressable
        style={[styles.listCard, inCart && styles.listCardSelected]}
        onPress={() => handleIncrement(product)}
      >
        <ProductThumbnail uri={product.image} size={52} style={styles.listImage} />
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.listPrice} numberOfLines={1}>
            {selectedVariants.length > 1
              ? `From ${formatCurrency(displayPrice)}`
              : formatCurrency(displayPrice)}
          </Text>
          <Text style={styles.listVariant} numberOfLines={1}>
            {variantLabel ? `${variantLabel} · Stock: ${stockLabel}` : `Stock: ${stockLabel}`}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepBtn, !inCart && styles.stepBtnDisabled]}
              onPress={() => handleDecrement(product)}
              hitSlop={8}
            >
              <Minus
                size={16}
                color={inCart ? Brand.primary : Colors.textSecondary}
                strokeWidth={2.5}
              />
            </Pressable>
            <Text style={styles.stepQty}>{quantity}</Text>
            <Pressable
              style={[styles.stepBtn, styles.stepBtnAdd]}
              onPress={() => handleIncrement(product)}
              hitSlop={8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text style={styles.rowTotalText} numberOfLines={1}>
            Total: <Text style={styles.rowTotalValue}>{formatCurrency(rowTotal)}</Text>
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.panel}>
      <View style={[styles.searchWrap, (searchFocused || categoryFilterActive) && styles.searchWrapFocused]}>
        <Search size={18} color={searchFocused ? Brand.primary : Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchProducts}
          placeholderTextColor={Colors.textSecondary}
          autoCorrect={false}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <View style={styles.searchDivider} />
        <Pressable
          style={[styles.filterBtn, categoryFilterActive && styles.filterBtnActive]}
          onPress={() => setFilterOpen(true)}
          hitSlop={6}
        >
          <ListFilter size={18} color={Brand.primary} />
          {categoryFilterActive ? <View style={styles.filterDot} /> : null}
        </Pressable>
      </View>

      {isLoading && rows.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            rows.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t.noProductsFound}</Text>
              <Text style={styles.emptySubtitle}>
                {search.trim() || categoryFilterActive
                  ? t.noProductsSearchHint
                  : t.noProductsEmpty}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              const isCollapsed = collapsedSections.has(item.id);
              return (
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  <Pressable
                    style={styles.collapseBtn}
                    onPress={() => toggleSection(item.id)}
                    hitSlop={8}
                  >
                    {isCollapsed ? (
                      <ChevronDown size={14} color={Brand.primary} strokeWidth={2.5} />
                    ) : (
                      <ChevronUp size={14} color={Brand.primary} strokeWidth={2.5} />
                    )}
                    <Text style={styles.collapseText}>
                      {isCollapsed ? 'Expand' : 'Collapse'}
                    </Text>
                  </Pressable>
                </View>
              );
            }

            return renderProductRow(item.product);
          }}
        />
      )}

      <View style={[styles.footer, { paddingBottom: sellBottomPadding }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerCount} numberOfLines={1}>
            {cartItemCount} Items
          </Text>
          <Text style={styles.footerTotalLabel} numberOfLines={1}>
            Total{' '}
            <Text style={styles.footerTotalValue}>{formatCurrency(cartSubtotal)}</Text>
          </Text>
        </View>
        <Button
          title={checkoutLabel}
          onPress={handleCheckout}
          disabled={!cartActionEnabled}
          style={styles.checkoutBtn}
          icon={<CreditCard size={18} color="#FFFFFF" strokeWidth={2.25} />}
        />
      </View>

      <ProductVariantPickerModal
        product={variantPickerProduct}
        multiSelect
        selectedVariantIds={
          variantPickerProduct
            ? getCartVariantIdsForTemplate(variantPickerProduct, cartItems)
            : []
        }
        onClose={() => setVariantPickerProduct(null)}
        onConfirm={handleVariantConfirm}
      />

      <FilterSheetModal
        visible={filterOpen}
        title={t.filterByCategory}
        sections={[{ key: 'category', title: t.category, options: categoryFilterOptions }]}
        values={{ category: categoryFilter }}
        onClose={() => setFilterOpen(false)}
        onApply={(values) => {
          setCategoryFilter(values.category ?? 'all');
          setFilterOpen(false);
        }}
        onReset={() => {
          setCategoryFilter('all');
          setFilterOpen(false);
        }}
      />
      {guestRegistrationModal}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: Colors.white },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingLeft: 14,
    paddingRight: 8,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchWrapFocused: {
    borderColor: Brand.primary,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
  },
  searchDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: Colors.border,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.primaryMuted,
  },
  filterBtnActive: {
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.primary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  collapseText: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '600',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    ...Shadow.iosCard,
  },
  listCardSelected: {
    borderColor: Brand.primary,
  },
  listImage: {
    borderRadius: Radius.sm,
  },
  listInfo: {
    flex: 1,
    gap: 2,
  },
  listName: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  listPrice: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Brand.primary,
  },
  listVariant: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  stepBtnAdd: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  stepBtnDisabled: {
    borderColor: Colors.border,
  },
  stepQty: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 22,
    textAlign: 'center',
  },
  rowTotalText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  rowTotalValue: {
    fontWeight: '700',
    color: Brand.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  footer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerSummary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 2,
  },
  footerCount: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  footerTotalLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  footerTotalValue: {
    fontWeight: '700',
    color: Brand.primary,
  },
  checkoutBtn: {
    flex: 1,
    height: 55,
    borderRadius: 14,
    backgroundColor: Brand.primary,
  },
});

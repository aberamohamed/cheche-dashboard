import { CheckoutFab } from '@/components/products/CheckoutFab';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { ProductGridCard } from '@/components/products/ProductGridCard';
import { ProductVariantPickerModal } from '@/components/sell/ProductVariantPickerModal';
import { StockStatusTabs } from '@/components/products/StockStatusTabs';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import {
  ProductGridCardSkeleton,
  SearchBarSkeleton,
  Skeleton,
  StockStatusTabsSkeleton,
} from '@/components/ui/Skeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { searchProducts } from '@/services/productService';
import { useCartStore } from '@/store/cartStore';
import type { Product, ProductVariant } from '@/types';
import {
  filterProductsByStockTab,
  OTHER_CATEGORY_TAB_ID,
  productMatchesCategoryTab,
  type ProductStockTab,
} from '@/utils/productFilters';
import { showToast } from '@/utils/toast';
import { navigateToCheckout } from '@/utils/navigateToCheckout';
import { applyVariantToProduct, needsVariantSelection } from '@/utils/productVariants';
import { router, useLocalSearchParams } from 'expo-router';
import { Package } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NUM_COLUMNS = 2;

function getEmptyState(tab: ProductStockTab) {
  switch (tab) {
    case 'expiring':
      return {
        title: 'No Expiring Products!',
        message: 'All products are safe within the next 30 days',
      };
    case 'low_stock':
      return {
        title: 'No Low Stock Products',
        message: 'All products are above their minimum stock level',
      };
    case 'out_of_stock':
      return {
        title: 'No Out of Stock Products',
        message: 'Every product currently has available stock',
      };
    default:
      return {
        title: 'No products yet',
        message: 'Add your first product to get started',
      };
  }
}

function ProductGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.gridItemLoader}>
          <ProductGridCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export default function CategoryItemsScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductStockTab>('in_stock');
  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading, refetch } = useProducts('all');
  const cartItems = useCartStore((s) => s.items);
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const addItem = useCartStore((s) => s.addItem);
  const setCheckoutSource = useCartStore((s) => s.setCheckoutSource);

  const cartQuantitiesByProductId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of cartItems) {
      const templateId = item.product.id;
      counts.set(templateId, (counts.get(templateId) ?? 0) + item.quantity);
    }
    return counts;
  }, [cartItems]);

  const insets = useSafeAreaInsets();
  const fabHeight = 52;
  const fabBottom = insets.bottom + 16;
  const listPaddingBottom = fabBottom + fabHeight + 16;

  const title = categoryName?.trim() || 'Products';

  const headerRight = (
    <HeaderAddItemButton
      label="Add Item"
      onPress={() => {
        if (categoryId && categoryId !== OTHER_CATEGORY_TAB_ID) {
          router.push({ pathname: '/add-item', params: { categoryId } });
          return;
        }
        router.push('/add-item');
      }}
    />
  );

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (search.length <= 1) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results = await searchProducts(search);
        if (active) setSearchResults(results);
      } finally {
        if (active) setSearching(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [search]);

  const categoryProducts = useMemo(() => {
    if (!categoryId) return [];
    return products.filter((product) => productMatchesCategoryTab(product, categoryId));
  }, [products, categoryId]);

  const filtered = useMemo(() => {
    const base = search.length > 1 ? searchResults : categoryProducts;
    const inCategory =
      search.length > 1 && categoryId
        ? base.filter((product) => productMatchesCategoryTab(product, categoryId))
        : base;
    return filterProductsByStockTab(inCategory, activeTab);
  }, [search, searchResults, categoryProducts, categoryId, activeTab]);

  const empty = getEmptyState(activeTab);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (needsVariantSelection(product)) {
        setVariantPickerProduct(product);
        return;
      }
      addItem(product);
      showToast(`${product.name} added to cart`);
    },
    [addItem]
  );

  const handleVariantSelect = useCallback(
    (variant: ProductVariant) => {
      if (!variantPickerProduct) return;
      const resolved = applyVariantToProduct(variantPickerProduct, variant);
      addItem(resolved);
      showToast(`${resolved.name} added to cart`);
      setVariantPickerProduct(null);
    },
    [addItem, variantPickerProduct]
  );

  const handleCheckout = useCallback(() => {
    if (cartItemCount <= 0) return;
    setCheckoutSource('cart');
    navigateToCheckout();
  }, [cartItemCount, setCheckoutSource]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={title} onBack={() => router.back()} right={headerRight} />
        <StockStatusTabsSkeleton />
        <View style={styles.searchWrap}>
          <SearchBarSkeleton />
        </View>
        <View style={styles.countSkeletonWrap}>
          <Skeleton width={80} height={12} borderRadius={6} />
        </View>
        <ProductGridSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} onBack={() => router.back()} right={headerRight} />

      <StockStatusTabs activeId={activeTab} onChange={setActiveTab} />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search products by name or SKU..."
        />
      </View>

      <Text style={styles.countLabel}>
        {filtered.length} product{filtered.length === 1 ? '' : 's'}
      </Text>

      {searching ? (
        <ProductGridSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          key={`grid-${NUM_COLUMNS}`}
          columnWrapperStyle={styles.gridRow}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listContentEmpty,
            { paddingBottom: listPaddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Package size={36} color={Brand.primary} />
              </View>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptyMessage}>{empty.message}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductGridCard
                layout="store"
                product={item}
                cartQuantity={cartQuantitiesByProductId.get(item.id) ?? 0}
                onPress={() => setSelectedId(item.id)}
                onAddToCart={() => handleAddToCart(item)}
              />
            </View>
          )}
        />
      )}

      <CheckoutFab bottom={fabBottom} itemCount={cartItemCount} onPress={handleCheckout} />

      <ProductDetailModal
        productId={selectedId}
        fallback={filtered.find((p) => p.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)}
      />

      <ProductVariantPickerModal
        product={variantPickerProduct}
        onClose={() => setVariantPickerProduct(null)}
        onSelect={handleVariantSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  countSkeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  countLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  list: { flex: 1, backgroundColor: Colors.white },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  listContentEmpty: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  gridItemLoader: {
    width: '47%',
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
    width: '100%',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyMessage: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

import { ProductListCard } from '@/components/products/ProductListCard';
import { StockReportCategoryFilterModal } from '@/components/products/StockReportCategoryFilterModal';
import { StockReportSortPicker, getStockSortLabel } from '@/components/products/StockReportSortPicker';
import { StockReportHero } from '@/components/products/StockReportHero';
import { StockStatusTabs } from '@/components/products/StockStatusTabs';
import { HeaderFilterButton } from '@/components/ui/HeaderFilterButton';
import { ProductGridCardSkeleton } from '@/components/ui/Skeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { searchProducts } from '@/services/productService';
import type { Product } from '@/types';
import {
  filterProductsByCategories,
  filterProductsByStockTab,
  getDefaultStockSort,
  getProductStockStats,
  sortProductsForStockTab,
  type ProductStockSort,
  type ProductStockTab,
} from '@/utils/productFilters';
import { router } from 'expo-router';
import { ChevronDown, PartyPopper } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NUM_COLUMNS = 1;

function getEmptyState(tab: ProductStockTab) {
  switch (tab) {
    case 'expiring':
      return {
        title: 'No Expiring Products!',
        message: 'All products are safe within the next 30 days',
        icon: 'party' as const,
      };
    case 'low_stock':
      return {
        title: 'No Low Stock Products',
        message: 'All products are above their minimum stock level',
        icon: 'package' as const,
      };
    case 'out_of_stock':
      return {
        title: 'No Out of Stock Products',
        message: 'Every product currently has available stock',
        icon: 'package' as const,
      };
    default:
      return {
        title: 'No In Stock Products',
        message: 'No products match this stock status',
        icon: 'package' as const,
      };
  }
}

export default function StockReportScreen() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductStockTab>('expiring');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<ProductStockSort>('name');
  const sortAnchorRef = useRef<View>(null);

  const { data: products = [], isLoading, refetch, isRefetching } = useProducts('all');

  const insets = useSafeAreaInsets();
  const listPaddingBottom = insets.bottom + 16;

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

  useEffect(() => {
    setSortBy(getDefaultStockSort(activeTab));
  }, [activeTab]);

  const stats = useMemo(() => getProductStockStats(products), [products]);

  const filtered = useMemo(() => {
    const base = search.length > 1 ? searchResults : products;
    const byStock = filterProductsByStockTab(base, activeTab);
    const byCategory = filterProductsByCategories(byStock, selectedCategoryIds);
    return sortProductsForStockTab(byCategory, activeTab, sortBy);
  }, [search, searchResults, products, activeTab, selectedCategoryIds, sortBy]);

  const empty = getEmptyState(activeTab);

  return (
    <View style={styles.screen}>
      <StockReportHero stats={stats} onBack={() => router.back()} />

      <StockStatusTabs activeId={activeTab} onChange={setActiveTab} fullWidth />

      <View style={styles.searchRow}>
        <View style={styles.searchBarWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search products by name or SKU..."
          />
        </View>
        <HeaderFilterButton
          variant="tile"
          onPress={() => setFilterOpen(true)}
          active={selectedCategoryIds.length > 0}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.countLabel}>
          {filtered.length} product{filtered.length === 1 ? '' : 's'}
        </Text>
        <Pressable
          ref={sortAnchorRef}
          style={styles.sortRow}
          onPress={() => setSortOpen(true)}
          hitSlop={8}
        >
          <Text style={styles.sortLabel}>Sort by: </Text>
          <Text style={styles.sortValue}>{getStockSortLabel(sortBy, activeTab)}</Text>
          <ChevronDown size={14} color={Brand.primary} />
        </Pressable>
      </View>

      {isLoading || searching ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.listItemLoader}>
              <ProductGridCardSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          key={`list-${NUM_COLUMNS}`}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listContentEmpty,
            { paddingBottom: listPaddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          scrollEnabled={true}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              {empty.icon === 'party' ? (
                <PartyPopper size={40} color={Colors.success} />
              ) : (
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                </View>
              )}
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptyMessage}>{empty.message}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductListCard
              product={item}
              onPress={() => router.push(`/product-detail/${item.id}`)}
            />
          )}
        />
      )}

      <StockReportCategoryFilterModal
        visible={filterOpen}
        selectedIds={selectedCategoryIds}
        onClose={() => setFilterOpen(false)}
        onApply={setSelectedCategoryIds}
      />

      <StockReportSortPicker
        visible={sortOpen}
        selectedId={sortBy}
        tab={activeTab}
        anchorRef={sortAnchorRef}
        onClose={() => setSortOpen(false)}
        onSelect={setSortBy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  searchBarWrap: { flex: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  countLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  sortValue: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
  },
  list: { flex: 1, backgroundColor: Colors.white },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  listContentEmpty: { flex: 1 },
  listItemLoader: {
    width: '100%',
    marginBottom: 12,
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
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 32 },
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

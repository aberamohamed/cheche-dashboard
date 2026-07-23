import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useItemPrices } from '@/hooks/usePricing';
import { formatPriceTypeLabel, type ItemPriceListItem } from '@/services/pricingService';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { router, type Href } from 'expo-router';
import { DollarSign } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ItemPriceRow({ item }: { item: ItemPriceListItem }) {
  const createdLabel = item.createdAt ? format(parseISO(item.createdAt), 'MMM d, yyyy') : null;

  return (
    <View style={styles.card}>
      <View style={styles.rowIconWrap}>
        <DollarSign size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.productName ?? 'Product'}
        </Text>
        <Text style={styles.rowMeta}>{formatPriceTypeLabel(item.priceType)}</Text>
        {item.price != null ? (
          <Text style={styles.rowPrice}>{formatCurrency(item.price)}</Text>
        ) : null}
        <Text style={styles.rowMeta}>
          {item.customerName ?? 'All Customers'}
        </Text>
        {item.validFrom || item.validUntil ? (
          <Text style={styles.rowMeta}>
            {item.validFrom ?? '—'} to {item.validUntil ?? '—'}
          </Text>
        ) : null}
        {createdLabel ? <Text style={styles.rowDate}>{createdLabel}</Text> : null}
      </View>
    </View>
  );
}

export default function ItemPricesScreen() {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const itemPricesQuery = useItemPrices();

  const filteredItems = useMemo(() => {
    const items = itemPricesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.productName?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.priceType?.toLowerCase().includes(q)
    );
  }, [itemPricesQuery.data, search]);

  const listPaddingBottom = insets.bottom + 16;

  if (itemPricesQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Item Prices" onBack={() => router.back()} />
        <View style={styles.searchWrap}>
          <SearchBarSkeleton />
        </View>
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <HistoryListSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Item Prices"
        onBack={() => router.back()}
        right={
          <HeaderAddItemButton onPress={() => router.push('/create-item-price' as Href)} />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar placeholder="Search prices..." value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemPriceRow item={item} />}
        contentContainerStyle={[
          styles.listContent,
          filteredItems.length === 0 && styles.listContentEmpty,
          { paddingBottom: listPaddingBottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={itemPricesQuery.isRefetching}
            onRefresh={() => void itemPricesQuery.refetch()}
            tintColor={Brand.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Item Prices"
            message={
              search.trim()
                ? 'No prices match your search'
                : 'Create a new price record for a product.'
            }
            actionLabel={search.trim() ? undefined : 'Add New Price'}
            onAction={search.trim() ? undefined : () => router.push('/create-item-price' as Href)}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  list: { paddingHorizontal: 16, gap: 10 },
  listContent: { paddingHorizontal: 16, gap: 10 },
  listContentEmpty: { flexGrow: 1 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.iosCard,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  rowPrice: { ...Typography.subhead, color: Brand.primary, fontWeight: '700' },
  rowMeta: { ...Typography.caption1, color: Colors.textSecondary },
  rowDate: { ...Typography.caption2, color: Colors.textTertiary },
});

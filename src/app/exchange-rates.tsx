import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useExchangeRates } from '@/hooks/usePricing';
import type { ExchangeRateListItem } from '@/services/pricingService';
import { format, parseISO } from 'date-fns';
import { router, type Href } from 'expo-router';
import { ArrowLeftRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ExchangeRateRow({ item }: { item: ExchangeRateListItem }) {
  const createdLabel = item.createdAt ? format(parseISO(item.createdAt), 'MMM d, yyyy') : null;
  const effectiveLabel = item.effectiveDate
    ? format(parseISO(item.effectiveDate), 'MM/dd/yyyy')
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.rowIconWrap}>
        <ArrowLeftRight size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{item.currencyCode ?? '—'}</Text>
        {item.rateToEtb != null ? (
          <Text style={styles.rowRate}>
            1 {item.currencyCode} = {item.rateToEtb.toFixed(4)} ETB
          </Text>
        ) : null}
        {effectiveLabel ? (
          <Text style={styles.rowMeta}>Effective {effectiveLabel}</Text>
        ) : null}
        {createdLabel ? <Text style={styles.rowDate}>{createdLabel}</Text> : null}
      </View>
    </View>
  );
}

export default function ExchangeRatesScreen() {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const exchangeRatesQuery = useExchangeRates();

  const filteredItems = useMemo(() => {
    const items = exchangeRatesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.currencyCode?.toLowerCase().includes(q));
  }, [exchangeRatesQuery.data, search]);

  const listPaddingBottom = insets.bottom + 16;

  if (exchangeRatesQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Exchange Rates" onBack={() => router.back()} />
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
        title="Exchange Rates"
        onBack={() => router.back()}
        right={
          <HeaderAddItemButton onPress={() => router.push('/create-exchange-rate' as Href)} />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar placeholder="Search currency..." value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExchangeRateRow item={item} />}
        contentContainerStyle={[
          styles.listContent,
          filteredItems.length === 0 && styles.listContentEmpty,
          { paddingBottom: listPaddingBottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={exchangeRatesQuery.isRefetching}
            onRefresh={() => void exchangeRatesQuery.refetch()}
            tintColor={Brand.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Exchange Rates"
            message={
              search.trim()
                ? 'No exchange rates match your search'
                : 'Add a currency rate against ETB.'
            }
            actionLabel={search.trim() ? undefined : 'Add Exchange Rate'}
            onAction={
              search.trim() ? undefined : () => router.push('/create-exchange-rate' as Href)
            }
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
  rowRate: { ...Typography.subhead, color: Brand.primary, fontWeight: '700' },
  rowMeta: { ...Typography.caption1, color: Colors.textSecondary },
  rowDate: { ...Typography.caption2, color: Colors.textTertiary },
});

import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useGiftCards } from '@/hooks/usePricing';
import type { GiftCardListItem } from '@/services/pricingService';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { router, type Href } from 'expo-router';
import { Gift } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function GiftCardRow({ card }: { card: GiftCardListItem }) {
  const createdLabel = card.createdAt ? format(parseISO(card.createdAt), 'MMM d, yyyy') : null;
  const balance = card.balance ?? card.initialBalance;

  return (
    <View style={styles.card}>
      <View style={styles.rowIconWrap}>
        <Gift size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {card.code}
        </Text>
        {balance != null ? (
          <Text style={styles.rowBalance}>{formatCurrency(balance)}</Text>
        ) : null}
        {card.expiryDate ? (
          <Text style={styles.rowMeta}>Expires {card.expiryDate}</Text>
        ) : null}
        {createdLabel ? <Text style={styles.rowDate}>{createdLabel}</Text> : null}
      </View>
    </View>
  );
}

export default function GiftCardsScreen() {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const giftCardsQuery = useGiftCards();

  const filteredCards = useMemo(() => {
    const items = giftCardsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((card) => card.code.toLowerCase().includes(q));
  }, [giftCardsQuery.data, search]);

  const listPaddingBottom = insets.bottom + 16;

  if (giftCardsQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Gift Cards" onBack={() => router.back()} />
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
        title="Gift Cards"
        onBack={() => router.back()}
        right={
          <HeaderAddItemButton
            label="Add"
            onPress={() => router.push('/create-gift-card' as Href)}
          />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search gift cards by code..."
        />
      </View>

      <FlatList
        data={filteredCards}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: listPaddingBottom, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={giftCardsQuery.isRefetching}
            onRefresh={() => giftCardsQuery.refetch()}
            tintColor={Brand.primary}
          />
        }
        renderItem={({ item }) => <GiftCardRow card={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No Gift Cards"
            message={
              search.trim()
                ? 'No gift cards match your search'
                : 'Issue your first gift card for customers'
            }
            actionLabel={search.trim() ? undefined : 'Add Gift Card'}
            onAction={search.trim() ? undefined : () => router.push('/create-gift-card' as Href)}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
    ...Shadow.iosCard,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  rowBalance: { ...Typography.headline, color: Brand.primary, fontWeight: '700' },
  rowMeta: { ...Typography.caption1, color: Colors.textSecondary },
  rowDate: { ...Typography.caption2, color: Colors.textTertiary, marginTop: 2 },
});

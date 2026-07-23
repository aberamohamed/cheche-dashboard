import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { usePromotions } from '@/hooks/usePricing';
import { formatPromotionTypeLabel, type PromotionListItem } from '@/services/pricingService';
import { format, parseISO } from 'date-fns';
import { router, type Href } from 'expo-router';
import { Boxes } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function PromotionRow({ promotion }: { promotion: PromotionListItem }) {
  const createdLabel = promotion.createdAt
    ? format(parseISO(promotion.createdAt), 'MMM d, yyyy')
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.rowIconWrap}>
        <Boxes size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {promotion.name}
          </Text>
          <View style={[styles.statusBadge, promotion.active === false && styles.statusBadgeInactive]}>
            <Text style={[styles.statusText, promotion.active === false && styles.statusTextInactive]}>
              {promotion.active === false ? 'Inactive' : 'Active'}
            </Text>
          </View>
        </View>
        <Text style={styles.rowMeta}>{formatPromotionTypeLabel(promotion.promotionType)}</Text>
        {promotion.application ? (
          <Text style={styles.rowMeta}>Application: {promotion.application}</Text>
        ) : null}
        {promotion.startDate || promotion.endDate ? (
          <Text style={styles.rowMeta}>
            {promotion.startDate ?? '—'} to {promotion.endDate ?? '—'}
          </Text>
        ) : null}
        {createdLabel ? <Text style={styles.rowDate}>{createdLabel}</Text> : null}
      </View>
    </View>
  );
}

export default function PromotionsScreen() {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const promotionsQuery = usePromotions();

  const filteredPromotions = useMemo(() => {
    const items = promotionsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (promotion) =>
        promotion.name.toLowerCase().includes(q) ||
        promotion.description?.toLowerCase().includes(q) ||
        promotion.promotionType?.toLowerCase().includes(q)
    );
  }, [promotionsQuery.data, search]);

  const listPaddingBottom = insets.bottom + 16;

  if (promotionsQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Promotions" onBack={() => router.back()} />
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
        title="Promotions"
        onBack={() => router.back()}
        right={
          <HeaderAddItemButton onPress={() => router.push('/create-promotion' as Href)} />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Search promotions..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredPromotions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PromotionRow promotion={item} />}
        contentContainerStyle={[
          styles.listContent,
          filteredPromotions.length === 0 && styles.listContentEmpty,
          { paddingBottom: listPaddingBottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={promotionsQuery.isRefetching}
            onRefresh={() => void promotionsQuery.refetch()}
            tintColor={Brand.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Promotions"
            message={
              search.trim()
                ? 'No promotions match your search'
                : 'Create your first promotion to offer discounts and deals at the POS.'
            }
            actionLabel={search.trim() ? undefined : 'Create Promotion'}
            onAction={search.trim() ? undefined : () => router.push('/create-promotion' as Href)}
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
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700', flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Brand.primaryMuted,
  },
  statusBadgeInactive: { backgroundColor: Colors.borderLight },
  statusText: { ...Typography.caption2, color: Brand.primary, fontWeight: '700' },
  statusTextInactive: { color: Colors.textSecondary },
  rowMeta: { ...Typography.caption1, color: Colors.textSecondary },
  rowDate: { ...Typography.caption2, color: Colors.textTertiary },
});

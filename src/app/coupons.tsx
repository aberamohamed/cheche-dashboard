import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCoupons } from '@/hooks/usePricing';
import { formatDiscountLabel, type CouponListItem } from '@/services/pricingService';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { router, type Href } from 'expo-router';
import { Tag } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CouponRow({ coupon }: { coupon: CouponListItem }) {
  const createdLabel = coupon.createdAt
    ? format(parseISO(coupon.createdAt), 'MMM d, yyyy')
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.rowIconWrap}>
        <Tag size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {coupon.code}
          </Text>
          <View style={[styles.statusBadge, coupon.active === false && styles.statusBadgeInactive]}>
            <Text style={[styles.statusText, coupon.active === false && styles.statusTextInactive]}>
              {coupon.active === false ? 'Inactive' : 'Active'}
            </Text>
          </View>
        </View>
        {coupon.name ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {coupon.name}
          </Text>
        ) : null}
        <Text style={styles.rowMeta}>{formatDiscountLabel(coupon)}</Text>
        {coupon.minimumPurchase ? (
          <Text style={styles.rowMeta}>Min purchase {formatCurrency(coupon.minimumPurchase)}</Text>
        ) : null}
        {createdLabel ? <Text style={styles.rowDate}>{createdLabel}</Text> : null}
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const couponsQuery = useCoupons();

  const filteredCoupons = useMemo(() => {
    const items = couponsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(q) ||
        coupon.name?.toLowerCase().includes(q)
    );
  }, [couponsQuery.data, search]);

  const listPaddingBottom = insets.bottom + 16;

  if (couponsQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Coupons" onBack={() => router.back()} />
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
        title="Coupons"
        onBack={() => router.back()}
        right={
          <HeaderAddItemButton
            label="Add"
            onPress={() => router.push('/create-coupon' as Href)}
          />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search coupons by code or name..."
        />
      </View>

      <FlatList
        data={filteredCoupons}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: listPaddingBottom, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={couponsQuery.isRefetching}
            onRefresh={() => couponsQuery.refetch()}
            tintColor={Brand.primary}
          />
        }
        renderItem={({ item }) => <CouponRow coupon={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No Coupons"
            message={
              search.trim()
                ? 'No coupons match your search'
                : 'Create your first discount coupon'
            }
            actionLabel={search.trim() ? undefined : 'Add Coupon'}
            onAction={search.trim() ? undefined : () => router.push('/create-coupon' as Href)}
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
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700', flex: 1 },
  statusBadge: {
    backgroundColor: Brand.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeInactive: { backgroundColor: Colors.borderLight },
  statusText: { ...Typography.caption2, color: Brand.primary, fontWeight: '600' },
  statusTextInactive: { color: Colors.textSecondary },
  rowSubtitle: { ...Typography.subhead, color: Colors.textSecondary },
  rowMeta: { ...Typography.caption1, color: Colors.textSecondary },
  rowDate: { ...Typography.caption2, color: Colors.textTertiary, marginTop: 2 },
});

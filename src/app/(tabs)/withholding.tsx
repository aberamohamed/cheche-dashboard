import { GuestRestrictedScreen } from '@/components/auth/GuestRestrictedScreen';
import { TransactionDetailModal } from '@/components/receipt/TransactionDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { OfflinePlaceholder } from '@/components/ui/OfflinePlaceholder';
import { WithholdingAnalyticsSection } from '@/components/withholding/WithholdingAnalyticsSection';
import { WithholdingFilterModal } from '@/components/withholding/WithholdingFilterModal';
import { WithholdingListRow } from '@/components/withholding/WithholdingListRow';
import { WithholdingScreenHeader } from '@/components/withholding/WithholdingScreenHeader';
import { WithholdingTypeSummary } from '@/components/withholding/WithholdingTypeSummary';
import { Brand, Colors, Typography } from '@/constants/theme';
import { useWithholdingReceipts } from '@/hooks/useWithholdingReceipts';
import { useTabScreenPaddingBottom } from '@/hooks/useTabScreenPaddingBottom';
import { useConnectivityStore } from '@/store/connectivityStore';
import type { WithholdingRecord } from '@/types';
import type { TransactionDetail } from '@/types/transactionDetail';
import { withholdingRecordToTransactionDetail } from '@/utils/transactionDetail';
import {
  computeWithholdingAnalytics,
  DEFAULT_WITHHOLDING_ANALYTICS_FILTERS,
  formatWithholdingAnalyticsPeriodLabel,
  getDefaultWithholdingAnalyticsFilters,
  isWithholdingAnalyticsFilterActive,
  type WithholdingAnalyticsFilters,
} from '@/utils/withholdingAnalytics';
import { computeWithholdingTypeCounts } from '@/utils/withholdingType';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ListFilter } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const PREVIEW_LIMIT = 5;

export default function WithholdingScreen() {
  const [search, setSearch] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetail | null>(null);
  const [analyticsFilters, setAnalyticsFilters] = useState<WithholdingAnalyticsFilters>(
    DEFAULT_WITHHOLDING_ANALYTICS_FILTERS
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const tabPaddingBottom = useTabScreenPaddingBottom();
  const isOnline = useConnectivityStore((s) => s.isOnline);

  const previewQuery = useWithholdingReceipts({ pageSize: PREVIEW_LIMIT });
  const countsQuery = useWithholdingReceipts({ pageSize: 200 });

  const countsSource = useMemo(
    () => countsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [countsQuery.data]
  );

  const previewItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length <= 1) {
      return countsSource.slice(0, PREVIEW_LIMIT);
    }

    return countsSource.filter((item) => {
      return (
        item.number.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        String(item.receiptCounter ?? '').toLowerCase().includes(q) ||
        String(item.irn ?? '').toLowerCase().includes(q) ||
        String(item.status ?? '').toLowerCase().includes(q)
      );
    });
  }, [countsSource, search]);

  const totalAvailable = previewQuery.data?.pages[0]?.total ?? countsSource.length;
  const isSearching = search.trim().length > 1;

  const typeCounts = useMemo(() => computeWithholdingTypeCounts(countsSource), [countsSource]);

  const analytics = useMemo(
    () => computeWithholdingAnalytics(countsSource, analyticsFilters),
    [analyticsFilters, countsSource]
  );

  const analyticsPeriodLabel = useMemo(
    () => formatWithholdingAnalyticsPeriodLabel(analyticsFilters),
    [analyticsFilters]
  );

  const filterActive = isWithholdingAnalyticsFilterActive(analyticsFilters);

  const onRefresh = () => {
    void previewQuery.refetch();
    void countsQuery.refetch();
  };

  const isLoading = previewQuery.isLoading || countsQuery.isLoading;
  const isRefetching = previewQuery.isRefetching || countsQuery.isRefetching;

  const openDetail = useCallback((item: WithholdingRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDetail(withholdingRecordToTransactionDetail(item));
  }, []);

  const header = <WithholdingScreenHeader />;

  if (!isOnline) {
    return (
      <GuestRestrictedScreen header={header}>
        <View style={styles.screen}>
          <OfflinePlaceholder message="Withholding receipts need an internet connection to load." />
        </View>
      </GuestRestrictedScreen>
    );
  }

  const searchRow = (
    <View style={styles.searchRow}>
      <View style={styles.searchField}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by receipt #, counter, or IRN"
        />
      </View>
      <Pressable
        style={[styles.filterButton, filterActive && styles.filterButtonActive]}
        onPress={() => setFilterOpen(true)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Filter withholding receipts"
      >
        <ListFilter size={20} color={Colors.white} strokeWidth={2.2} />
        {filterActive ? <View style={styles.filterDot} /> : null}
      </Pressable>
    </View>
  );

  const listHeader = (
    <View>
      <WithholdingTypeSummary counts={typeCounts} records={countsSource} />
      <WithholdingAnalyticsSection analytics={analytics} periodLabel={analyticsPeriodLabel} />
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Receipts</Text>
        <Pressable onPress={() => router.push('/withholding-all')} hitSlop={8}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <GuestRestrictedScreen header={header}>
        <View style={styles.screen}>
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchBarSkeleton />
              </View>
              <View style={styles.filterButtonSkeleton} />
            </View>
          </View>
          <View style={styles.list}>
            {[1, 2, 3, 4, 5].map((i) => (
              <HistoryListSkeleton key={i} />
            ))}
          </View>
        </View>
      </GuestRestrictedScreen>
    );
  }

  return (
    <GuestRestrictedScreen header={header} showModalOnFocus>
      <View style={styles.screen}>
        <View style={styles.searchWrap}>{searchRow}</View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: tabPaddingBottom, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        >
          {listHeader}

          {previewItems.length === 0 ? (
            <EmptyState
              title="No Withholding Records"
              message={
                isSearching
                  ? 'No withholding receipts match your search'
                  : 'Withholding receipts from the POS will appear here'
              }
            />
          ) : (
            previewItems.map((item, index) => {
              const previous = index > 0 ? previewItems[index - 1] : null;
              const showDate =
                !previous ||
                new Date(item.createdAt).toDateString() !==
                  new Date(previous.createdAt).toDateString();

              return (
                <WithholdingListRow
                  key={item.id}
                  item={item}
                  onPress={openDetail}
                  showDate={showDate}
                />
              );
            })
          )}

          {totalAvailable > PREVIEW_LIMIT && !isSearching ? (
            <Pressable style={styles.seeAllBtn} onPress={() => router.push('/withholding-all')}>
              <Text style={styles.seeAllBtnText}>See All Purchase Withholding Receipts</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <WithholdingFilterModal
          visible={filterOpen}
          filters={analyticsFilters}
          onClose={() => setFilterOpen(false)}
          onApply={(next) => {
            setAnalyticsFilters(next);
            setFilterOpen(false);
          }}
          onReset={() => {
            setAnalyticsFilters(getDefaultWithholdingAnalyticsFilters());
            setFilterOpen(false);
          }}
        />

        <TransactionDetailModal
          visible={!!selectedDetail}
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          actionMode="withholding"
        />
      </View>
    </GuestRestrictedScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchField: {
    flex: 1,
    minWidth: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  filterButtonSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  list: { flex: 1, backgroundColor: Colors.white },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  recentTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
  },
  seeAll: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '600',
  },
  seeAllBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.primary,
    alignItems: 'center',
  },
  seeAllBtnText: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
});

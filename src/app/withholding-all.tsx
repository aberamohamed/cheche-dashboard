import { TransactionDetailModal } from '@/components/receipt/TransactionDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterSheetModal } from '@/components/ui/FilterSheetModal';
import { ReportSummaryModal } from '@/components/ui/ReportSummaryModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { WithholdingListRow } from '@/components/withholding/WithholdingListRow';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { STATUS_OPTIONS } from '@/data/dashboardFilterOptions';
import { useWithholdingReceipts } from '@/hooks/useWithholdingReceipts';
import type { WithholdingRecord } from '@/types';
import type { TransactionDetail } from '@/types/transactionDetail';
import { formatCurrency } from '@/utils/format';
import { groupItemsByDate } from '@/utils/groupByDate';
import { withholdingRecordToTransactionDetail } from '@/utils/transactionDetail';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChartColumnBig } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DateGroupCard {
  id: string;
  items: WithholdingRecord[];
}

export default function WithholdingAllScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const listQuery = useWithholdingReceipts({
    search: debouncedSearch,
    status,
  });

  const summary = listQuery.data?.pages[0]?.summary;

  const summaryStats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Total', value: String(summary.totalCount) },
      { label: 'Completed', value: String(summary.completedCount), tone: 'success' as const },
      { label: 'Partial', value: String(summary.partialCount), tone: 'warning' as const },
      { label: 'Pending', value: String(summary.pendingCount), tone: 'warning' as const },
    ];
  }, [summary]);

  const summaryAmounts = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Paid Amount', value: formatCurrency(summary.paidAmount) },
      {
        label: 'Total Outstanding',
        value: formatCurrency(summary.totalOutstanding),
        accent: true,
      },
    ];
  }, [summary]);

  const records = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data]
  );

  const grouped = useMemo(() => groupItemsByDate(records), [records]);

  const listSections = useMemo(
    () =>
      grouped.map((group) => ({
        title: group.title,
        key: group.key,
        data: [{ id: group.key, items: group.data }] as DateGroupCard[],
      })),
    [grouped]
  );

  const filterActive = status !== 'all';

  const loadMore = useCallback(() => {
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      void listQuery.fetchNextPage();
    }
  }, [listQuery]);

  const openDetail = (item: WithholdingRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDetail(withholdingRecordToTransactionDetail(item));
  };

  const renderGroupCard = ({ item }: { item: DateGroupCard }) => (
    <View style={styles.groupCard}>
      {item.items.map((row, index) => (
        <View key={row.id}>
          {index > 0 ? <View style={styles.cardDivider} /> : null}
          <WithholdingListRow item={row} onPress={openDetail} showDate={false} />
        </View>
      ))}
    </View>
  );

  const listFooter = listQuery.isFetchingNextPage ? (
    <View style={styles.listFooter}>
      <ActivityIndicator color={Brand.primary} />
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Purchase Withholding"
        onBack={() => router.back()}
        right={
          summary ? (
            <Pressable
              style={styles.reportButton}
              onPress={() => setSummaryOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View report summary"
            >
              <ChartColumnBig size={20} color={Brand.primary} strokeWidth={2.2} />
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by receipt #, counter, or IRN..."
          onFilterPress={() => setFilterOpen(true)}
          filterActive={filterActive}
        />
      </View>

      {listQuery.isLoading ? (
        <View style={styles.loading}>
          <SearchBarSkeleton />
          {[1, 2, 3, 4, 5].map((i) => (
            <HistoryListSkeleton key={i} />
          ))}
        </View>
      ) : (
        <SectionList
          sections={listSections}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16, flexGrow: 1 }}
          stickySectionHeadersEnabled={false}
          refreshing={listQuery.isRefetching}
          onRefresh={() => void listQuery.refetch()}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Withholding Records"
              message={
                debouncedSearch.trim().length > 0 || filterActive
                  ? 'No withholding records match your search or filters'
                  : 'Withholding receipts will appear here'
              }
            />
          }
          ListFooterComponent={listFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          renderItem={renderGroupCard}
        />
      )}

      <FilterSheetModal
        visible={filterOpen}
        title="Withholding Filters"
        sections={[{ key: 'status', title: 'Status', options: STATUS_OPTIONS }]}
        values={{ status }}
        onClose={() => setFilterOpen(false)}
        onApply={(values) => {
          setStatus(values.status ?? 'all');
          setFilterOpen(false);
        }}
        onReset={() => {
          setStatus('all');
          setFilterOpen(false);
        }}
      />

      <TransactionDetailModal
        visible={!!selectedDetail}
        detail={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        actionMode="withholding"
      />

      <ReportSummaryModal
        visible={summaryOpen}
        title="Withholding Summary"
        stats={summaryStats}
        amounts={summaryAmounts}
        onClose={() => setSummaryOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  loading: { flex: 1, paddingHorizontal: 12, gap: 12 },
  list: { flex: 1, backgroundColor: Colors.white },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
  },
  groupCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 14,
  },
});

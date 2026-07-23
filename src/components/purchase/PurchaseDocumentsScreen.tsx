import { EmptyState } from '@/components/ui/EmptyState';
import { FilterSheetModal } from '@/components/ui/FilterSheetModal';
import { ReportSummaryModal } from '@/components/ui/ReportSummaryModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { STATUS_OPTIONS } from '@/data/dashboardFilterOptions';
import { usePurchaseDocuments } from '@/hooks/usePurchaseDocuments';
import { getPurchaseStrings } from '@/i18n/purchase';
import { useSettingsStore } from '@/store/settingsStore';
import type { PurchaseDocumentRecord, PurchaseDocumentType } from '@/types/purchase';
import { formatCurrency } from '@/utils/format';
import { groupItemsByDate } from '@/utils/groupByDate';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import {
  ChartColumnBig,
  CircleCheck,
  Clock,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
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
  items: PurchaseDocumentRecord[];
}

interface PurchaseDocumentsScreenProps {
  type: PurchaseDocumentType;
  title: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyMessage: string;
  icon: LucideIcon;
}

function formatLabel(value?: string, fallback = '—'): string {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(status?: string) {
  const normalized = (status ?? 'completed').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('void')) {
    return { bg: Colors.dangerBg, text: Colors.danger };
  }
  if (
    normalized.includes('draft') ||
    normalized.includes('pending') ||
    normalized.includes('unpaid')
  ) {
    return { bg: Colors.warningBg, text: Colors.warning };
  }
  return { bg: Colors.successBg, text: Colors.success };
}

function statusIcon(status?: string) {
  const normalized = (status ?? 'completed').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('void')) {
    return XCircle;
  }
  if (
    normalized.includes('draft') ||
    normalized.includes('pending') ||
    normalized.includes('unpaid')
  ) {
    return Clock;
  }
  return CircleCheck;
}

function StatusPill({ status, strings }: { status?: string; strings: ReturnType<typeof getPurchaseStrings> }) {
  const colors = statusStyle(status);
  const Icon = statusIcon(status);

  let displayStatus = formatLabel(status);
  if (!status || status.toLowerCase() === 'completed') {
    displayStatus = strings.completed;
  } else if (status.toLowerCase() === 'pending') {
    displayStatus = strings.pending;
  } else if (status.toLowerCase().includes('partial')) {
    displayStatus = strings.partial;
  }

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
      <Icon size={11} color={colors.text} strokeWidth={2.5} />
      <Text style={[styles.statusPillText, { color: colors.text }]}>
        {displayStatus}
      </Text>
    </View>
  );
}

function PurchaseRow({
  item,
  RowIcon,
  onPress,
  strings,
}: {
  item: PurchaseDocumentRecord;
  RowIcon: LucideIcon;
  onPress?: () => void;
  strings: ReturnType<typeof getPurchaseStrings>;
}) {
  const amount =
    item.currency && item.currency.toUpperCase() !== 'ETB'
      ? `${item.currency} ${item.total.toFixed(2)}`
      : formatCurrency(item.total);

  return (
    <Pressable style={styles.cardRow} onPress={onPress}>
      <Text style={styles.rowTitle} numberOfLines={1}>
        {item.number}
      </Text>
      {item.purchaseOrderNumber ? (
        <Text style={styles.rowPoNumber} numberOfLines={1}>
          {item.purchaseOrderNumber}
        </Text>
      ) : null}
      <View style={styles.rowMain}>
        <View style={styles.rowIconWrap}>
          <RowIcon size={18} color={Brand.primary} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {item.supplierName}
          </Text>
          <View style={styles.rowMetaRow}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.rowMetaText}>
              {format(parseISO(item.createdAt), 'h:mm a')}
            </Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{amount}</Text>
          <StatusPill status={item.status ?? item.eimsStatus} strings={strings} />
        </View>
      </View>
    </Pressable>
  );
}

export function PurchaseDocumentsScreen({
  type,
  title,
  searchPlaceholder,
  emptyTitle,
  emptyMessage,
  icon,
}: PurchaseDocumentsScreenProps) {
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const strings = getPurchaseStrings(language);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const listQuery = usePurchaseDocuments(type, { search: debouncedSearch, status });

  const records = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data]
  );

  const summary = listQuery.data?.pages[0]?.summary;

  const summaryStats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: strings.total, value: String(summary.totalCount) },
      { label: strings.completed, value: String(summary.completedCount), tone: 'success' as const },
      { label: strings.partial, value: String(summary.partialCount), tone: 'warning' as const },
      { label: strings.pending, value: String(summary.pendingCount), tone: 'warning' as const },
    ];
  }, [summary, strings]);

  const summaryAmounts = useMemo(() => {
    if (!summary) return [];
    return [
      { label: strings.paidAmount, value: formatCurrency(summary.paidAmount) },
      {
        label: strings.totalOutstanding,
        value: formatCurrency(summary.totalOutstanding),
        accent: true,
      },
    ];
  }, [summary, strings]);

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

  const renderGroupCard = ({ item }: { item: DateGroupCard }) => (
    <View style={styles.groupCard}>
      {item.items.map((record, index) => (
        <View key={record.id}>
          {index > 0 ? <View style={styles.cardDivider} /> : null}
          <PurchaseRow
            item={record}
            RowIcon={icon}
            onPress={() =>
              router.push(`/purchase-invoice-detail/${record.id}`)
            }
            strings={strings}
          />
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
        title={title}
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
          placeholder={searchPlaceholder}
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
              title={emptyTitle}
              message={
                debouncedSearch.trim().length > 0 || filterActive
                  ? strings.noSearchResults
                  : emptyMessage
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
        title={`${title} ${strings.filters}`}
        sections={[{ key: 'status', title: strings.total, options: STATUS_OPTIONS }]}
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

      <ReportSummaryModal
        visible={summaryOpen}
        title={`${title} ${strings.summary}`}
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
    marginBottom: 0,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  cardRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  rowPoNumber: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rowSubtitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '400',
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rowMetaText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
    minWidth: 96,
  },
  rowAmount: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
    ...Typography.caption2,
    fontWeight: '600',
  },
});

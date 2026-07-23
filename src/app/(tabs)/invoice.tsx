import { GuestRestrictedScreen } from '@/components/auth/GuestRestrictedScreen';
import {
  InvoicingSectionTabs,
  type InvoicingSection,
} from '@/components/invoicing/InvoicingSectionTabs';
import { InvoicingScreenHeader } from '@/components/invoicing/InvoicingScreenHeader';
import { TransactionDetailModal } from '@/components/receipt/TransactionDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterSheetModal } from '@/components/ui/FilterSheetModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { OfflinePlaceholder } from '@/components/ui/OfflinePlaceholder';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { getInvoiceStrings } from '@/i18n/invoice';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  EIRMS_STATUS_OPTIONS,
  HISTORY_DATE_OPTIONS,
  HISTORY_STATUS_OPTIONS,
} from '@/data/listFilterOptions';
import { useInvoices, useReceipts } from '@/hooks/useInvoices';
import { useTabScreenPaddingBottom } from '@/hooks/useTabScreenPaddingBottom';
import type { ReceiptRecord, Sale } from '@/types';
import type { TransactionDetail } from '@/types/transactionDetail';
import { formatCurrency } from '@/utils/format';
import { groupItemsByDate } from '@/utils/groupByDate';
import {
  DEFAULT_INVOICE_MODAL_FILTERS,
  filterSalesByInvoiceModal,
  filterSalesBySearch,
  isInvoiceFilterActive,
  type InvoiceModalFilters,
} from '@/utils/historyFilters';
import {
  isCreditNoteType,
  isDebitNoteType,
  isStandardInvoiceType,
} from '@/utils/invoiceType';
import { receiptRecordToTransactionDetail } from '@/utils/transactionDetail';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  CircleCheck,
  CircleMinus,
  CirclePlus,
  Clock,
  FileText,
  ListFilter,
  Receipt,
  XCircle,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

function formatLabel(value?: string, fallback = '—'): string {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(status?: string) {
  const normalized = (status ?? 'paid').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('void')) {
    return { bg: Colors.dangerBg, text: Colors.danger };
  }
  if (normalized.includes('draft') || normalized.includes('pending') || normalized.includes('unpaid')) {
    return { bg: Colors.warningBg, text: Colors.warning };
  }
  return { bg: Colors.successBg, text: Colors.success };
}

function statusIcon(status?: string) {
  const normalized = (status ?? 'paid').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('void')) {
    return XCircle;
  }
  if (normalized.includes('draft') || normalized.includes('pending') || normalized.includes('unpaid')) {
    return Clock;
  }
  return CircleCheck;
}

function StatusPill({ status }: { status?: string }) {
  const colors = statusStyle(status);
  const Icon = statusIcon(status);

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
      <Icon size={11} color={colors.text} strokeWidth={2.5} />
      <Text style={[styles.statusPillText, { color: colors.text }]}>
        {formatLabel(status, 'Paid')}
      </Text>
    </View>
  );
}

function TimeMeta({ time }: { time: string }) {
  return (
    <View style={styles.rowMetaRow}>
      <Clock size={12} color={Colors.textSecondary} />
      <Text style={styles.rowMetaText}>{time}</Text>
    </View>
  );
}

export default function InvoiceScreen() {
  const [section, setSection] = useState<InvoicingSection>('invoices');
  const [search, setSearch] = useState('');
  const [modalFilters, setModalFilters] = useState<InvoiceModalFilters>(DEFAULT_INVOICE_MODAL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetail | null>(null);
  const tabPaddingBottom = useTabScreenPaddingBottom();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const language = useSettingsStore((s) => s.language);
  const strings = getInvoiceStrings(language);

  const invoicesQuery = useInvoices(modalFilters.date);
  const receiptsQuery = useReceipts(modalFilters.date);

  const isInvoiceSection = section === 'invoices' || section === 'cre' || section === 'dbe';
  const activeQuery = isInvoiceSection ? invoicesQuery : receiptsQuery;

  const invoices = useMemo(
    () => invoicesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [invoicesQuery.data]
  );

  const receipts = useMemo(
    () => receiptsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [receiptsQuery.data]
  );

  const isLoading = activeQuery.isLoading;
  const isRefetching = activeQuery.isRefetching;
  const isFetchingNextPage = activeQuery.isFetchingNextPage;

  const sectionInvoices = useMemo(() => {
    if (section === 'cre') {
      return invoices.filter((item) => isCreditNoteType(item.invoiceType));
    }
    if (section === 'dbe') {
      return invoices.filter((item) => isDebitNoteType(item.invoiceType));
    }
    return invoices.filter((item) => isStandardInvoiceType(item.invoiceType));
  }, [invoices, section]);

  const filteredInvoices = useMemo(() => {
    const byModal = filterSalesByInvoiceModal(sectionInvoices, modalFilters);
    return filterSalesBySearch(byModal, search);
  }, [sectionInvoices, modalFilters, search]);

  const filteredReceipts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receipts.filter((item) => {
      if (q.length <= 1) return true;
      return (
        item.number.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        String(item.status ?? '').toLowerCase().includes(q)
      );
    });
  }, [receipts, search]);

  const groupedInvoices = useMemo(
    () => groupItemsByDate(filteredInvoices),
    [filteredInvoices]
  );

  const groupedReceipts = useMemo(
    () => groupItemsByDate(filteredReceipts),
    [filteredReceipts]
  );

  const filterActive = isInvoiceFilterActive(modalFilters);

  const searchPlaceholder = useMemo(() => {
    if (section === 'receipts') return `${strings.searchPlaceholder}`.replace('invoice', 'receipt');
    if (section === 'cre') return `${strings.searchPlaceholder}`.replace('invoice', 'credit note');
    if (section === 'dbe') return `${strings.searchPlaceholder}`.replace('invoice', 'debit note');
    return strings.searchPlaceholder;
  }, [section, strings]);

  const onRefresh = () => {
    activeQuery.refetch();
  };

  const loadMore = useCallback(() => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  }, [activeQuery]);

  const listFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.listFooter}>
        <ActivityIndicator color={Brand.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  const stickyHeader = (
    <View style={styles.stickyHeader}>
      <InvoicingSectionTabs active={section} onChange={setSection} />
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
            />
          </View>
          <Pressable
            style={[styles.filterButton, filterActive && styles.filterButtonActive]}
            onPress={() => setFilterOpen(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Filter invoices"
          >
            <ListFilter size={20} color={Colors.white} strokeWidth={2.2} />
            {filterActive ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <InvoicingScreenHeader />
        <View style={styles.stickyHeader}>
          <InvoicingSectionTabs active={section} onChange={setSection} />
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchBarSkeleton />
              </View>
              <View style={styles.filterButtonSkeleton} />
            </View>
          </View>
        </View>
        <View style={styles.list}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <HistoryListSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  const openDetail = (detail: TransactionDetail) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDetail(detail);
  };

  const listSections = useMemo(() => {
    const groups = isInvoiceSection ? groupedInvoices : groupedReceipts;

    return groups.map((group) => ({
      title: group.title,
      key: group.key,
      data: group.data as (Sale | ReceiptRecord)[],
    }));
  }, [isInvoiceSection, groupedInvoices, groupedReceipts]);

  const openInvoiceDetail = (item: Sale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/invoice-detail', params: { id: item.id } });
  };

  const invoiceRowIcon = (invoiceType?: string) => {
    if (isCreditNoteType(invoiceType)) return CircleMinus;
    if (isDebitNoteType(invoiceType)) return CirclePlus;
    return FileText;
  };

  const renderInvoiceRow = (item: Sale) => {
    const RowIcon = invoiceRowIcon(item.invoiceType);

    return (
    <Pressable style={styles.cardRow} onPress={() => openInvoiceDetail(item)}>
      <View style={styles.rowIconWrap}>
        <RowIcon size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.invoiceNumber}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {item.customerName ?? 'Guest'}
        </Text>
        <TimeMeta time={format(parseISO(item.createdAt), 'h:mm a')} />
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatCurrency(item.total)}</Text>
        <StatusPill status={item.status} />
      </View>
    </Pressable>
    );
  };

  const renderReceiptRow = (item: ReceiptRecord) => (
    <Pressable
      style={styles.cardRow}
      onPress={() => openDetail(receiptRecordToTransactionDetail(item))}
    >
      <View style={styles.rowIconWrap}>
        <Receipt size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.number}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {item.clientName}
        </Text>
        <TimeMeta time={format(parseISO(item.createdAt), 'h:mm a')} />
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
        <StatusPill status={item.status} />
      </View>
    </Pressable>
  );

  const renderListItem = ({ item }: { item: Sale | ReceiptRecord }) => (
    <View>
      {isInvoiceSection
        ? renderInvoiceRow(item as Sale)
        : renderReceiptRow(item as ReceiptRecord)}
      <View style={styles.rowDivider} />
    </View>
  );

  const renderDateSectionHeader = ({ section: dateSection }: { section: { title: string } }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{dateSection.title}</Text>
    </View>
  );

  const emptyState = useMemo(() => {
    if (section === 'cre') {
      return {
        title: 'No Credit Notes',
        message:
          search.length > 1 || filterActive
            ? 'No credit notes match your search or filters'
            : 'Credit notes (CRE) will appear here',
      };
    }
    if (section === 'dbe') {
      return {
        title: 'No Debit Notes',
        message:
          search.length > 1 || filterActive
            ? 'No debit notes match your search or filters'
            : 'Debit notes (DBE) will appear here',
      };
    }
    if (section === 'invoices') {
      return {
        title: 'No Invoices',
        message:
          search.length > 1 || filterActive
            ? 'No invoices match your search or filters'
            : 'Invoices from the POS will appear here',
      };
    }
    return {
      title: 'No Receipts',
      message:
        search.length > 1
          ? 'No receipts match your search'
          : 'Receipts from the POS will appear here',
    };
  }, [section, search, filterActive]);

  return (
    <GuestRestrictedScreen
      header={<InvoicingScreenHeader />}
      showModalOnFocus
    >
      <View style={styles.screen}>
        {!isOnline ? (
          <OfflinePlaceholder message="Invoices need an internet connection to load." />
        ) : (
        <>
        {stickyHeader}

        <SectionList<
          Sale | ReceiptRecord,
          { title: string; key: string; data: (Sale | ReceiptRecord)[] }
        >
          key={section}
          sections={listSections}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: tabPaddingBottom, flexGrow: 1 }}
          stickySectionHeadersEnabled={false}
          refreshing={isRefetching}
          onRefresh={onRefresh}
          renderSectionHeader={renderDateSectionHeader}
          ListEmptyComponent={
            <EmptyState title={emptyState.title} message={emptyState.message} />
          }
          ListFooterComponent={listFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          renderItem={renderListItem}
        />

        <TransactionDetailModal
          visible={!!selectedDetail && section === 'receipts'}
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          actionMode="receipt"
        />

        <FilterSheetModal
          visible={filterOpen}
          title={strings.filters}
          sections={[
            {
              key: 'date',
              title: strings.dateRange,
              options: HISTORY_DATE_OPTIONS.map((opt) => ({
                ...opt,
                label:
                  opt.id === 'today'
                    ? strings.today
                    : opt.id === 'yesterday'
                      ? strings.yesterday
                      : opt.id === 'week'
                        ? strings.thisWeek
                        : opt.id === 'month'
                          ? strings.thisMonth
                          : opt.id === 'all'
                            ? strings.allStatus
                            : opt.label,
              })),
            },
            {
              key: 'status',
              title: strings.status,
              options: HISTORY_STATUS_OPTIONS.map((opt) => ({
                ...opt,
                label:
                  opt.id === 'all'
                    ? strings.allStatus
                    : opt.id === 'paid'
                      ? strings.completed
                      : opt.id === 'pending'
                        ? strings.pending
                        : opt.id === 'cancelled'
                          ? strings.cancelled
                          : opt.label,
              })),
            },
            {
              key: 'eirmsStatus',
              title: strings.eimsStatus,
              options: EIRMS_STATUS_OPTIONS.map((opt) => ({
                ...opt,
                label:
                  opt.id === 'all'
                    ? strings.allEimsStatus
                    : opt.id === 'success'
                      ? strings.success
                      : opt.id === 'pending'
                        ? strings.pending
                        : opt.id === 'failed'
                          ? strings.failed
                          : opt.label,
              })),
            },
          ]}
          values={{
            date: modalFilters.date,
            status: modalFilters.status,
            eirmsStatus: modalFilters.eirmsStatus,
          }}
          onClose={() => setFilterOpen(false)}
          onApply={(values) => {
            setModalFilters({
              date: values.date as InvoiceModalFilters['date'],
              status: values.status,
              eirmsStatus: values.eirmsStatus,
            });
            setFilterOpen(false);
          }}
          onReset={() => {
            setModalFilters(DEFAULT_INVOICE_MODAL_FILTERS);
            setFilterOpen(false);
          }}
        />
        </>
        )}
      </View>
    </GuestRestrictedScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  stickyHeader: {
    backgroundColor: Colors.white,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 0,
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
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 72,
    backgroundColor: Colors.white,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 16,
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

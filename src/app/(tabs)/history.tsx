import { GuestRestrictedScreen } from '@/components/auth/GuestRestrictedScreen';
import { TransactionDetailModal } from '@/components/receipt/TransactionDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterSheetModal } from '@/components/ui/FilterSheetModal';
import { HeaderFilterButton } from '@/components/ui/HeaderFilterButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import {
  HISTORY_DATE_OPTIONS,
  HISTORY_PAYMENT_OPTIONS,
  HISTORY_STATUS_OPTIONS,
} from '@/data/listFilterOptions';
import { useTabScreenPaddingBottom } from '@/hooks/useTabScreenPaddingBottom';
import { useSales } from '@/hooks/useSales';
import type { Sale } from '@/types';
import {
  DEFAULT_HISTORY_MODAL_FILTERS,
  filterSalesByModal,
  filterSalesBySearch,
  isHistoryFilterActive,
  type HistoryModalFilters,
} from '@/utils/historyFilters';
import { saleToTransactionDetail } from '@/utils/transactionDetail';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Receipt } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
  const [search, setSearch] = useState('');
  const [modalFilters, setModalFilters] = useState<HistoryModalFilters>(DEFAULT_HISTORY_MODAL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);
  const tabPaddingBottom = useTabScreenPaddingBottom();

  const { data: sales = [], isLoading } = useSales(modalFilters.date);

  const filteredSales = useMemo(() => {
    const byModal = filterSalesByModal(sales, modalFilters);
    return filterSalesBySearch(byModal, search);
  }, [sales, modalFilters, search]);

  const filterActive = isHistoryFilterActive(modalFilters);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <TabScreenHeader title="Sales History" />
        <View style={styles.searchWrap}>
          <SearchBarSkeleton />
        </View>
        <View style={styles.list}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <HistoryListSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <GuestRestrictedScreen
      header={
        <TabScreenHeader
          title="Sales History"
          right={<HeaderFilterButton active={filterActive} light onPress={() => setFilterOpen(true)} />}
        />
      }
      showModalOnFocus
    >
    <View style={styles.screen}>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by invoice or product"
        />
      </View>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: tabPaddingBottom }}
        ListEmptyComponent={
          <EmptyState
            title="No Transactions"
            message={
              search.length > 1 || filterActive
                ? 'No sales match your search or filters'
                : 'Sales will appear here once you complete a sale'
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setSelected(item)}>
            <View style={styles.iconWrap}>
              <Receipt size={20} color={Brand.primary} />
            </View>
            <View style={styles.center}>
              <Text style={styles.invoice} numberOfLines={1} ellipsizeMode="tail">
                {item.invoiceNumber}
              </Text>
              <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
                {format(parseISO(item.createdAt), 'MMM d, yyyy · h:mm a')}
              </Text>
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                {item.items.length} items · {item.paymentMethod}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.total}>{formatCurrency(item.total)}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Completed</Text>
              </View>
            </View>
            <ChevronRight size={16} color={Colors.textTertiary} />
          </Pressable>
        )}
      />

      <TransactionDetailModal
        visible={!!selected}
        detail={selected ? saleToTransactionDetail(selected) : null}
        onClose={() => setSelected(null)}
      />

      <FilterSheetModal
        visible={filterOpen}
        title="Sales Filters"
        sections={[
          { key: 'date', title: 'Date Range', options: HISTORY_DATE_OPTIONS },
          { key: 'status', title: 'Status', options: HISTORY_STATUS_OPTIONS },
          { key: 'payment', title: 'Payment Type', options: HISTORY_PAYMENT_OPTIONS },
        ]}
        values={{
          date: modalFilters.date,
          status: modalFilters.status,
          payment: modalFilters.payment,
        }}
        onClose={() => setFilterOpen(false)}
        onApply={(values) => {
          setModalFilters({
            date: values.date as HistoryModalFilters['date'],
            status: values.status,
            payment: values.payment,
          });
          setFilterOpen(false);
        }}
        onReset={() => {
          setModalFilters(DEFAULT_HISTORY_MODAL_FILTERS);
          setFilterOpen(false);
        }}
      />
    </View>
    </GuestRestrictedScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: Colors.white },
  list: { flex: 1, backgroundColor: Colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  center: { flex: 1, minWidth: 0, gap: 2 },
  invoice: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  date: { ...Typography.caption1, color: Colors.textSecondary },
  meta: { ...Typography.caption2, color: Colors.textTertiary, textTransform: 'capitalize' },
  right: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  total: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#B8E6C8',
  },
  badgeText: { ...Typography.caption2, color: Colors.success, fontWeight: '600' },
});

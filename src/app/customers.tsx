import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { HistoryListSkeleton, SearchBarSkeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCustomers } from '@/hooks/useInvoices';
import type { CustomerRecord } from '@/types';
import { groupItemsByDate } from '@/utils/groupByDate';
import { format, parseISO } from 'date-fns';
import { router, type Href } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
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
  items: CustomerRecord[];
}

function CustomerRow({ customer }: { customer: CustomerRecord }) {
  return (
    <View style={styles.cardRow}>
      <View style={styles.rowIconWrap}>
        <Users size={18} color={Brand.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitleDark} numberOfLines={1}>
          {customer.name}
        </Text>
        {customer.email ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {customer.email}
          </Text>
        ) : null}
        {customer.phone ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {customer.phone}
          </Text>
        ) : null}
        <Text style={styles.rowMetaText}>
          {format(parseISO(customer.createdAt), 'MMM d, yyyy · h:mm a')}
        </Text>
      </View>
    </View>
  );
}

export default function CustomersScreen() {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const customersQuery = useCustomers('all');

  const customers = useMemo(
    () => customersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [customersQuery.data]
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((item) => {
      if (q.length <= 1) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q)
      );
    });
  }, [customers, search]);

  const groupedCustomers = useMemo(
    () => groupItemsByDate(filteredCustomers),
    [filteredCustomers]
  );

  const listSections = useMemo(
    () =>
      groupedCustomers.map((group) => ({
        title: group.title,
        key: group.key,
        data: [{ id: group.key, items: group.data }] as DateGroupCard[],
      })),
    [groupedCustomers]
  );

  const loadMore = useCallback(() => {
    if (customersQuery.hasNextPage && !customersQuery.isFetchingNextPage) {
      customersQuery.fetchNextPage();
    }
  }, [customersQuery]);

  const listPaddingBottom = insets.bottom + 16;

  if (customersQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Customers" onBack={() => router.back()} />
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
    <View style={styles.screen}>
      <ScreenHeader
        title="Customers"
        onBack={() => router.back()}
        right={
          <HeaderAddItemButton
            label="Add Customer"
            onPress={() => router.push('/add-customer' as Href)}
          />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search customers by name, email, or phone..."
        />
      </View>

      <SectionList
        sections={listSections}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: listPaddingBottom, flexGrow: 1 }}
        stickySectionHeadersEnabled={false}
        refreshing={customersQuery.isRefetching}
        onRefresh={() => customersQuery.refetch()}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Customers"
            message={
              search.length > 1
                ? 'No customers match your search'
                : 'Customers from the POS will appear here'
            }
          />
        }
        ListFooterComponent={
          customersQuery.isFetchingNextPage ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={Brand.primary} />
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            {item.items.map((row, index) => (
              <View key={row.id}>
                {index > 0 ? <View style={styles.cardDivider} /> : null}
                <CustomerRow customer={row} />
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  list: { flex: 1, backgroundColor: Colors.background },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
  },
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 72,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 14,
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
  rowTitleDark: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  rowSubtitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '400',
  },
  rowMetaText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { SearchBar } from '@/components/ui/SearchBar';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { useCustomers } from '@/hooks/useInvoices';
import type { CustomerRecord } from '@/types';
import { format, parseISO } from 'date-fns';
import { Users, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface CustomerPickerModalProps {
  visible: boolean;
  selectedId?: string | null;
  onClose: () => void;
  onSelect: (customer: CustomerRecord) => void;
  onAddNew: () => void;
}

function CustomerRow({
  customer,
  selected,
  onPress,
}: {
  customer: CustomerRecord;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.cardRow, selected && styles.cardRowSelected]}
      onPress={onPress}
    >
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
    </Pressable>
  );
}

export function CustomerPickerModal({
  visible,
  selectedId,
  onClose,
  onSelect,
  onAddNew,
}: CustomerPickerModalProps) {
  const [search, setSearch] = useState('');
  const customersQuery = useCustomers('all');

  const customers = useMemo(
    () => customersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [customersQuery.data]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length <= 1) return customers;
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    });
  }, [customers, search]);

  const loadMore = () => {
    if (customersQuery.hasNextPage && !customersQuery.isFetchingNextPage) {
      customersQuery.fetchNextPage();
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Customers">
      <Pressable style={styles.addNewBtn} onPress={onAddNew}>
        <UserPlus size={18} color={Brand.primary} />
        <Text style={styles.addNewText}>Add New</Text>
      </Pressable>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search customers by name, email, or phone..."
        />
      </View>

      {customersQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              title="No Customers"
              message={
                search.trim().length > 1
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
          renderItem={({ item }) => (
            <CustomerRow
              customer={item}
              selected={selectedId === item.id}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.cardDivider} />}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  addNewText: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  searchWrap: {
    marginBottom: 12,
  },
  loading: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 480,
  },
  listContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  listEmpty: {
    flexGrow: 1,
    minHeight: 200,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 72,
    backgroundColor: Colors.white,
  },
  cardRowSelected: {
    backgroundColor: Brand.primaryMuted,
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

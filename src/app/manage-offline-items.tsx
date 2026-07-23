import { EmptyState } from '@/components/ui/EmptyState';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useOfflineProductsStore } from '@/store/offlineProductsStore';
import { useTaxesStore } from '@/store/taxesStore';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatProductVatLabel } from '@/utils/productTaxLabel';
import { router } from 'expo-router';
import { Check, ChevronDown, ListFilter, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type OfflineFilter = 'all' | 'added' | 'notAdded';

const FILTER_OPTIONS: { id: OfflineFilter; label: string }[] = [
  { id: 'all', label: 'All items' },
  { id: 'added', label: 'Added' },
  { id: 'notAdded', label: 'Not added' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ManageOfflineItemsScreen() {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const { data: products = [], isLoading } = useProducts();
  const offlineProducts = useOfflineProductsStore((s) => s.products);
  const offlineIds = useOfflineProductsStore((s) => s.ids);
  const addOffline = useOfflineProductsStore((s) => s.add);
  const removeOffline = useOfflineProductsStore((s) => s.remove);
  const refresh = useOfflineProductsStore((s) => s.refresh);
  const backfillTaxes = useOfflineProductsStore((s) => s.backfillTaxes);
  const taxes = useTaxesStore((s) => s.taxes);
  const fetchTaxes = useTaxesStore((s) => s.fetchTaxes);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OfflineFilter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16 });
  const anchorRef = useRef<View>(null);

  useEffect(() => {
    void refresh();
    void fetchTaxes().then((loaded) => {
      if (loaded.length > 0) void backfillTaxes(loaded);
    });
  }, [refresh, fetchTaxes, backfillTaxes]);

  const offlineIdSet = useMemo(() => new Set(offlineIds), [offlineIds]);

  const filtered = useMemo(() => {
    // Offline: only the curated offline catalog is available (and shown).
    let list = isOnline ? products : offlineProducts;

    if (isOnline) {
      if (filter === 'added') list = list.filter((p) => offlineIdSet.has(p.id));
      else if (filter === 'notAdded') list = list.filter((p) => !offlineIdSet.has(p.id));
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
    }
    return list;
  }, [isOnline, products, offlineProducts, filter, offlineIdSet, search]);

  const displayProduct = (product: Product): Product => {
    if (product.taxes?.length) return product;
    const offline = offlineProducts.find((p) => p.id === product.id);
    return offline?.taxes?.length ? offline : product;
  };

  const toggle = (product: Product, isOfflineItem: boolean) => {
    if (isOfflineItem) {
      void removeOffline(product.id);
    } else {
      void addOffline(product, taxes);
    }
  };

  const openMenu = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ top: y + height + 6, right: Math.max(12, SCREEN_WIDTH - (x + width)) });
      setMenuOpen(true);
    });
  };

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.id === filter)?.label ?? 'All items';

  const headerRight = isOnline ? (
    <Pressable ref={anchorRef} style={styles.filterBtn} onPress={openMenu} hitSlop={6}>
      <ListFilter size={16} color={Brand.primary} />
      <Text style={styles.filterBtnText} numberOfLines={1}>
        {activeFilterLabel}
      </Text>
      <ChevronDown size={14} color={Brand.primary} />
    </Pressable>
  ) : undefined;

  const renderItem = ({ item }: { item: Product }) => {
    const isOfflineItem = offlineIdSet.has(item.id);
    const shown = displayProduct(item);
    const vatLabel = formatProductVatLabel(shown);
    return (
      <View style={styles.row}>
        <ProductThumbnail uri={item.image} size={44} />
        <View style={styles.rowText}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatCurrency(item.sellingPrice)}
            {item.category ? ` · ${item.category}` : ''}
            {vatLabel ? ` ${vatLabel}` : ''}
          </Text>
        </View>
        <Pressable
          style={[styles.actionBtn, isOfflineItem ? styles.actionBtnRemove : styles.actionBtnAdd]}
          onPress={() => toggle(item, isOfflineItem)}
          hitSlop={6}
        >
          {isOfflineItem ? (
            <>
              <Check size={14} color={Brand.primary} />
              <Text style={[styles.actionText, styles.actionTextRemove]}>Remove</Text>
            </>
          ) : (
            <>
              <Plus size={14} color={Colors.white} />
              <Text style={styles.actionText}>Add</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Offline Items"
        subtitle={
          isOnline
            ? `${offlineIds.length} saved for offline`
            : `Offline · showing ${offlineProducts.length} saved item${offlineProducts.length === 1 ? '' : 's'}`
        }
        onBack={() => router.back()}
        right={headerRight}
      />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search items or services" />
      </View>

      {isLoading && isOnline ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.hint}>
              {isOnline
                ? "Items you add here are stored on the device and shown on the Sell tab when you're offline."
                : "You're offline — showing your saved offline items. Reconnect to add or remove items."}
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'added' || !isOnline ? 'No offline items yet' : 'No items found'}
              message={
                search
                  ? 'No items match your search'
                  : !isOnline
                    ? 'Add items while online to sell them offline'
                    : filter === 'added'
                      ? 'Add items so they appear on Sell when offline'
                      : 'No items available'
              }
            />
          }
        />
      )}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: menuPos.top, right: menuPos.right }]}>
            {FILTER_OPTIONS.map((option, index) => {
              const active = option.id === filter;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.menuItem, index < FILTER_OPTIONS.length - 1 && styles.menuItemBorder]}
                  onPress={() => {
                    setFilter(option.id);
                    setMenuOpen(false);
                  }}
                >
                  <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                    {option.label}
                  </Text>
                  {active ? <Check size={16} color={Brand.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  hint: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 4,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: Brand.primaryMuted,
    maxWidth: 150,
  },
  filterBtnText: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Brand.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowText: { flex: 1 },
  name: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  meta: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    minWidth: 84,
    justifyContent: 'center',
  },
  actionBtnAdd: { backgroundColor: Brand.primary },
  actionBtnRemove: { backgroundColor: Brand.primaryMuted, borderWidth: 1, borderColor: '#FFE1EF' },
  actionText: { ...Typography.footnote, fontWeight: '700', color: Colors.white },
  actionTextRemove: { color: Brand.primary },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  menu: {
    position: 'absolute',
    minWidth: 170,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  menuItemTextActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
});

import { GuestRestrictedScreen } from '@/components/auth/GuestRestrictedScreen';
import { HeaderAddItemButton } from '@/components/ui/HeaderAddItemButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBarSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { deleteCategory } from '@/services/productService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import {
  OTHER_CATEGORY_TAB_ID,
  productMatchesCategoryTab,
} from '@/utils/productFilters';
import { withLoading } from '@/utils/withLoading';
import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CategoryRow {
  id: string;
  name: string;
  code?: string;
  taxCode?: string;
  count?: number;
  isOther: boolean;
}

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts('all');

  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = insets.bottom + 16;

  const isLoading = categoriesLoading || productsLoading;

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((cat) => {
      if (seen.has(cat.id)) return false;
      seen.add(cat.id);
      return true;
    });
  }, [categories]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const key = product.categoryId?.trim() ? product.categoryId : OTHER_CATEGORY_TAB_ID;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return uniqueCategories;
    return uniqueCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        (cat.code ?? '').toLowerCase().includes(query)
    );
  }, [uniqueCategories, search]);

  const showOtherCategory = useMemo(() => {
    const query = search.trim().toLowerCase();
    const hasOther = products.some((p) => productMatchesCategoryTab(p, OTHER_CATEGORY_TAB_ID));
    if (!hasOther) return false;
    if (!query) return true;
    return 'other'.includes(query);
  }, [products, search]);

  const rows = useMemo<CategoryRow[]>(() => {
    const items: CategoryRow[] = filteredCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      code: cat.code,
      taxCode: cat.governmentTaxCode,
      count: categoryCounts.get(cat.id),
      isOther: false,
    }));

    if (showOtherCategory) {
      items.push({
        id: OTHER_CATEGORY_TAB_ID,
        name: 'Other',
        isOther: true,
        count: categoryCounts.get(OTHER_CATEGORY_TAB_ID),
      });
    }

    return items;
  }, [filteredCategories, categoryCounts, showOtherCategory]);

  const openCategory = (row: CategoryRow) =>
    router.push(
      `/category-items?categoryId=${encodeURIComponent(row.id)}&categoryName=${encodeURIComponent(row.name)}` as Href
    );

  const addItemToCategory = (row: CategoryRow) =>
    router.push(`/add-item?categoryId=${encodeURIComponent(row.id)}` as Href);

  const editCategory = (row: CategoryRow) =>
    router.push(`/add-category?categoryId=${encodeURIComponent(row.id)}` as Href);

  const confirmDelete = (row: CategoryRow) => {
    appAlert(
      'Delete Category',
      `Are you sure you want to delete "${row.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await withLoading(async () => {
                await deleteCategory(row.id);
                await queryClient.invalidateQueries({ queryKey: ['categories'] });
              }, 'Deleting category...');
              appAlert('Deleted', 'Category deleted successfully');
            } catch (error) {
              appAlert('Error', getApiErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const headerRight = (
    <HeaderAddItemButton label="Add Category" onPress={() => router.push('/add-category')} />
  );

  const totalCount = uniqueCategories.length + (showOtherCategory ? 1 : 0);

  if (isLoading) {
    return (
      <GuestRestrictedScreen
        header={<ScreenHeader title="Categories" onBack={() => router.back()} right={headerRight} />}
        showModalOnFocus
      >
        <View style={styles.screen}>
          <View style={styles.searchWrap}>
            <SearchBarSkeleton />
          </View>
          <View style={styles.countSkeletonWrap}>
            <Skeleton width={96} height={12} borderRadius={6} />
          </View>
          <View style={styles.skeletonRows}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={56} borderRadius={12} />
            ))}
          </View>
        </View>
      </GuestRestrictedScreen>
    );
  }

  return (
    <GuestRestrictedScreen
      header={<ScreenHeader title="Categories" onBack={() => router.back()} right={headerRight} />}
      showModalOnFocus
    >
      <View style={styles.screen}>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search categories..." />
        </View>

        <Text style={styles.countLabel}>
          {totalCount} Categor{totalCount === 1 ? 'y' : 'ies'}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colName]}>Name</Text>
          <Text style={[styles.th, styles.colCode]}>Code</Text>
          <Text style={[styles.th, styles.colTax]}>VAT</Text>
          <Text style={[styles.th, styles.colActions]}>Actions</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
          showsVerticalScrollIndicator={false}
        >
          {rows.length === 0 ? (
            <Text style={styles.empty}>No categories found.</Text>
          ) : (
            rows.map((row) => (
              <View key={row.id} style={styles.row}>
                <Pressable style={[styles.colName, styles.nameCell]} onPress={() => openCategory(row)}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {row.name}
                  </Text>
                  {row.count != null && row.count > 0 ? (
                    <Text style={styles.nameSub}>
                      {row.count} item{row.count === 1 ? '' : 's'}
                    </Text>
                  ) : null}
                </Pressable>

                <Text style={[styles.cellText, styles.colCode]} numberOfLines={1}>
                  {row.code || '—'}
                </Text>

                <View style={styles.colTax}>
                  {row.taxCode ? (
                    <View style={styles.taxBadge}>
                      <Text style={styles.taxBadgeText}>{row.taxCode}</Text>
                    </View>
                  ) : (
                    <Text style={styles.cellText}>—</Text>
                  )}
                </View>

                <View style={[styles.colActions, styles.actions]}>
                  {row.isOther ? (
                    <Pressable
                      onPress={() => openCategory(row)}
                      hitSlop={6}
                      style={styles.actionBtn}
                      accessibilityLabel={`View ${row.name}`}
                    >
                      <ChevronRight size={17} color={Colors.textSecondary} />
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        onPress={() => addItemToCategory(row)}
                        hitSlop={6}
                        style={[styles.actionBtn, styles.actionAdd]}
                        accessibilityLabel={`Add item to ${row.name}`}
                      >
                        <Plus size={16} color={Brand.primary} strokeWidth={2.6} />
                      </Pressable>
                      <Pressable
                        onPress={() => editCategory(row)}
                        hitSlop={6}
                        style={styles.actionBtn}
                        accessibilityLabel={`Edit ${row.name}`}
                      >
                        <Pencil size={15} color={Colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(row)}
                        hitSlop={6}
                        style={[styles.actionBtn, styles.actionDelete]}
                        accessibilityLabel={`Delete ${row.name}`}
                      >
                        <Trash2 size={15} color={Colors.danger} />
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </GuestRestrictedScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  countSkeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  skeletonRows: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  countLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  th: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  colName: { flex: 2.2 },
  colCode: { flex: 1 },
  colTax: { flex: 1 },
  colActions: { width: 112, textAlign: 'right' },
  scroll: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  nameCell: {
    paddingRight: 8,
  },
  nameText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  nameSub: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cellText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  taxBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Brand.primaryMuted,
  },
  taxBadgeText: {
    ...Typography.caption2,
    color: Brand.primary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  actionAdd: {
    backgroundColor: Brand.primaryMuted,
  },
  actionDelete: {
    backgroundColor: Colors.dangerBg,
  },
  empty: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },
});

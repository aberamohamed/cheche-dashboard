import { ItemCategoryCard } from '@/components/products/ItemCategoryCard';
import { FilterModal } from '@/components/ui/FilterModal';
import { CategoryGridSkeleton } from '@/components/ui/Skeleton';
import { Colors, Typography } from '@/constants/theme';
import {
  getCategoryCardStyle,
  OTHER_CATEGORY_CARD_STYLE,
} from '@/data/categoryCardStyles';
import { useCategories, useProducts } from '@/hooks/useProducts';
import {
  OTHER_CATEGORY_TAB_ID,
  productMatchesCategoryTab,
} from '@/utils/productFilters';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const NUM_COLUMNS = 4;

interface StockReportCategoryFilterModalProps {
  visible: boolean;
  selectedIds: string[];
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
}

export function StockReportCategoryFilterModal({
  visible,
  selectedIds,
  onClose,
  onApply,
}: StockReportCategoryFilterModalProps) {
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts('all');

  const isLoading = categoriesLoading || productsLoading;

  useEffect(() => {
    if (visible) setDraft(selectedIds);
  }, [visible, selectedIds]);

  const toggleCategory = (id: string) => {
    setDraft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

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

  const showOtherCategory = useMemo(
    () => products.some((product) => productMatchesCategoryTab(product, OTHER_CATEGORY_TAB_ID)),
    [products],
  );

  const gridItems = useMemo(() => {
    const items: {
      key: string;
      label: string;
      style: ReturnType<typeof getCategoryCardStyle>;
      count?: number;
    }[] = [];

    uniqueCategories.forEach((category, index) => {
      items.push({
        key: category.id,
        label: category.name,
        style: getCategoryCardStyle(index),
        count: categoryCounts.get(category.id),
      });
    });

    if (showOtherCategory) {
      items.push({
        key: OTHER_CATEGORY_TAB_ID,
        label: 'Other',
        style: OTHER_CATEGORY_CARD_STYLE,
        count: categoryCounts.get(OTHER_CATEGORY_TAB_ID),
      });
    }

    return items;
  }, [uniqueCategories, categoryCounts, showOtherCategory]);

  const rows = useMemo(() => {
    const result: (typeof gridItems)[] = [];
    for (let i = 0; i < gridItems.length; i += NUM_COLUMNS) {
      result.push(gridItems.slice(i, i + NUM_COLUMNS));
    }
    return result;
  }, [gridItems]);

  return (
    <FilterModal
      visible={visible}
      title="Filter Categories"
      onClose={onClose}
      onReset={() => setDraft([])}
      onApply={() => {
        onApply(draft);
        onClose();
      }}
      maxBodyHeight={460}
    >
      {isLoading ? (
        <CategoryGridSkeleton rows={4} columns={NUM_COLUMNS} />
      ) : (
        <>
          <Text style={styles.countLabel}>
            {gridItems.length} Categor{gridItems.length === 1 ? 'y' : 'ies'}
          </Text>

          <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map((item) => (
                  <View key={item.key} style={styles.cell}>
                    <ItemCategoryCard
                      label={item.label}
                      style={item.style}
                      count={item.count}
                      selected={draft.includes(item.key)}
                      onPress={() => toggleCategory(item.key)}
                    />
                  </View>
                ))}
                {row.length < NUM_COLUMNS
                  ? Array.from({ length: NUM_COLUMNS - row.length }).map((_, i) => (
                      <View key={`spacer-${rowIndex}-${i}`} style={styles.cell} />
                    ))
                  : null}
              </View>
            ))}
          </View>
        </>
      )}
    </FilterModal>
  );
}

const styles = StyleSheet.create({
  countLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  grid: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cell: {
    width: `${100 / NUM_COLUMNS}%`,
  },
});

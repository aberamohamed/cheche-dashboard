import { HomeCategoryList, type HomeServiceAction } from '@/components/home/HomeCategoryList';
import { getHomeCategoryIcon } from '@/data/homeCategoryIcons';
import { useCategories } from '@/hooks/useProducts';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { CategoryGridSkeleton } from '@/components/ui/Skeleton';

const NUM_COLUMNS = 4;
const PREVIEW_LIMIT = 8;

export function HomeCategoryPreview() {
  const { data: categories = [], isLoading } = useCategories();

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((cat) => {
      if (seen.has(cat.id)) return false;
      seen.add(cat.id);
      return true;
    });
  }, [categories]);

  const categoryActions = useMemo<HomeServiceAction[]>(
    () =>
      uniqueCategories.slice(0, PREVIEW_LIMIT).map((cat, index) => ({
        key: cat.id,
        label: cat.name,
        icon: getHomeCategoryIcon(index),
        onPress: () =>
          router.push(
            `/category-items?categoryId=${encodeURIComponent(cat.id)}&categoryName=${encodeURIComponent(cat.name)}` as Href
          ),
      })),
    [uniqueCategories]
  );

  if (isLoading) {
    return <CategoryGridSkeleton rows={2} columns={NUM_COLUMNS} />;
  }

  return <HomeCategoryList actions={categoryActions} numColumns={NUM_COLUMNS} />;
}

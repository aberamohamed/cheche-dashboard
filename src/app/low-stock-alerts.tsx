import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/theme';
import { useLowStockProducts } from '@/hooks/useProducts';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

export default function LowStockAlertsScreen() {
  const { data: products = [], isLoading, refetch, isRefetching } = useLowStockProducts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Low Stock Alerts" onBack={() => router.back()} />

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="All stocked up"
              message="No products are below their minimum stock level"
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              showStock
              onPress={() => setSelectedId(item.id)}
            />
          )}
        />
      )}

      <ProductDetailModal
        productId={selectedId}
        fallback={selected}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  list: { flex: 1, backgroundColor: Colors.white },
  listContent: { paddingBottom: 32 },
});

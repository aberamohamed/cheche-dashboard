import { Brand, Colors, Typography } from '@/constants/theme';
import type { ProductStockTab } from '@/utils/productFilters';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Clock, TriangleAlert, XCircle } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const TABS: { id: ProductStockTab; label: string }[] = [
  { id: 'in_stock', label: 'In Stock' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'out_of_stock', label: 'Out of Stock' },
  { id: 'expiring', label: 'Expiring' },
];

const TAB_COLORS: Record<ProductStockTab, string> = {
  in_stock: '#10B981',
  low_stock: '#F59E0B',
  out_of_stock: '#EF4444',
  expiring: Brand.primary,
};

function TabIcon({ tab, active }: { tab: ProductStockTab; active: boolean }) {
  const color = active ? TAB_COLORS[tab] : Colors.textSecondary;
  const size = 16;
  switch (tab) {
    case 'in_stock':
      return <CheckCircle2 size={size} color={color} />;
    case 'low_stock':
      return <TriangleAlert size={size} color={color} />;
    case 'out_of_stock':
      return <XCircle size={size} color={color} />;
    case 'expiring':
      return <Clock size={size} color={color} />;
  }
}

interface StockStatusTabsProps {
  activeId: ProductStockTab;
  onChange: (id: ProductStockTab) => void;
  fullWidth?: boolean;
}

function TabButton({
  tab,
  active,
  onChange,
  style,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onChange: (id: ProductStockTab) => void;
  style?: object;
}) {
  return (
    <Pressable
      style={[styles.tab, style]}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(tab.id);
      }}
    >
      <View style={styles.tabInner}>
        <TabIcon tab={tab.id} active={active} />
        <Text
          style={[
            styles.tabText,
            active && styles.tabTextActive,
            active && { color: TAB_COLORS[tab.id] },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </View>
      <View style={[styles.indicator, active && { backgroundColor: TAB_COLORS[tab.id] }]} />
    </Pressable>
  );
}

export function StockStatusTabs({ activeId, onChange, fullWidth }: StockStatusTabsProps) {
  if (fullWidth) {
    return (
      <View style={styles.wrap}>
        <View style={styles.fullWidthRow}>
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={tab.id === activeId}
              onChange={onChange}
              style={styles.fullWidthTab}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            active={tab.id === activeId}
            onChange={onChange}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  fullWidthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  fullWidthTab: {
    flex: 1,
    paddingHorizontal: 4,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  indicator: {
    width: '100%',
    minWidth: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
});

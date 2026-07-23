import { Brand, Colors, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type CategoryTab = {
  id: string;
  label: string;
};

interface ProductCategoryTabsProps {
  tabs: CategoryTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ProductCategoryTabs({ tabs, activeId, onChange }: ProductCategoryTabsProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <Pressable
              key={tab.id}
              style={styles.tab}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(tab.id);
              }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
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
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  tabText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
  indicator: {
    width: '100%',
    minWidth: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Brand.primary,
  },
});

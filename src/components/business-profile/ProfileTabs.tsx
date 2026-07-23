import { Brand, Colors, Typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProfileTabId = 'organization' | 'branches' | 'users';

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'organization', label: 'Organization' },
  { id: 'branches', label: 'Branches' },
  { id: 'users', label: 'Users' },
];

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
}

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              style={styles.tab}
              onPress={() => onChange(tab.id)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>
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
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  tabText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  indicator: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Brand.primary,
  },
});

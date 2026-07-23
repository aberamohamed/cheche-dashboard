import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useSellTranslation } from '@/hooks/useSellTranslation';
import { Grid3x3, ScanLine, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SellMode = 'keypad' | 'items' | 'scan';

const MODE_IDS: SellMode[] = ['keypad', 'items', 'scan'];

const MODE_ICONS = {
  keypad: Grid3x3,
  items: ShoppingBag,
  scan: ScanLine,
} as const;

interface SellModeTabsProps {
  active: SellMode;
  onChange: (mode: SellMode) => void;
}

export function SellModeTabs({ active, onChange }: SellModeTabsProps) {
  const t = useSellTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {MODE_IDS.map((id) => {
          const label = t.modes[id];
          const Icon = MODE_ICONS[id];
          const selected = id === active;
          const color = selected ? Brand.primary : Colors.textSecondary;
          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              style={[styles.tab, selected && styles.tabActive]}
            >
              <Icon size={18} color={color} strokeWidth={2.25} />
              <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Colors.white,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: '#ECECF0',
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  label: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  labelActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
});

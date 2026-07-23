import { Brand, Colors, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { CircleMinus, CirclePlus, FileText, Receipt } from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type InvoicingSection = 'invoices' | 'cre' | 'dbe' | 'receipts';

const SECTIONS: {
  id: InvoicingSection;
  label: string;
  icon: typeof FileText;
}[] = [
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'cre', label: 'CRE', icon: CircleMinus },
  { id: 'dbe', label: 'DBE', icon: CirclePlus },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
];

interface InvoicingSectionTabsProps {
  active: InvoicingSection;
  onChange: (section: InvoicingSection) => void;
}

export function InvoicingSectionTabs({ active, onChange }: InvoicingSectionTabsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {SECTIONS.map((section, index) => {
          const selected = section.id === active;
          const Icon = section.icon;
          const iconColor = selected ? Brand.primary : Colors.textSecondary;

          return (
            <Fragment key={section.id}>
              {index > 0 ? <View style={styles.tabDivider} /> : null}
              <Pressable
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(section.id);
                }}
              >
                <View style={styles.tabInner}>
                  <Icon size={15} color={iconColor} />
                  <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>
                    {section.label}
                  </Text>
                </View>
              </Pressable>
            </Fragment>
          );
        })}
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingTop: 4,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
  },
  tabSelected: {
    borderBottomWidth: 2,
    borderBottomColor: Brand.primary,
    marginBottom: -2,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 10,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: -1,
  },
});

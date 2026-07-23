import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { formatNumber } from '@/utils/format';
import { StyleSheet, Text, View } from 'react-native';

interface InvoicingSummaryCardProps {
  label: string;
  value: number;
  sublabel?: string;
  tag?: string;
  icon: React.ReactNode;
}

export function InvoicingSummaryCard({
  label,
  value,
  sublabel = 'Total Count',
  tag = 'ALL',
  icon,
}: InvoicingSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatNumber(value)}</Text>
      <Text style={styles.sublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(227, 0, 116, 0.28)',
    padding: 16,
    ...Shadow.iosCard,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Brand.primaryMuted,
  },
  tagText: {
    ...Typography.caption2,
    color: Brand.primary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  label: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: 2,
  },
  sublabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
});

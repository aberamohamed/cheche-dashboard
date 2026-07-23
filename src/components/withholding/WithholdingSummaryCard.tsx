import { StatCardSparkline } from '@/components/ui/StatCardSparkline';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { formatNumber } from '@/utils/format';
import { StyleSheet, Text, View } from 'react-native';

interface WithholdingSummaryCardProps {
  label: string;
  value: number;
  sublabel?: string;
  tag?: string;
  icon: React.ReactNode;
  trendData?: number[];
}

export function WithholdingSummaryCard({
  label,
  value,
  sublabel = 'Count',
  tag = 'ALL',
  icon,
  trendData = [],
}: WithholdingSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
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
      <StatCardSparkline variant="pink" data={trendData} height={24} />
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
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  cardBody: {
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: Brand.primary,
  },
  sublabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});

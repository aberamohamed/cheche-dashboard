import { StatCardSparkline } from '@/components/ui/StatCardSparkline';
import type { StatCardVariant } from '@/components/ui/StatCard';
import { Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { formatAmount } from '@/utils/format';
import { Platform, StyleSheet, Text, View } from 'react-native';

const VARIANT_STYLES: Record<
  StatCardVariant,
  { background: string; iconBg: string; border: string }
> = {
  pink: {
    background: Platform.OS === 'android' ? '#FFF5FA' : 'rgba(227, 0, 116, 0.08)',
    iconBg: 'rgba(227, 0, 116, 0.14)',
    border: 'rgba(227, 0, 116, 0.22)',
  },
  blue: {
    background: Platform.OS === 'android' ? '#F3F8FF' : 'rgba(0, 122, 255, 0.08)',
    iconBg: 'rgba(0, 122, 255, 0.14)',
    border: 'rgba(0, 122, 255, 0.22)',
  },
  green: {
    background: Platform.OS === 'android' ? '#F3FBF5' : 'rgba(52, 199, 89, 0.08)',
    iconBg: 'rgba(52, 199, 89, 0.14)',
    border: 'rgba(52, 199, 89, 0.22)',
  },
  purple: {
    background: Platform.OS === 'android' ? '#FAF5FF' : 'rgba(175, 82, 222, 0.08)',
    iconBg: 'rgba(175, 82, 222, 0.14)',
    border: 'rgba(175, 82, 222, 0.22)',
  },
};

interface WithholdingAnalyticsMetricCardProps {
  label: string;
  value: number;
  variant: StatCardVariant;
  icon: React.ReactNode;
  trendData?: number[];
  subtitle?: string;
}

export function WithholdingAnalyticsMetricCard({
  label,
  value,
  variant,
  icon,
  trendData = [],
  subtitle,
}: WithholdingAnalyticsMetricCardProps) {
  const colors = VARIANT_STYLES[variant];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.background, borderColor: colors.border },
        Platform.OS === 'android' ? styles.cardAndroid : styles.cardIos,
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>{icon}</View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={styles.value}>{formatAmount(value)}</Text>
      </View>
      <StatCardSparkline variant={variant} data={trendData} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardIos: {
    ...Shadow.iosCard,
  },
  cardAndroid: {
    borderWidth: 1,
    elevation: 0,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.caption2,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 4,
  },
});

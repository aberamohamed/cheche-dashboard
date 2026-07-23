import { HomeGlassCard } from '@/components/home/HomeGlassCard';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { StatCardSparkline } from '@/components/ui/StatCardSparkline';
import { formatAmount } from '@/utils/format';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export type StatCardVariant = 'pink' | 'blue' | 'green' | 'purple';

const VARIANTS: Record<
  StatCardVariant,
  { border: string; iconBg: string }
> = {
  pink: { border: 'rgba(227, 0, 116, 0.22)', iconBg: Brand.primaryMuted },
  blue: { border: 'rgba(0, 122, 255, 0.22)', iconBg: '#E8F2FF' },
  green: { border: 'rgba(52, 199, 89, 0.22)', iconBg: Colors.successBg },
  purple: { border: 'rgba(175, 82, 222, 0.22)', iconBg: '#F5EBFF' },
};

const GLASS_VARIANTS: Record<
  StatCardVariant,
  { iconBg: string }
> = {
  pink: { iconBg: 'rgba(227, 0, 116, 0.22)' },
  blue: { iconBg: 'rgba(0, 122, 255, 0.22)' },
  green: { iconBg: 'rgba(52, 199, 89, 0.22)' },
  purple: { iconBg: 'rgba(175, 82, 222, 0.22)' },
};

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  variant?: StatCardVariant;
  trendData?: number[];
  glass?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  variant = 'pink',
  trendData = [],
  glass = false,
}: StatCardProps) {
  const colors = glass ? GLASS_VARIANTS[variant] : VARIANTS[variant];
  const positive = (change ?? 0) >= 0;

  const body = (
    <>
      <View style={styles.cardBody}>
        <View style={styles.top}>
          <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>{icon}</View>
          {change !== undefined && (
            <View style={[styles.badge, positive ? styles.badgeUp : styles.badgeDown]}>
              {positive ? (
                <TrendingUp size={11} color={Colors.success} />
              ) : (
                <TrendingDown size={11} color={Colors.danger} />
              )}
              <Text style={[styles.change, positive ? styles.changeUp : styles.changeDown]}>
                {positive ? '+' : '-'}
                {Math.abs(change).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.value, glass && styles.valueGlass]}>{value}</Text>
        <Text style={[styles.label, glass && styles.labelGlass]}>{label}</Text>
      </View>
      <StatCardSparkline variant={variant} data={trendData} glass={glass} />
    </>
  );

  if (glass) {
    return (
      <HomeGlassCard style={[styles.card, styles.glassCard]}>
        {body}
      </HomeGlassCard>
    );
  }

  return (
    <View style={[styles.card, styles.solidCard, { borderColor: colors.border }]}>
      {body}
    </View>
  );
}

export function StatCardCurrency({
  label,
  value,
  change,
  icon,
  variant = 'pink',
  trendData,
  glass,
}: Omit<StatCardProps, 'value'> & { value: number }) {
  return (
    <StatCard
      label={label}
      value={formatAmount(value)}
      change={change}
      icon={icon}
      variant={variant}
      trendData={trendData}
      glass={glass}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  solidCard: {
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadow.iosCard,
  },
  glassCard: {
    backgroundColor: 'transparent',
  },
  cardBody: {
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeUp: { backgroundColor: Colors.successBg },
  badgeDown: { backgroundColor: Colors.dangerBg },
  change: { ...Typography.caption2, fontWeight: '600' },
  changeUp: { color: Colors.success },
  changeDown: { color: Colors.danger },
  value: { ...Typography.title3, color: Colors.text, fontWeight: '600', marginBottom: 2 },
  valueGlass: { color: Colors.white },
  label: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 10 },
  labelGlass: { color: 'rgba(255, 255, 255, 0.82)' },
});

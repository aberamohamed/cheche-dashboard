import { WithholdingAnalyticsMetricCard } from '@/components/withholding/WithholdingAnalyticsMetricCard';
import { Brand, Colors, Typography } from '@/constants/theme';
import type { WithholdingAnalytics } from '@/utils/withholdingAnalytics';
import { Calendar, CalendarDays, CalendarRange, Sun } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface WithholdingAnalyticsSectionProps {
  analytics: WithholdingAnalytics;
  periodLabel: string;
}

const METRICS = [
  { key: 'today' as const, label: 'Today', variant: 'pink' as const, icon: Sun, iconColor: Brand.primary },
  { key: 'week' as const, label: 'This Week', variant: 'blue' as const, icon: Calendar, iconColor: '#007AFF' },
  {
    key: 'month' as const,
    label: 'This Month',
    variant: 'green' as const,
    icon: CalendarDays,
    iconColor: Colors.success,
  },
  {
    key: 'custom' as const,
    label: 'Custom Range',
    variant: 'purple' as const,
    icon: CalendarRange,
    iconColor: '#AF52DE',
  },
];

export function WithholdingAnalyticsSection({
  analytics,
  periodLabel,
}: WithholdingAnalyticsSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.periodBadge}>
          <Calendar size={14} color={Colors.textSecondary} />
          <Text style={styles.periodText} numberOfLines={1}>
            {periodLabel}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          const data = analytics[metric.key];
          const subtitle = metric.key === 'custom' ? analytics.customLabel : undefined;

          return (
            <WithholdingAnalyticsMetricCard
              key={metric.key}
              label={metric.label}
              value={data.amount}
              variant={metric.variant}
              trendData={data.trend}
              subtitle={subtitle}
              icon={<Icon size={16} color={metric.iconColor} strokeWidth={2.2} />}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
    flexShrink: 0,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '58%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  periodText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

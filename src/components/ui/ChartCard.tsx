import { HomeGlassCard } from '@/components/home/HomeGlassCard';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { ChevronDown } from 'lucide-react-native';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { ChartDataPoint } from '@/types';

interface ChartCardProps {
  title: string;
  data: ChartDataPoint[];
  subtitle?: string;
  period?: string;
  onPeriodPress?: () => void;
  glass?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export function ChartCard({
  title,
  data,
  subtitle,
  period,
  onPeriodPress,
  glass = false,
}: ChartCardProps) {
  const values = data.map((d) => d.value);

  const lineColor = glass ? Colors.white : Brand.primary;
  const chartBackground = glass ? 'transparent' : Colors.white;
  const labelColor = glass ? 'rgba(255, 255, 255, 0.72)' : Colors.textSecondary;
  const gridColor = glass ? 'rgba(255, 255, 255, 0.16)' : Colors.borderLight;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [{ data: values.length ? values : [0], color: () => lineColor, strokeWidth: 2 }],
  };

  const body = (
    <>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, glass && styles.titleGlass]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, glass && styles.subtitleGlass]}>{subtitle}</Text>
          ) : null}
        </View>
        {period ? (
          <Pressable
            style={[styles.periodBtn, glass && styles.periodBtnGlass]}
            onPress={onPeriodPress}
          >
            <Text style={[styles.periodText, glass && styles.periodTextGlass]}>{period}</Text>
            <ChevronDown size={14} color={glass ? Colors.white : Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <LineChart
        data={chartData}
        width={screenWidth - 72}
        height={200}
        chartConfig={{
          backgroundColor: chartBackground,
          backgroundGradientFrom: chartBackground,
          backgroundGradientTo: chartBackground,
          backgroundGradientFromOpacity: 0,
          backgroundGradientToOpacity: 0,
          fillShadowGradientFrom: lineColor,
          fillShadowGradientTo: glass ? 'rgba(255, 255, 255, 0.02)' : 'rgba(227, 0, 116, 0.04)',
          fillShadowGradientFromOpacity: glass ? 0.28 : 1,
          fillShadowGradientToOpacity: glass ? 0.02 : 0.04,
          decimalPlaces: 0,
          color: () => lineColor,
          labelColor: () => labelColor,
          propsForDots: {
            r: '4',
            strokeWidth: 2,
            stroke: lineColor,
            fill: lineColor,
          },
          propsForBackgroundLines: { stroke: gridColor, strokeDasharray: '' },
        }}
        bezier
        style={[styles.chart, glass && styles.chartGlass]}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        fromZero
        segments={4}
        formatYLabel={(v) => {
          const n = Number(v);
          if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
          if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
          return String(Math.round(n));
        }}
      />
    </>
  );

  if (glass) {
    return (
      <HomeGlassCard contentStyle={styles.cardPadding}>
        {body}
      </HomeGlassCard>
    );
  }

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 176, 32, 0.28)',
    padding: 16,
    ...Shadow.iosCard,
  },
  cardPadding: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: { ...Typography.headline, color: Colors.text, fontWeight: '600' },
  titleGlass: { color: Colors.white },
  subtitle: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  subtitleGlass: { color: 'rgba(255, 255, 255, 0.72)' },
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  periodBtnGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodText: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '500' },
  periodTextGlass: { color: Colors.white },
  chart: { marginLeft: -16, borderRadius: Radius.md },
  chartGlass: { backgroundColor: 'transparent' },
});

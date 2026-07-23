import { Colors, Radius, Shadow } from '@/constants/theme';
import type { StatCardVariant } from '@/components/ui/StatCard';
import { useTabScreenPaddingBottom } from '@/hooks/useTabScreenPaddingBottom';
import { valuesToAreaChartPaths } from '@/utils/sparklinePath';
import { useEffect, useId, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

const SKELETON_CHART_GRAY = '#D1D1D6';
const SKELETON_CHART_GRAY_GLASS = 'rgba(255, 255, 255, 0.28)';

const STAT_SPARKLINE_PLACEHOLDERS: Record<StatCardVariant, number[]> = {
  pink: [10, 16, 12, 20, 17, 26, 22],
  blue: [8, 14, 18, 15, 22, 17, 24],
  green: [6, 10, 14, 18, 16, 22, 28],
  purple: [12, 10, 16, 14, 20, 18, 24],
};

const MAIN_CHART_PLACEHOLDER = [4, 8, 12, 18, 42, 24, 14, 10, 8, 12, 16, 20];
const STAT_VARIANTS: StatCardVariant[] = ['pink', 'blue', 'green', 'purple'];

function useSkeletonPulse() {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return opacity;
}

function SkeletonAreaChart({
  values,
  height,
  glass = false,
  showGrid = false,
  gridSegments = 4,
}: {
  values: number[];
  height: number;
  glass?: boolean;
  showGrid?: boolean;
  gridSegments?: number;
}) {
  const opacity = useSkeletonPulse();
  const gradientId = useId().replace(/:/g, '');
  const { linePath, areaPath, width, height: viewHeight } = valuesToAreaChartPaths(values, {
    height,
    paddingTop: showGrid ? 8 : 4,
    paddingBottom: showGrid ? 12 : 2,
  });
  const strokeColor = glass ? SKELETON_CHART_GRAY_GLASS : SKELETON_CHART_GRAY;
  const gridColor = glass ? 'rgba(255, 255, 255, 0.12)' : Colors.borderLight;
  const fillTopOpacity = glass ? 0.2 : 0.45;
  const fillBottomOpacity = glass ? 0.02 : 0.06;

  return (
    <Animated.View style={{ opacity }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${viewHeight}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity={fillTopOpacity} />
            <Stop offset="1" stopColor={strokeColor} stopOpacity={fillBottomOpacity} />
          </LinearGradient>
        </Defs>

        {showGrid
          ? Array.from({ length: gridSegments + 1 }, (_, index) => {
              const y = (viewHeight / gridSegments) * index;
              return (
                <Line
                  key={index}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={1}
                />
              );
            })
          : null}

        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path
          d={linePath}
          stroke={strokeColor}
          strokeWidth={showGrid ? 2 : 1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  glass?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Radius.sm,
  style,
  glass = false,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        glass ? styles.baseGlass : styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductListSkeleton() {
  return (
    <View style={styles.listRow}>
      <Skeleton width={44} height={44} borderRadius={Radius.sm} />
      <View style={styles.listContent}>
        <Skeleton width="65%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.listRight}>
        <Skeleton width={52} height={16} />
        <Skeleton width={72} height={20} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SearchBarSkeleton() {
  return (
    <View style={styles.searchBar}>
      <Skeleton width={18} height={18} borderRadius={9} />
      <Skeleton width="100%" height={16} style={{ flex: 1 }} />
    </View>
  );
}

export function ServiceChipSkeleton() {
  return (
    <View style={styles.serviceChip}>
      <Skeleton width={72} height={12} />
      <Skeleton width={56} height={14} style={{ marginTop: 6 }} />
    </View>
  );
}

export function ServiceChipsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.serviceChipsRow}>
      {Array.from({ length: count }, (_, index) => (
        <ServiceChipSkeleton key={index} />
      ))}
    </View>
  );
}

export function HistoryListSkeleton() {
  return (
    <View style={styles.historyRow}>
      <Skeleton width={40} height={40} borderRadius={8} />
      <View style={styles.listContent}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="45%" height={10} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.listRight}>
        <Skeleton width={56} height={16} />
        <Skeleton width={72} height={22} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={16} height={16} borderRadius={8} />
    </View>
  );
}

function StatCardSkeleton({ glass = false, variant = 'pink' }: { glass?: boolean; variant?: StatCardVariant }) {
  return (
    <View style={[styles.statCard, glass && styles.statCardGlass]}>
      <View style={styles.statCardBody}>
        <View style={styles.statTop}>
          <Skeleton glass={glass} width={34} height={34} borderRadius={10} />
          <Skeleton glass={glass} width={54} height={22} borderRadius={8} />
        </View>
        <Skeleton glass={glass} width="72%" height={22} style={{ marginTop: 2 }} />
        <Skeleton glass={glass} width="48%" height={12} style={{ marginTop: 6, marginBottom: 10 }} />
      </View>
      <SkeletonAreaChart
        values={STAT_SPARKLINE_PLACEHOLDERS[variant]}
        height={36}
        glass={glass}
      />
    </View>
  );
}

function ChartCardSkeleton({ glass = false }: { glass?: boolean }) {
  return (
    <View style={[styles.chartCard, glass && styles.chartCardGlass]}>
      <View style={styles.chartHeader}>
        <View style={styles.chartHeaderText}>
          <Skeleton glass={glass} width={110} height={17} />
          <Skeleton glass={glass} width={140} height={12} style={{ marginTop: 6 }} />
        </View>
        <Skeleton glass={glass} width={92} height={28} borderRadius={8} />
      </View>
      <View style={styles.chartPlot}>
        <SkeletonAreaChart
          values={MAIN_CHART_PLACEHOLDER}
          height={168}
          glass={glass}
          showGrid
        />
        <View style={styles.chartLabels}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <Skeleton glass={glass} key={day} width={24} height={10} borderRadius={4} />
          ))}
        </View>
      </View>
    </View>
  );
}

function TopProductsSectionSkeleton({ glass = false }: { glass?: boolean }) {
  if (glass) {
    return (
      <View>
        <View style={styles.topProductsHeaderGlass}>
          <Skeleton glass width="58%" height={17} />
          <Skeleton glass width={64} height={17} borderRadius={8} />
        </View>
        <View style={styles.topProductsBodyGlass}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.topProductRowGlass}>
              <Skeleton glass width={48} height={48} borderRadius={Radius.sm} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton glass width="70%" height={14} />
                <Skeleton glass width="45%" height={12} />
              </View>
              <Skeleton glass width={72} height={14} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Skeleton glass={glass} width="58%" height={17} />
        <Skeleton glass={glass} width={64} height={17} borderRadius={8} />
      </View>
      <View style={styles.sectionBody}>
        <View style={styles.sectionEmpty}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={120} height={14} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

function DateRangeCardSkeleton({ glass = false }: { glass?: boolean }) {
  return (
    <View style={[styles.dateRangeCard, glass && styles.dateRangeCardGlass]}>
      <Skeleton glass={glass} width={18} height={18} borderRadius={6} />
      <Skeleton glass={glass} width="70%" height={16} />
    </View>
  );
}

export function DashboardSkeleton({
  embedded = false,
  glass = false,
}: {
  embedded?: boolean;
  glass?: boolean;
}) {
  const tabPaddingBottom = useTabScreenPaddingBottom();

  const content = (
    <>
      {glass ? <DateRangeCardSkeleton glass /> : null}
      <View style={styles.statsGrid}>
        {STAT_VARIANTS.map((variant) => (
          <StatCardSkeleton key={variant} glass={glass} variant={variant} />
        ))}
      </View>
      <ChartCardSkeleton glass={glass} />
      <TopProductsSectionSkeleton glass={glass} />
    </>
  );

  if (embedded) {
    return (
      <View style={[styles.dashboardEmbedded, glass && styles.dashboardGlass]}>
        {content}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.dashboardScroll}
      contentContainerStyle={[styles.dashboard, { paddingBottom: tabPaddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

export function DashboardHeaderActionsSkeleton() {
  return (
    <View style={styles.headerActions}>
      <Skeleton width={36} height={36} borderRadius={18} />
      <Skeleton width={36} height={36} borderRadius={18} />
    </View>
  );
}

export function CategoryGridItemSkeleton() {
  return (
    <View style={styles.categoryCell}>
      <Skeleton width={56} height={56} borderRadius={Radius.md} />
      <Skeleton width="72%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="30%" height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

export function CategoryGridSkeleton({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <View style={styles.categoryGrid}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <View key={rowIndex} style={styles.categoryRow}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <View key={colIndex} style={styles.categoryCellWrap}>
              <CategoryGridItemSkeleton />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function StockStatusTabsSkeleton() {
  return (
    <View style={styles.stockTabs}>
      {[88, 96, 108, 84].map((width, index) => (
        <Skeleton key={index} width={width} height={34} borderRadius={8} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: Colors.borderLight },
  baseGlass: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  listContent: { flex: 1 },
  listRight: { alignItems: 'flex-end' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  serviceChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceChip: {
    minWidth: 100,
    maxWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  statCardGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  statCardBody: {
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 176, 32, 0.28)',
    padding: 16,
    ...Shadow.iosCard,
  },
  chartCardGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chartHeaderText: { flex: 1, marginRight: 12 },
  chartPlot: {
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  sectionCardGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  sectionBodyGlass: {
    borderTopWidth: 0,
  },
  topProductsHeaderGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topProductsBodyGlass: {
    gap: 4,
  },
  topProductRowGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  dateRangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadow.iosCard,
  },
  dateRangeCardGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  dashboardScroll: { flex: 1, backgroundColor: Colors.white },
  dashboard: { padding: 16, gap: 14, backgroundColor: Colors.white },
  dashboardEmbedded: { gap: 14, backgroundColor: 'transparent' },
  dashboardGlass: { backgroundColor: 'transparent' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryGrid: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryCellWrap: {
    width: '25%',
  },
  categoryCell: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  stockTabs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  gridBody: {
    padding: 10,
  },
});

// Backward compatible alias
export function ProductGridCardSkeleton() {
  return (
    <View style={styles.gridCard}>
      <Skeleton width="100%" height={104} borderRadius={0} />
      <View style={styles.gridBody}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="32%" height={28} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
      </View>
    </View>
  );
}

export const ProductCardSkeleton = ProductListSkeleton;

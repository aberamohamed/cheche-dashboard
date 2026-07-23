import { DashboardFilterModal } from '@/components/dashboard/DashboardFilterModal';
import { HomeDateRangeCard } from '@/components/home/HomeDateRangeCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { StatCard, StatCardCurrency } from '@/components/ui/StatCard';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { getHomeStrings } from '@/i18n/home';
import { useDashboard } from '@/hooks/useSales';
import { useDashboardFilterStore } from '@/store/dashboardFilterStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  formatCurrency,
  formatDashboardDateRangePeriod,
  formatDashboardDateRangeSubtitle,
  formatNumber,
} from '@/utils/format';
import { router, type Href } from 'expo-router';
import {
  Banknote,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type DashboardAnalyticsContentProps = {
  compact?: boolean;
  glass?: boolean;
  filterOpen?: boolean;
  onFilterOpenChange?: (open: boolean) => void;
};

export function DashboardAnalyticsContent({
  compact = false,
  glass = false,
  filterOpen: controlledFilterOpen,
  onFilterOpenChange,
}: DashboardAnalyticsContentProps) {
  const { data: stats, isLoading } = useDashboard();
  const applied = useDashboardFilterStore((s) => s.applied);
  const setApplied = useDashboardFilterStore((s) => s.setApplied);
  const resetFilters = useDashboardFilterStore((s) => s.reset);
  const language = useSettingsStore((s) => s.language);
  const strings = getHomeStrings(language);

  const filterSubtitle = formatDashboardDateRangeSubtitle(applied.startDate, applied.endDate);
  const chartPeriodLabel = formatDashboardDateRangePeriod(applied.startDate, applied.endDate);

  const openFilter = () => onFilterOpenChange?.(true);
  const closeFilter = () => onFilterOpenChange?.(false);

  // Deduplicate by product id to avoid React duplicate-key crashes when the
  // API returns the same product more than once in the top-products list.
  const topProducts = stats
    ? Array.from(
        new Map(stats.topProducts.map((item) => [item.product.id, item])).values()
      )
    : [];

  if (isLoading || !stats) {
    return (
      <View style={compact ? styles.compactWrap : undefined}>
        <DashboardSkeleton embedded glass={glass} />
      </View>
    );
  }

  return (
    <View style={compact ? styles.compactWrap : undefined}>
      <HomeDateRangeCard label={filterSubtitle} onPress={openFilter} glass={glass} />

      <View style={styles.statsGrid}>
        <StatCardCurrency
          label={strings.totalSales}
          value={stats.totalRevenue}
          change={stats.salesChange}
          variant="pink"
          trendData={stats.statTrends.sales}
          glass={glass}
          icon={<Banknote size={18} color={Brand.primary} />}
        />
        <StatCard
          label={strings.transactions}
          value={formatNumber(stats.totalOrders)}
          change={stats.ordersChange}
          variant="blue"
          trendData={stats.statTrends.transactions}
          glass={glass}
          icon={<ShoppingBag size={18} color="#007AFF" />}
        />
        <StatCard
          label={strings.itemsSold}
          value={formatNumber(stats.productsSold)}
          change={stats.productsChange}
          variant="green"
          trendData={stats.statTrends.itemsSold}
          glass={glass}
          icon={<Package size={18} color={Colors.success} />}
        />
        <StatCardCurrency
          label={strings.avgSale}
          value={stats.averageSale}
          variant="purple"
          trendData={stats.statTrends.averageSale}
          glass={glass}
          icon={<TrendingUp size={18} color="#AF52DE" />}
        />
      </View>

      <ChartCard
        title={strings.salesTrend}
        subtitle={filterSubtitle}
        period={chartPeriodLabel}
        onPeriodPress={openFilter}
        data={stats.chartData}
        glass={glass}
      />

      {glass ? (
        <View style={styles.sectionPlainGlass}>
          <View style={styles.sectionHeaderGlass}>
            <Text style={[styles.sectionTitle, styles.sectionTitleGlass]}>{strings.topSellingProducts}</Text>
            <Pressable onPress={() => router.push('/products' as Href)} hitSlop={8}>
              <Text style={styles.viewAll}>{strings.viewAll}</Text>
            </Pressable>
          </View>

          {stats.topProducts.length === 0 ? (
            <View style={styles.emptyWrapGlass}>
              <ShoppingBag size={28} color="rgba(255,255,255,0.55)" />
              <Text style={styles.emptyTextGlass}>No sales data yet</Text>
            </View>
          ) : (
            <View style={styles.sectionBodyGlass}>
              {topProducts.map((item, idx) => (
                <View key={`${item.product.id}-${idx}`} style={styles.productRowGlass}>
                  <ProductThumbnail uri={item.product.image} size={48} />
                  <View style={styles.productCenter}>
                    <Text style={[styles.productName, styles.productNameGlass]} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={[styles.productMeta, styles.productMetaGlass]}>
                      {formatNumber(item.quantitySold)} {strings.unitsSold}
                    </Text>
                  </View>
                  <Text style={[styles.productAmount, styles.productAmountGlass]}>
                    {formatCurrency(item.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{strings.topSellingProducts}</Text>
            <Pressable onPress={() => router.push('/products' as Href)} hitSlop={8}>
              <Text style={styles.viewAll}>{strings.viewAll}</Text>
            </Pressable>
          </View>

          {stats.topProducts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <ShoppingBag size={28} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No sales data yet</Text>
            </View>
          ) : (
            <View style={styles.sectionBody}>
              {topProducts.map((item, idx) => (
                <View key={`${item.product.id}-${idx}`} style={styles.productRow}>
                  <ProductThumbnail uri={item.product.image} size={48} />
                  <View style={styles.productCenter}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.productMeta}>
                      {formatNumber(item.quantitySold)} {strings.unitsSold}
                    </Text>
                  </View>
                  <Text style={styles.productAmount}>{formatCurrency(item.revenue)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {controlledFilterOpen !== undefined && onFilterOpenChange ? (
        <DashboardFilterModal
          visible={controlledFilterOpen}
          filters={applied}
          onClose={closeFilter}
          onApply={(filters) => {
            setApplied(filters);
            closeFilter();
          }}
          onReset={() => {
            resetFilters();
            closeFilter();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    paddingHorizontal: 20,
    gap: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.iosCard,
  },
  sectionPlainGlass: {
    backgroundColor: 'transparent',
  },
  sectionHeaderGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionTitle: { ...Typography.headline, color: Colors.text, fontWeight: '600' },
  sectionTitleGlass: { color: Colors.white },
  viewAll: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '600',
  },
  sectionBodyGlass: {
    paddingBottom: 8,
    borderTopWidth: 0,
  },
  emptyWrapGlass: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
    borderTopWidth: 0,
  },
  emptyTextGlass: {
    ...Typography.subhead,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
  },
  productRowGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  productNameGlass: { color: Colors.white },
  productMetaGlass: { color: 'rgba(255, 255, 255, 0.72)' },
  productAmountGlass: { color: Colors.white },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  emptyText: { ...Typography.subhead, color: Colors.textSecondary, textAlign: 'center' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  productCenter: { flex: 1, minWidth: 0 },
  productName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  productMeta: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  productAmount: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
});

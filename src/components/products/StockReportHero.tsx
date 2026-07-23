import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import {
  SCREEN_HEADER_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
  screenHeaderSubtitleText,
  screenHeaderTitleText,
} from '@/constants/screenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import type { ProductStockStats } from '@/utils/productFilters';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STAT_CARD_HEIGHT = 96;
const STAT_GRID_GAP = 8;

interface StockReportHeroProps {
  stats: ProductStockStats;
  onBack: () => void;
}

function StatCard({
  icon,
  label,
  value,
  description,
  accentColor,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  accentColor: string;
  iconBg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeaderRow}>
        <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDescription}>{description}</Text>
      <View style={[styles.statAccent, { backgroundColor: accentColor }]} />
    </View>
  );
}

export function StockReportHero({ stats, onBack }: StockReportHeroProps) {
  return (
    <View style={styles.shell}>
      <StatusBar style="dark" />

      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <HeaderBackButton onPress={onBack} variant="light" />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              Stock Report
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Overview of your product stock status
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>

      <View style={styles.statsGrid}>
        <StatCard
          icon={<Ionicons name="cube-outline" size={15} color="#6D28D9" />}
          label="Total Products"
          value={stats.total}
          description="All products in catalog"
          accentColor="#8B5CF6"
          iconBg="#EDE9FE"
        />
        <StatCard
          icon={<Ionicons name="checkmark-circle-outline" size={15} color="#047857" />}
          label="In Stock"
          value={stats.inStock}
          description="Products available"
          accentColor="#10B981"
          iconBg="#D1FAE5"
        />
        <StatCard
          icon={<Ionicons name="warning-outline" size={15} color="#B45309" />}
          label="Low Stock"
          value={stats.lowStock}
          description="Running low"
          accentColor="#F59E0B"
          iconBg="#FEF3C7"
        />
        <StatCard
          icon={<Ionicons name="close-circle-outline" size={15} color={Brand.primary} />}
          label="Out of Stock"
          value={stats.outOfStock}
          description="Not available"
          accentColor={Brand.primary}
          iconBg={Brand.primaryMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: SCREEN_HEADER_PADDING_TOP,
    paddingBottom: 12,
    gap: 8,
  },
  headerLeft: {
    minWidth: SCREEN_HEADER_SIDE_SIZE,
    alignItems: 'flex-start',
  },
  headerRight: {
    minWidth: SCREEN_HEADER_SIDE_SIZE,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    ...screenHeaderTitleText,
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '800',
  },
  subtitle: screenHeaderSubtitleText,
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: STAT_GRID_GAP,
    paddingBottom: 12,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
    minHeight: STAT_CARD_HEIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    paddingRight: 6,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 26,
    color: Colors.text,
    fontWeight: '800',
  },
  statDescription: {
    ...Typography.caption2,
    color: Colors.textTertiary,
    lineHeight: 14,
    fontSize: 11,
  },
  statAccent: {
    position: 'absolute',
    top: 10,
    right: 0,
    width: 3,
    height: 36,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
});

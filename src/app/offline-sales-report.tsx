import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { HISTORY_DATE_OPTIONS } from '@/data/listFilterOptions';
import { usePendingSalesStore } from '@/store/pendingSalesStore';
import { useReceiptStore } from '@/store/receiptStore';
import type { PendingSale, PendingSaleStatus } from '@/types/offline';
import { formatCurrency } from '@/utils/format';
import { router } from 'expo-router';
import { AlertCircle, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, RefreshCw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const STATUS_META: Record<
  PendingSaleStatus,
  { label: string; color: string; iconBg: string; Icon: typeof Clock }
> = {
  PENDING: { label: 'Pending', color: Colors.warning, iconBg: Colors.warningBg, Icon: Clock },
  SYNCING: { label: 'Syncing', color: Brand.primary, iconBg: Brand.primaryMuted, Icon: RefreshCw },
  SYNCED: { label: 'Synced', color: Colors.success, iconBg: Colors.successBg, Icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: Colors.danger, iconBg: Colors.dangerBg, Icon: AlertCircle },
};

const SCREEN_WIDTH = Dimensions.get('window').width;

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

function inDateRange(iso: string, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return d >= startOfToday;
    case 'yesterday': {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return d >= startOfYesterday && d < startOfToday;
    }
    case 'week': {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return d >= startOfWeek;
    }
    case 'month':
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return true;
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OfflineSalesReportScreen() {
  const sales = usePendingSalesStore((s) => s.sales);
  const loading = usePendingSalesStore((s) => s.loading);
  const refresh = usePendingSalesStore((s) => s.refresh);
  const setThermalPreviewReceipt = useReceiptStore((s) => s.setThermalPreviewReceipt);

  const [filter, setFilter] = useState<DateFilter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16 });
  const anchorRef = useRef<View>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      sales
        .filter((s) => inDateRange(s.createdAt, filter))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [sales, filter]
  );

  const summary = useMemo(() => {
    const total = filtered.reduce((sum, s) => sum + s.total, 0);
    const synced = filtered.filter((s) => s.synced).length;
    const failed = filtered.filter((s) => s.status === 'FAILED').length;
    const pending = filtered.length - synced - failed;
    return { count: filtered.length, total, synced, failed, pending };
  }, [filtered]);

  const activeFilterLabel = HISTORY_DATE_OPTIONS.find((o) => o.id === filter)?.label ?? 'All';

  const openMenu = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ top: y + height + 6, right: Math.max(12, SCREEN_WIDTH - (x + width)) });
      setMenuOpen(true);
    });
  };

  const handleViewReceipt = (sale: PendingSale) => {
    setThermalPreviewReceipt(sale.receipt);
    router.push({
      pathname: '/thermal-receipt-preview',
      params: { invoiceNumber: sale.serverInvoiceNumber ?? sale.orderNumber },
    });
  };

  const renderItem = ({ item, index }: { item: PendingSale; index: number }) => {
    const meta = STATUS_META[item.status];
    const itemCount = item.payload.lines?.length ?? 0;
    const unconfirmed = item.status === 'SYNCED' && !!item.syncedNote;
    const isLast = index === filtered.length - 1;

    return (
      <Pressable
        style={[styles.row, !isLast && styles.rowBorder]}
        onPress={() => handleViewReceipt(item)}
      >
        <View style={[styles.iconChip, { backgroundColor: unconfirmed ? Colors.warningBg : meta.iconBg }]}>
          <meta.Icon size={18} color={unconfirmed ? Colors.warning : meta.color} strokeWidth={2.2} />
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowTopLine}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {item.serverInvoiceNumber ?? item.orderNumber}
            </Text>
            <Text style={styles.total}>{formatCurrency(item.total)}</Text>
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {formatDateTime(item.createdAt)} · {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
            <Text style={{ color: unconfirmed ? Colors.warning : meta.color, fontWeight: '600' }}>
              {unconfirmed ? 'Unconfirmed' : meta.label}
            </Text>
          </Text>

          {unconfirmed ? (
            <Text style={styles.unconfirmedText} numberOfLines={2}>
              Synced without fiscal confirmation — gateway error
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Offline Sales Report"
        subtitle={`${summary.count} sale${summary.count === 1 ? '' : 's'} · ${formatCurrency(summary.total)}`}
        onBack={() => router.back()}
        right={
          <Pressable ref={anchorRef} style={styles.filterBtn} onPress={openMenu} hitSlop={6}>
            <CalendarDays size={15} color={Brand.primary} />
            <Text style={styles.filterBtnText} numberOfLines={1}>
              {activeFilterLabel}
            </Text>
            <ChevronDown size={14} color={Brand.primary} />
          </Pressable>
        }
      />

      <View style={styles.summaryRow}>
        <SummaryTile label="Synced" value={summary.synced} color={Colors.success} />
        <View style={styles.summaryDivider} />
        <SummaryTile label="Pending" value={summary.pending} color={Colors.warning} />
        <View style={styles.summaryDivider} />
        <SummaryTile label="Failed" value={summary.failed} color={Colors.danger} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            title="No offline sales"
            message="Offline sales for the selected period will appear here."
          />
        }
      />

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: menuPos.top, right: menuPos.right }]}>
            {HISTORY_DATE_OPTIONS.map((option, index) => {
              const active = option.id === filter;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.menuItem, index < HISTORY_DATE_OPTIONS.length - 1 && styles.menuItemBorder]}
                  onPress={() => {
                    setFilter(option.id as DateFilter);
                    setMenuOpen(false);
                  }}
                >
                  <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                    {option.label}
                  </Text>
                  {active ? <Check size={16} color={Brand.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  summaryTile: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: Colors.border },
  summaryValue: { ...Typography.title3, fontWeight: '700' },
  summaryLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderNumber: { ...Typography.subhead, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  meta: { ...Typography.caption1, color: Colors.textSecondary },
  total: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  unconfirmedText: { ...Typography.caption2, color: Colors.warning, marginTop: 2 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: Brand.primaryMuted,
    maxWidth: 150,
  },
  filterBtnText: { ...Typography.caption1, fontWeight: '700', color: Brand.primary },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  menu: {
    position: 'absolute',
    minWidth: 170,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.borderLight },
  menuItemText: { ...Typography.subhead, color: Colors.text },
  menuItemTextActive: { color: Brand.primary, fontWeight: '700' },
});

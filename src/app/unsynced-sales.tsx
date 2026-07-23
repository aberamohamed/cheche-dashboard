import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { syncPendingSales } from '@/services/offline/syncService';
import { useConnectivityStore } from '@/store/connectivityStore';
import { usePendingSalesStore } from '@/store/pendingSalesStore';
import { useReceiptStore } from '@/store/receiptStore';
import { useToastStore } from '@/store/toastStore';
import type { PendingSale, PendingSaleStatus } from '@/types/offline';
import { formatCurrency } from '@/utils/format';
import { withLoading } from '@/utils/withLoading';
import { router } from 'expo-router';
import { AlertCircle, Clock, RefreshCw, ChevronRight, CloudOff } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_META: Record<
  PendingSaleStatus,
  { label: string; color: string; iconBg: string; Icon: typeof Clock }
> = {
  PENDING: { label: 'Pending', color: Colors.warning, iconBg: Colors.warningBg, Icon: Clock },
  SYNCING: { label: 'Syncing', color: Brand.primary, iconBg: Brand.primaryMuted, Icon: RefreshCw },
  SYNCED: { label: 'Synced', color: Colors.success, iconBg: Colors.successBg, Icon: Clock },
  FAILED: { label: 'Failed', color: Colors.danger, iconBg: Colors.dangerBg, Icon: AlertCircle },
};

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

export default function UnsyncedSalesScreen() {
  const sales = usePendingSalesStore((s) => s.sales);
  const loading = usePendingSalesStore((s) => s.loading);
  const refresh = usePendingSalesStore((s) => s.refresh);
  const retrySale = usePendingSalesStore((s) => s.retrySale);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const setThermalPreviewReceipt = useReceiptStore((s) => s.setThermalPreviewReceipt);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unsynced = sales.filter((s) => s.status !== 'SYNCED');

  const handleSyncNow = async () => {
    if (!isOnline) {
      showToast('No internet connection. Connect and try again.');
      return;
    }
    const result = await withLoading(() => syncPendingSales(), 'Syncing sales...');
    if (result.skipped) {
      showToast('Could not sync right now. Try again shortly.');
    } else if (result.attempted === 0) {
      showToast('Nothing to sync.');
    } else {
      showToast(`Synced ${result.synced} of ${result.attempted} sale(s).`);
    }
  };

  const handleRetry = async (sale: PendingSale) => {
    await retrySale(sale.id);
    if (isOnline) {
      await handleSyncNow();
    } else {
      showToast('Queued for retry. Will sync when back online.');
    }
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
    const isLast = index === unsynced.length - 1;

    return (
      <View style={[styles.row, !isLast && styles.rowBorder]}>
        <View style={[styles.iconChip, { backgroundColor: meta.iconBg }]}>
          <meta.Icon size={18} color={meta.color} strokeWidth={2.2} />
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
            <Text style={{ color: meta.color, fontWeight: '600' }}>{meta.label}</Text>
          </Text>

          {item.status === 'FAILED' && item.lastError ? (
            <Text style={styles.errorText} numberOfLines={2}>
              {item.lastError}
            </Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.linkBtn}
              onPress={() => handleViewReceipt(item)}
              hitSlop={8}
            >
              <Text style={styles.linkText}>View receipt</Text>
              <ChevronRight size={14} color={Brand.primary} />
            </Pressable>

            {item.status === 'FAILED' ? (
              <Pressable
                style={styles.retryBtn}
                onPress={() => handleRetry(item)}
                hitSlop={8}
              >
                <RefreshCw size={13} color={Brand.primary} strokeWidth={2.4} />
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Unsynced Sales"
        subtitle={isOnline ? 'Online' : 'Offline'}
        onBack={() => router.back()}
      />

      <FlatList
        data={unsynced}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <CloudOff size={36} color={Colors.textTertiary} strokeWidth={1.75} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>There are no offline sales waiting to sync.</Text>
          </View>
        }
      />

      {unsynced.length > 0 ? (
        <SafeAreaView style={styles.footerSafe} edges={['bottom']}>
          <View style={styles.footer}>
            <Button
              title={`Sync now (${unsynced.length})`}
              onPress={handleSyncNow}
              disabled={!isOnline}
              icon={<RefreshCw size={18} color={Colors.white} />}
            />
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
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
  total: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  meta: { ...Typography.caption1, color: Colors.textSecondary },
  errorText: { ...Typography.caption1, color: Colors.danger, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { ...Typography.footnote, fontWeight: '600', color: Brand.primary },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  retryText: { ...Typography.footnote, fontWeight: '600', color: Brand.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 100 },
  emptyTitle: { ...Typography.headline, fontWeight: '700', color: Colors.text },
  emptyText: { ...Typography.subhead, color: Colors.textSecondary, textAlign: 'center' },
  footerSafe: { backgroundColor: Colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
});

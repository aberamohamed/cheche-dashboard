import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import type { WithholdingRecord } from '@/types';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { CircleCheck, Clock, Store, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function formatLabel(value?: string, fallback = '—'): string {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(status?: string) {
  const normalized = (status ?? 'completed').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('void')) {
    return { bg: Colors.dangerBg, text: Colors.danger };
  }
  if (normalized.includes('draft') || normalized.includes('pending') || normalized.includes('unpaid')) {
    return { bg: Colors.warningBg, text: Colors.warning };
  }
  return { bg: Colors.successBg, text: Colors.success };
}

function statusIcon(status?: string) {
  const normalized = (status ?? 'completed').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('void')) {
    return XCircle;
  }
  if (normalized.includes('draft') || normalized.includes('pending') || normalized.includes('unpaid')) {
    return Clock;
  }
  return CircleCheck;
}

function StatusPill({ status }: { status?: string }) {
  const colors = statusStyle(status);
  const Icon = statusIcon(status);

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
      <Icon size={11} color={colors.text} strokeWidth={2.5} />
      <Text style={[styles.statusPillText, { color: colors.text }]}>
        {formatLabel(status, 'Completed')}
      </Text>
    </View>
  );
}

interface WithholdingListRowProps {
  item: WithholdingRecord;
  onPress: (item: WithholdingRecord) => void;
  showDate?: boolean;
}

export function WithholdingListRow({ item, onPress, showDate = true }: WithholdingListRowProps) {
  const dateLabel = format(parseISO(item.createdAt), 'MMM d, yyyy');
  const timeLabel = format(parseISO(item.createdAt), 'h:mm a');

  return (
    <View style={styles.wrap}>
      {showDate ? <Text style={styles.dateLabel}>{dateLabel}</Text> : null}
      <Pressable style={styles.cardRow} onPress={() => onPress(item)}>
        <View style={styles.rowIconWrap}>
          <Store size={18} color={Brand.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.number}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {item.clientName}
          </Text>
          <Text style={styles.rowMetaText}>{timeLabel}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
          <StatusPill status={item.status} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  dateLabel: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    minHeight: 72,
  },
  rowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  rowSubtitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  rowMetaText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
    minWidth: 96,
  },
  rowAmount: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusPillText: {
    ...Typography.caption2,
    fontWeight: '600',
  },
});

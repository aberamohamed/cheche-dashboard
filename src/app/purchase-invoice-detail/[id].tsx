import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { usePurchaseInvoice } from '@/hooks/usePurchaseInvoice';
import type { PurchaseInvoiceItem } from '@/types/purchase';
import { appAlert } from '@/utils/alert';
import { copyToClipboard } from '@/utils/clipboard';
import { formatCurrency } from '@/utils/format';
import { getInvoiceStrings } from '@/i18n/invoice';
import { useSettingsStore } from '@/store/settingsStore';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeftRight,
  Building2,
  Calculator,
  Calendar,
  CircleCheck,
  Clock,
  Copy,
  FileText,
  MoreVertical,
  Package,
  Percent,
  RefreshCw,
  Tag,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatLabel(value?: string, fallback = '—'): string {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(value?: string): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'MMM dd, yyyy • h:mm a');
  } catch {
    return value;
  }
}

function formatDate(value?: string): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'MMM dd, yyyy');
  } catch {
    return value;
  }
}

function CopyButton({ value }: { value: string }) {
  const handleCopy = async () => {
    try {
      await copyToClipboard(value);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      appAlert('Error', 'Unable to copy to clipboard.', undefined, { variant: 'error' });
    }
  };

  return (
    <Pressable onPress={handleCopy} hitSlop={8} style={styles.copyBtn}>
      <Copy size={16} color={Brand.primary} />
    </Pressable>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? 'completed').toLowerCase();
  const statusKey = normalized.includes('partial')
    ? 'partial'
    : normalized.includes('cancel')
      ? 'cancelled'
      : normalized.includes('pending')
        ? 'pending'
        : 'completed';

  const palette = {
    completed: { bg: Colors.successBg, text: Colors.success, icon: CircleCheck },
    partial: { bg: Colors.warningBg, text: Colors.warning, icon: Clock },
    pending: { bg: Colors.warningBg, text: Colors.warning, icon: Clock },
    cancelled: { bg: Colors.dangerBg, text: Colors.danger, icon: XCircle },
  } as const;

  const statusStyle = palette[statusKey];
  const StatusIcon = statusStyle.icon;

  return (
    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
      <StatusIcon size={14} color={statusStyle.text} strokeWidth={2.5} />
      <Text style={[styles.statusText, { color: statusStyle.text }]}>
        {formatLabel(status, 'Completed')}
      </Text>
    </View>
  );
}

function IconInfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Icon size={16} color={Brand.primary} strokeWidth={2.2} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIconWrap}>
        <Icon size={15} color={Brand.primary} strokeWidth={2.2} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function InvoiceItemRow({ item, strings }: { item: PurchaseInvoiceItem; strings: ReturnType<typeof getInvoiceStrings> }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.description}</Text>
        <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
      </View>
      <Text style={styles.itemMeta}>
        {item.qty} {item.uom} × {formatCurrency(item.unitPrice)}
      </Text>
      {item.discountAmount > 0 ? (
        <Text style={styles.itemMeta}>{strings.itemDiscount}: {formatCurrency(item.discountAmount)}</Text>
      ) : null}
    </View>
  );
}

export default function PurchaseInvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const itemsOffsetRef = useRef(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const invoiceQuery = usePurchaseInvoice(id);
  const language = useSettingsStore((s) => s.language);
  const strings = getInvoiceStrings(language);

  const scrollToItems = () => {
    scrollRef.current?.scrollTo({ y: itemsOffsetRef.current, animated: true });
  };

  const handleMoreAction = async (action: 'copy' | 'items') => {
    setMoreOpen(false);
    if (!invoiceQuery.data) return;
    if (action === 'copy') {
      try {
        await copyToClipboard(invoiceQuery.data.piNumber);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        appAlert('Error', 'Unable to copy to clipboard.', undefined, { variant: 'error' });
      }
      return;
    }
    scrollToItems();
  };

  if (invoiceQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={strings.invoiceDetail} onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </View>
    );
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={strings.invoiceDetail} onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{strings.invoiceNotFound}</Text>
        </View>
      </View>
    );
  }

  const invoice = invoiceQuery.data;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={strings.invoiceDetail}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => setMoreOpen((open) => !open)}
            hitSlop={8}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="More actions"
          >
            <MoreVertical size={22} color={Colors.text} />
          </Pressable>
        }
      />

      {moreOpen ? (
        <View style={styles.moreMenu}>
          <Pressable style={styles.moreMenuItem} onPress={() => void handleMoreAction('copy')}>
            <Text style={styles.moreMenuText}>{strings.copyInvoiceNumber}</Text>
          </Pressable>
          <View style={styles.moreMenuDivider} />
          <Pressable style={styles.moreMenuItem} onPress={() => void handleMoreAction('items')}>
            <Text style={styles.moreMenuText}>{strings.viewLineItems}</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroEyebrow}>{strings.invoiceNumber}</Text>
            <StatusBadge status={invoice.status} />
          </View>

          <View style={styles.invoiceNumberRow}>
            <Text style={styles.invoiceNumber}>{invoice.piNumber}</Text>
            <CopyButton value={invoice.piNumber} />
          </View>

          <View style={styles.heroBottomRow}>
            <View style={styles.heroTotalBlock}>
              <Text style={styles.heroEyebrow}>{strings.grandTotal}</Text>
              <Text style={{...styles.heroTotal, color: Brand.primary, fontSize: 20}}>{formatCurrency(invoice.grandTotal)}</Text>
            </View>

            <Pressable style={styles.viewInvoiceBtn} onPress={scrollToItems}>
              <View style={styles.viewInvoiceIconWrap}>
                <FileText size={22} color={Brand.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.viewInvoiceLabel}>{strings.viewInvoice}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <IconInfoRow icon={User} label={strings.supplier} value={invoice.supplierName} />
          <View style={styles.divider} />
          <IconInfoRow
            icon={ArrowLeftRight}
            label={strings.transactionType}
            value={invoice.supplierTransactionType ?? '—'}
          />
          <View style={styles.divider} />
          <IconInfoRow icon={Building2} label={strings.warehouse} value={invoice.warehouseName ?? '—'} />
          <View style={styles.divider} />
          <IconInfoRow icon={Calendar} label={strings.invoiceDate} value={formatDate(invoice.invoiceDate)} />
          <View style={styles.divider} />
          <IconInfoRow icon={Clock} label={strings.created} value={formatDateTime(invoice.createdAt)} />
          {invoice.updatedAt ? (
            <>
              <View style={styles.divider} />
              <IconInfoRow icon={RefreshCw} label={strings.updated} value={formatDateTime(invoice.updatedAt)} />
            </>
          ) : null}
          {invoice.purchaseOrderNumber ? (
            <>
              <View style={styles.divider} />
              <IconInfoRow icon={FileText} label={strings.purchaseOrder} value={invoice.purchaseOrderNumber} />
            </>
          ) : null}
          {invoice.invoiceIrn ? (
            <>
              <View style={styles.divider} />
              <IconInfoRow icon={FileText} label={strings.invoiceIrn} value={invoice.invoiceIrn} />
            </>
          ) : null}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>{strings.summary}</Text>
          <View style={styles.summaryCard}>
            <SummaryRow icon={Package} label={strings.totalQty} value={String(invoice.totalQty)} />
            <View style={styles.summaryDivider} />
            <SummaryRow icon={Calculator} label={strings.subtotal} value={formatCurrency(invoice.totalAmount)} />
            <View style={styles.summaryDivider} />
            <SummaryRow icon={Percent} label={strings.taxes} value={formatCurrency(invoice.totalTaxes)} />
            <View style={styles.summaryDivider} />
            <SummaryRow icon={Tag} label={strings.discount} value={formatCurrency(invoice.totalDiscount)} />
            <View style={styles.summaryDivider} />
            <SummaryRow icon={Calculator} label={strings.paidAmount} value={formatCurrency(invoice.paidAmount)} />
            <View style={styles.summaryDivider} />
            <SummaryRow
              icon={Calculator}
              label={strings.outstanding}
              value={formatCurrency(invoice.outstandingAmount)}
            />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{strings.grandTotal}</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View
          style={styles.itemsSection}
          onLayout={(event) => {
            itemsOffsetRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>{strings.items} ({invoice.items.length})</Text>
          {invoice.items.map((item) => (
            <InvoiceItemRow key={item.id} item={item} strings={strings} />
          ))}
        </View>

        {invoice.remarks ? (
          <View style={styles.remarksSection}>
            <Text style={styles.sectionTitle}>{strings.remarks}</Text>
            <View style={styles.remarksBox}>
              <Text style={styles.remarksText}>{invoice.remarks}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const cardBase = {
  backgroundColor: Colors.white,
  borderRadius: Radius.lg,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: Colors.border,
  ...Shadow.iosCard,
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMenu: {
    position: 'absolute',
    top: 88,
    right: 16,
    zIndex: 20,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    minWidth: 190,
    ...Shadow.iosCard,
  },
  moreMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  moreMenuText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '500',
  },
  moreMenuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  heroCard: {
    ...cardBase,
    padding: 16,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroEyebrow: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceNumber: {
    ...Typography.title2,
    fontWeight: '700',
    color: Brand.primary,
    flexShrink: 1,
  },
  copyBtn: {
    padding: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  statusText: {
    ...Typography.caption2,
    fontWeight: '600',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  heroTotalBlock: {
    flex: 1,
    gap: 4,
  },
  heroTotal: {
    ...Typography.title1,
    fontWeight: '700',
    color: Colors.text,
  },
  viewInvoiceBtn: {
    alignItems: 'center',
    gap: 6,
    width: 88,
  },
  viewInvoiceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(227, 0, 116, 0.22)',
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewInvoiceLabel: {
    ...Typography.caption2,
    color: Brand.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    ...cardBase,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 108,
    flexShrink: 0,
  },
  infoValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  summarySection: {
    gap: 10,
  },
  sectionTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FAFAFB',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  summaryValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 52,
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  grandTotalLabel: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  grandTotalValue: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '700',
  },
  itemsSection: {
    gap: 10,
  },
  itemCard: {
    ...cardBase,
    padding: 14,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemName: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  itemAmount: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  itemMeta: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  remarksSection: {
    gap: 10,
  },
  remarksBox: {
    ...cardBase,
    padding: 14,
  },
  remarksText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 20,
  },
});

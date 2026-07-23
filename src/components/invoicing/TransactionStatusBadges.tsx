import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { getInvoiceStrings } from '@/i18n/invoice';
import { useSettingsStore } from '@/store/settingsStore';
import { isFailedDocumentStatus, isFailedEirmsStatus } from '@/utils/transactionStatus';
import {
  AlertTriangle,
  CreditCard,
  FileText,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

function formatLabel(value?: string, fallback = '—'): string {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function typeStyle(type?: string) {
  const normalized = (type ?? 'invoice').toLowerCase();
  if (normalized.includes('debit')) {
    return { bg: '#FFF4E5', text: '#E67700' };
  }
  return { bg: '#E8F2FF', text: '#2F80ED' };
}

function statusStyle(status?: string) {
  if (isFailedDocumentStatus(status)) {
    return { bg: Colors.dangerBg, text: Colors.danger };
  }
  const normalized = (status ?? 'paid').toLowerCase();
  if (normalized.includes('draft') || normalized.includes('pending') || normalized.includes('unpaid')) {
    return { bg: Colors.warningBg, text: Colors.warning };
  }
  return { bg: Colors.successBg, text: Colors.success };
}

function eirmsStyle(status?: string) {
  if (isFailedEirmsStatus(status)) {
    return { bg: Colors.dangerBg, text: Colors.danger, icon: AlertTriangle };
  }
  const normalized = (status ?? '').toLowerCase();
  if (normalized.includes('success')) {
    return { bg: Colors.successBg, text: Colors.success, icon: ShieldCheck };
  }
  return null;
}

function StatusRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Icon size={16} color={Brand.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function ValueBadge({
  value,
  bg,
  text,
  icon: Icon,
}: {
  value: string;
  bg: string;
  text: string;
  icon?: LucideIcon;
}) {
  return (
    <View style={[styles.badge, Icon && styles.badgeWithIcon, { backgroundColor: bg }]}>
      {Icon ? <Icon size={12} color={text} /> : null}
      <Text style={[styles.badgeText, { color: text }]}>{value}</Text>
    </View>
  );
}

interface TransactionStatusBadgesProps {
  customerName?: string;
  partyLabel?: string;
  invoiceType?: string;
  status?: string;
  eirmsStatus?: string;
}

export function TransactionStatusBadges({
  customerName,
  partyLabel = 'Client',
  invoiceType,
  status,
  eirmsStatus,
}: TransactionStatusBadgesProps) {
  const language = useSettingsStore((s) => s.language);
  const strings = getInvoiceStrings(language);
  const type = typeStyle(invoiceType);
  const statusColors = statusStyle(status);
  const eirms = eirmsStyle(eirmsStatus);

  return (
    <View style={styles.list}>
      {customerName ? (
        <StatusRow icon={User} label={partyLabel}>
          <Text style={styles.valueText}>{customerName}</Text>
        </StatusRow>
      ) : null}
      <StatusRow icon={FileText} label={strings.type}>
        <ValueBadge value={formatLabel(invoiceType, strings.invoice)} bg={type.bg} text={type.text} />
      </StatusRow>
      <StatusRow icon={CreditCard} label={strings.status}>
        <ValueBadge value={formatLabel(status, strings.paid)} bg={statusColors.bg} text={statusColors.text} />
      </StatusRow>
      {eirms ? (
        <StatusRow icon={ShieldCheck} label={strings.eimsStatus}>
          <ValueBadge
            value={formatLabel(eirmsStatus)}
            bg={eirms.bg}
            text={eirms.text}
            icon={eirms.icon}
          />
        </StatusRow>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rowRight: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  valueText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    ...Typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

import { Modal } from '@/components/ui/Modal';
import { Colors, Radius, Typography } from '@/constants/theme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export interface ReportSummaryStat {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

export interface ReportSummaryAmount {
  label: string;
  value: string;
  accent?: boolean;
}

interface ReportSummaryModalProps {
  visible: boolean;
  title: string;
  stats: ReportSummaryStat[];
  amounts: ReportSummaryAmount[];
  onClose: () => void;
}

function toneColor(tone: ReportSummaryStat['tone']): string {
  switch (tone) {
    case 'success':
      return Colors.success;
    case 'warning':
      return Colors.warning;
    case 'danger':
      return Colors.danger;
    default:
      return Colors.text;
  }
}

export function ReportSummaryModal({
  visible,
  title,
  stats,
  amounts,
  onClose,
}: ReportSummaryModalProps) {
  return (
    <Modal visible={visible} onClose={onClose} title={title} fitContent>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statTile}>
              <Text style={[styles.statValue, { color: toneColor(stat.tone) }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {amounts.length > 0 ? (
          <View style={styles.amountCard}>
            {amounts.map((amount, index) => (
              <View
                key={amount.label}
                style={[styles.amountRow, index > 0 && styles.amountRowBorder]}
              >
                <Text style={styles.amountLabel}>{amount.label}</Text>
                <Text style={[styles.amountValue, amount.accent && styles.amountAccent]}>
                  {amount.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.title3,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  amountCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  amountRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  amountLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    flex: 1,
  },
  amountValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  amountAccent: {
    color: Colors.text,
  },
});

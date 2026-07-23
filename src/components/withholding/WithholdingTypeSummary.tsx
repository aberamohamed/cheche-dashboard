import { WithholdingSummaryCard } from '@/components/withholding/WithholdingSummaryCard';
import { Brand } from '@/constants/theme';
import type { WithholdingRecord } from '@/types';
import { isVatWithholdingRecord } from '@/utils/withholdingType';
import { endOfDay, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns';
import { Shield } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

interface WithholdingTypeSummaryProps {
  counts: { withheld: number; vatWithheld: number };
  records?: WithholdingRecord[];
}

function buildCountTrend(
  records: WithholdingRecord[],
  predicate: (record: WithholdingRecord) => boolean
): number[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = subDays(now, 6 - index);
    const interval = { start: startOfDay(day), end: endOfDay(day) };
    return records.filter((record) => {
      if (!predicate(record)) return false;
      const date = parseISO(record.createdAt);
      return isWithinInterval(date, interval);
    }).length;
  });
}

export function WithholdingTypeSummary({ counts, records = [] }: WithholdingTypeSummaryProps) {
  const withheldTrend = buildCountTrend(records, (record) => !isVatWithholdingRecord(record));
  const vatTrend = buildCountTrend(records, isVatWithholdingRecord);

  return (
    <View style={styles.row}>
      <View style={styles.cardWrap}>
        <WithholdingSummaryCard
          label="Withheld"
          value={counts.withheld}
          sublabel="Count"
          tag="TAX"
          trendData={withheldTrend}
          icon={<Shield size={16} color={Brand.primary} />}
        />
      </View>
      <View style={styles.cardWrap}>
        <WithholdingSummaryCard
          label="VAT Withheld"
          value={counts.vatWithheld}
          sublabel="Count"
          tag="VAT"
          trendData={vatTrend}
          icon={<Shield size={16} color={Brand.primary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  cardWrap: {
    flex: 1,
    minWidth: 0,
  },
});

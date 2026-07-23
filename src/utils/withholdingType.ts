import type { WithholdingRecord } from '@/types';

export interface WithholdingTypeCounts {
  withheld: number;
  vatWithheld: number;
}

export function isVatWithholdingRecord(record: WithholdingRecord): boolean {
  const type = (record.withholdType ?? '').toLowerCase();
  return type.includes('vat');
}

/** Counts from loaded receipts; replace with API summary when available. */
export function computeWithholdingTypeCounts(
  records: WithholdingRecord[]
): WithholdingTypeCounts {
  let withheld = 0;
  let vatWithheld = 0;

  for (const record of records) {
    if (isVatWithholdingRecord(record)) {
      vatWithheld += 1;
    } else {
      withheld += 1;
    }
  }

  return { withheld, vatWithheld };
}

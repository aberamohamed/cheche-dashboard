import type { MemoLineItem, MemoLineTotals, MemoTaxSummary, MemoType } from '@/types/invoiceAdjustment';

function roundMoney(value: number): number {
  return Math.round(Number(value) * 100) / 100;
}

export function resolveMemoDiscount(item: MemoLineItem): number {
  const originalGross = item.original_qty * item.original_price;
  const currentGross = item.qty * item.unit_price;

  if (
    item.original_qty > 0 &&
    item.original_price > 0 &&
    item.original_discount > 0 &&
    originalGross > 0 &&
    currentGross > 0
  ) {
    return roundMoney((currentGross / originalGross) * item.original_discount);
  }

  return roundMoney(item.discount);
}

function scaleReferenceAmount(
  item: MemoLineItem,
  referenceAmount: number,
  discount: number
): number {
  const originalNet =
    item.original_qty * item.original_price - item.original_discount;
  const currentNet = item.qty * item.unit_price - discount;

  if (originalNet <= 0 || currentNet <= 0) return 0;
  return roundMoney((currentNet / originalNet) * referenceAmount);
}

export function computeMemoLineTotals(item: MemoLineItem): MemoLineTotals {
  const qty = Number(item.qty) || 0;
  const unitPrice = Number(item.unit_price) || 0;

  if (qty <= 0 || unitPrice <= 0) {
    return { base: 0, excise: 0, vat: 0, total: 0 };
  }

  const discount = resolveMemoDiscount(item);
  const base = roundMoney(qty * unitPrice - discount);
  const excise = scaleReferenceAmount(item, item.reference_excise, discount);
  const vat = scaleReferenceAmount(item, item.reference_tax, discount);

  return {
    base,
    excise,
    vat,
    total: roundMoney(base + excise + vat),
  };
}

export function computeMemoTaxSummary(items: MemoLineItem[]): MemoTaxSummary {
  let grossSubtotal = 0;
  let discount = 0;
  let excise = 0;
  let taxableTotal = 0;
  let vat = 0;

  for (const item of items) {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    if (qty <= 0 || unitPrice <= 0) continue;

    const lineDiscount = resolveMemoDiscount(item);
    const lineGross = qty * unitPrice;
    const totals = computeMemoLineTotals(item);

    grossSubtotal += lineGross;
    discount += lineDiscount;
    excise += totals.excise;
    vat += totals.vat;

    const taxCode = String(item.tax_code ?? '').toUpperCase();
    if (taxCode === 'VAT15') {
      taxableTotal += totals.base;
    }
  }

  return {
    grossSubtotal: roundMoney(grossSubtotal),
    discount: roundMoney(discount),
    excise: roundMoney(excise),
    taxableTotal: roundMoney(taxableTotal),
    vat: roundMoney(vat),
    grandTotal: roundMoney(grossSubtotal - discount + excise + vat),
  };
}

export function validateMemoForm(
  reason: string,
  items: MemoLineItem[],
  memoType?: MemoType
): string | null {
  if (reason.trim().length < 3) {
    return 'Adjustment reason must be at least 3 characters.';
  }

  const validItems = items.filter((item) => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return qty > 0 && unitPrice > 0;
  });

  if (validItems.length === 0) {
    return 'Add at least one line item.';
  }

  if (memoType === 'DEB') {
    const hasValidDebitLine = validItems.some((item) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = roundMoney(Number(item.unit_price) || 0);
      const originalQty = Number(item.original_qty) || 0;
      const originalPrice = roundMoney(Number(item.original_price) || 0);
      return qty >= originalQty && unitPrice >= originalPrice;
    });

    if (!hasValidDebitLine) {
      return 'Debit note lines must be at or above the original quantity and price.';
    }
  }

  return null;
}

export function hasMemoLineChanges(
  items: MemoLineItem[],
  initialItemIds: string[]
): boolean {
  if (items.length !== initialItemIds.length) return true;

  const initialIdSet = new Set(initialItemIds);
  for (const item of items) {
    if (!initialIdSet.has(item.id)) return true;

    const qty = Number(item.qty) || 0;
    const unitPrice = roundMoney(Number(item.unit_price) || 0);
    const originalQty = Number(item.original_qty) || 0;
    const originalPrice = roundMoney(Number(item.original_price) || 0);

    if (qty !== originalQty || unitPrice !== originalPrice) return true;
  }

  return false;
}

export function parseMemoQtyInput(
  value: string,
  item: MemoLineItem,
  memoType: MemoType
): number {
  let qty = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(qty)) qty = 0;

  const originalQty = Number(item.original_qty) || 0;
  if (memoType === 'DEB') {
    return Math.max(0, Math.max(qty, originalQty));
  }

  return Math.max(0, Math.min(qty, originalQty));
}

export function parseMemoPriceInput(
  value: string,
  item: MemoLineItem,
  memoType: MemoType
): number {
  let unitPrice = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(unitPrice)) unitPrice = 0;

  const originalPrice = roundMoney(Number(item.original_price) || 0);
  if (memoType === 'DEB') {
    return Math.max(0, Math.max(roundMoney(unitPrice), originalPrice));
  }

  return Math.max(0, Math.min(roundMoney(unitPrice), originalPrice));
}

export function canDecreaseMemoQty(item: MemoLineItem, memoType: MemoType): boolean {
  if (memoType === 'DEB') return false;
  return (Number(item.qty) || 0) > 0;
}

export function canIncreaseMemoQty(item: MemoLineItem, memoType: MemoType): boolean {
  const qty = Number(item.qty) || 0;
  const originalQty = Number(item.original_qty) || 0;
  if (memoType === 'CRE') return qty < originalQty;
  return true;
}

export function canDecreaseMemoPrice(item: MemoLineItem, memoType: MemoType): boolean {
  if (memoType === 'DEB') return false;
  return (Number(item.unit_price) || 0) > 0;
}

export function canIncreaseMemoPrice(item: MemoLineItem, memoType: MemoType): boolean {
  const unitPrice = roundMoney(Number(item.unit_price) || 0);
  const originalPrice = roundMoney(Number(item.original_price) || 0);
  if (memoType === 'CRE') return unitPrice < originalPrice;
  return true;
}

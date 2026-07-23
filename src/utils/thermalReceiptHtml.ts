import type { ThermalReceiptStrings } from '@/i18n/thermalReceipt';
import {
  getThermalReceiptStrings,
  resolveReceiptPaymentLabel,
} from '@/i18n/thermalReceipt';
import { resolveLanguageId } from '@/data/languages';
import type { Business, User } from '@/types';
import type { ReceiptData } from '@/types/receipt';
import { buildReceiptQrSvgForPrint } from '@/utils/thermalReceiptQr';
import { format, parseISO } from 'date-fns';

export type BuildThermalReceiptHtmlOptions = {
  variant?: ThermalReceiptHtmlVariant;
  qrSvg?: string;
  strings?: ThermalReceiptStrings;
  languageId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getCompanyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Matches 58mm thermal width in preview and Bluetooth ESC/POS output. */
export const THERMAL_LINE_WIDTH = 32;

export const THERMAL_DASHED_LINE = '-'.repeat(THERMAL_LINE_WIDTH);
export const THERMAL_SOLID_LINE = '='.repeat(THERMAL_LINE_WIDTH);

/**
 * On-screen preview (WebView) and Ge'ez bitmap print — full-width body.
 * Also rasterized at 384px for Amharic/Tigrinya bitmap printing, so these
 * sizes directly control how large Ge'ez text prints on 58mm paper.
 */
export const THERMAL_RECEIPT_PREVIEW_STYLE = {
  bodyFontPx: 18,
  bodyLineHeight: 1.25,
  bodyPaddingTopPx: 18,
  bodyPaddingBottomPx: 28,
  bodyPaddingHorizontalPx: 12,
  addressFontPx: 16,
  fsDateFontPx: 15,
  bannerFontPx: 16,
  metaFontPx: 17,
  ruleFontPx: 18,
  itemFontPx: 16,
  subtotalFontPx: 18,
  taxFontPx: 16,
  totalFontPx: 26,
  paymentFontPx: 18,
  qrSizePx: 200,
  qtyColPx: 30,
  priceColPx: 84,
  amountColPx: 100,
  blockGapPx: 8,
  rowGapPx: 4,
  qrMarginTopPx: 16,
  footerMarginTopPx: 14,
  printBottomSafePx: 0,
} as const;

/** Printable output (thermal PDF + Bluetooth) — smaller type and tight spacing. */
export const THERMAL_RECEIPT_PRINT_STYLE = {
  ...THERMAL_RECEIPT_PREVIEW_STYLE,
  bodyFontPx: 7,
  bodyLineHeight: 1,
  bodyPaddingTopPx: 0,
  bodyPaddingBottomPx: 28,
  bodyPaddingHorizontalPx: 2,
  addressFontPx: 6,
  fsDateFontPx: 6,
  bannerFontPx: 7,
  /** Regular key/value rows (not TOTAL). */
  kvFontPx: 5,
  metaFontPx: 5,
  ruleFontPx: 6,
  itemFontPx: 5,
  subtotalFontPx: 5,
  taxFontPx: 5,
  totalFontPx: 11,
  paymentFontPx: 5,
  qrSizePx: 156,
  qtyColPx: 18,
  priceColPx: 48,
  amountColPx: 58,
  /** Extra blank space so the last lines (CASH) are not cut off by the cutter. */
  printBottomSafePx: 72,
  blockGapPx: 0,
  rowGapPx: 0,
  qrMarginTopPx: 2,
  footerMarginTopPx: 4,
  printLineSpaceDots: 12,
  /** Font B is narrower — ~42 chars fill a 58mm roll (Font A needs 32). */
  printKvFontType: 1,
  printKvHeightTimes: 0,
  printLineWidthChars: 42,
  /** Tighter line spacing under Item/Qty/Price/Total header row. */
  printItemHeaderLineSpaceDots: 8,
  printTotalHeightTimes: 1,
  printFeedLinesStart: 0,
  printFeedBeforeQrLines: 2,
  printFeedAfterQrLines: 2,
  printFeedLinesEnd: 8,
  printBottomFeedLines: 28,
  /** Extra feed after Powered By footer so it is not cut off. */
  printAfterFooterFeedLines: 14,
  printQrPixelSize: 280,
  printQrWidthDots: 160,
} as const;

export type ThermalReceiptHtmlVariant = 'preview' | 'print';

function thermalLayoutStyle(variant: ThermalReceiptHtmlVariant) {
  return variant === 'print' ? THERMAL_RECEIPT_PRINT_STYLE : THERMAL_RECEIPT_PREVIEW_STYLE;
}

/** @deprecated Use THERMAL_RECEIPT_PREVIEW_STYLE or THERMAL_RECEIPT_PRINT_STYLE */
export const THERMAL_RECEIPT_STYLE = THERMAL_RECEIPT_PREVIEW_STYLE;

export function formatReceiptStarAmount(amount: number): string {
  return `*${formatReceiptAmount(amount)}`;
}

/** Two decimal places (e.g. 2000.00) for all receipt amounts. */
export function formatReceiptAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** @deprecated Use formatReceiptAmount — prices use 2 decimals on receipts. */
export function formatReceiptPrice(amount: number): string {
  return formatReceiptAmount(amount);
}

export function formatReceiptDate(createdAt: string): string {
  try {
    return format(parseISO(createdAt), 'dd/MM/yyyy');
  } catch {
    return createdAt;
  }
}

export function formatReceiptTime(createdAt: string): string {
  try {
    return format(parseISO(createdAt), 'HH:mm');
  } catch {
    return '';
  }
}

export function buildSectionBannerText(label: string): string {
  const text = ` ${label.toUpperCase()} `;
  const fillTotal = Math.max(4, THERMAL_LINE_WIDTH - text.length);
  const left = Math.floor(fillTotal / 2);
  const right = fillTotal - left;
  return `${'='.repeat(left)}${text}${'='.repeat(right)}`;
}

function renderSectionBanner(label: string): string {
  return `<div class="section-banner">${escapeHtml(buildSectionBannerText(label))}</div>`;
}

/**
 * Full-width variants overdraw the 32-char rule and rely on `overflow: hidden`
 * so the line always spans the body regardless of screen width.
 */
function ruleText(base: string, fullWidth: boolean): string {
  return fullWidth ? base.repeat(3) : base;
}

function renderDashedLine(fullWidth = false): string {
  return `<div class="line-dashed">${escapeHtml(ruleText(THERMAL_DASHED_LINE, fullWidth))}</div>`;
}

function renderItemsHeaderRule(fullWidth = false): string {
  return `<div class="line-dashed items-header-rule">${escapeHtml(ruleText(THERMAL_DASHED_LINE, fullWidth))}</div>`;
}

function renderSolidLine(fullWidth = false): string {
  return `<div class="line-solid">${escapeHtml(ruleText(THERMAL_SOLID_LINE, fullWidth))}</div>`;
}

function renderAmountRow(label: string, amount: number, className = 'amount-row'): string {
  return `
    <div class="${className}">
      <span class="amount-label">${escapeHtml(label)}</span>
      <span class="amount-value">${escapeHtml(formatReceiptStarAmount(amount))}</span>
    </div>`;
}

function renderMetaLine(label: string, value: string): string {
  return `
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(label)}</span>
      <span class="meta-value">${escapeHtml(value)}</span>
    </div>`;
}

function renderAddressBlock(
  data: ReceiptData,
  companyName: string,
  strings: ThermalReceiptStrings
): string {
  const lines: string[] = [];
  if (companyName) {
    lines.push(companyName.toUpperCase());
  }
  const address = data.businessAddress?.trim();
  if (address) {
    address
      .split(/[,\n]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => lines.push(part.toUpperCase()));
  } else {
    lines.push(strings.addressNotProvided.toUpperCase());
  }
  const phone = data.businessPhone?.trim();
  if (phone) {
    lines.push(`TEL - ${phone}`);
  }
  return lines.map((line) => `<div class="address-line">${escapeHtml(line)}</div>`).join('');
}

function resolveIrnDisplay(data: ReceiptData): string {
  const irn = data.irn?.trim();
  if (irn) return irn;
  return '--------';
}

function renderItemsTable(
  data: ReceiptData,
  strings: ThermalReceiptStrings,
  fullWidth = false
): string {
  if (!data.items.length) return '';

  const rows = data.items
    .map((item) => {
      const unitPrice = item.product.sellingPrice;
      const lineTotal = unitPrice * item.quantity;
      return `
        <div class="item-row">
          <span class="col-desc">${escapeHtml(item.product.name)}</span>
          <span class="col-nums">
            <span class="col-qty">${item.quantity}</span>
            <span class="col-price">${formatReceiptPrice(unitPrice)}</span>
            <span class="col-amount">${escapeHtml(formatReceiptStarAmount(lineTotal))}</span>
          </span>
        </div>`;
    })
    .join('');

  return `
    <div class="items-table">
      <div class="items-header-row">
        <span class="col-desc">${escapeHtml(strings.colItem)}</span>
        <span class="col-nums">
          <span class="col-qty">${escapeHtml(strings.colQty)}</span>
          <span class="col-price">${escapeHtml(strings.colPrice)}</span>
          <span class="col-amount">${escapeHtml(strings.colTotal)}</span>
        </span>
      </div>
      ${renderItemsHeaderRule(fullWidth)}
      ${rows}
    </div>`;
}

function resolveTaxableBase(data: ReceiptData): number {
  return Math.max(0, data.subtotal - data.discount);
}

function resolvePrimaryTaxLabel(
  strings: ThermalReceiptStrings,
  vatAmount: number,
  taxableBase: number
): string {
  if (vatAmount <= 0) return strings.tax1;
  if (taxableBase > 0) {
    const rate = Math.round((vatAmount / taxableBase) * 100);
    if (rate > 0) return strings.tax1Percent(rate);
  }
  return strings.tax1Percent(15);
}

function renderCustomerMeta(data: ReceiptData, strings: ThermalReceiptStrings): string {
  const name = data.customerName?.trim();
  const phone = data.customerPhone?.trim();
  if (name) return renderMetaLine(strings.customer, name);
  const customerLine = renderMetaLine(strings.customer, strings.customerEmpty);
  if (phone) return `${customerLine}${renderMetaLine(strings.phone, phone)}`;
  return customerLine;
}

export function enrichReceiptWithOrganization(
  data: ReceiptData,
  business: Business | null,
  user: User | null
): ReceiptData {
  return {
    ...data,
    businessName: data.businessName ?? business?.name,
    businessLogo: data.businessLogo ?? business?.logo,
    businessAddress: data.businessAddress ?? business?.address,
    businessPhone: data.businessPhone ?? business?.phone,
    operatorName: data.operatorName ?? user?.fullName,
  };
}

export function buildThermalReceiptHtml(
  data: ReceiptData,
  options?: BuildThermalReceiptHtmlOptions
): string {
  const variant = options?.variant ?? 'preview';
  const qrSvg = options?.qrSvg?.trim();
  const languageId = options?.languageId ?? 'en';
  const tr = options?.strings ?? getThermalReceiptStrings(languageId);
  const isGeez = (() => {
    const id = resolveLanguageId(languageId);
    return id === 'am' || id === 'ti';
  })();
  const fontFamily = isGeez
    ? '"Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", "Courier New", Courier, monospace'
    : '"Courier New", Courier, monospace';
  const companyName = data.businessName?.trim() || 'Cheche POS';
  const reference = data.invoiceNumber?.trim() || '----';
  const vatAmount = data.vatAmount ?? 0;
  const otherTaxAmount = data.otherTaxAmount ?? 0;
  const taxAmount =
    data.taxAmount ??
    (vatAmount + otherTaxAmount > 0
      ? vatAmount + otherTaxAmount
      : Math.max(0, data.total - data.subtotal + data.discount));
  const dateStr = formatReceiptDate(data.createdAt);
  const timeStr = formatReceiptTime(data.createdAt);
  const irnDisplay = resolveIrnDisplay(data);
  const taxableBase = resolveTaxableBase(data);
  const serviceCharge = data.serviceChargeAmount ?? 0;
  const subtotalAfterItems = data.subtotal;
  const paymentLabel = resolveReceiptPaymentLabel(data.paymentMethod, languageId).toUpperCase();
  const paymentAmount = data.receivedAmount ?? data.total;
  const fullWidthRules = variant !== 'print';
  const itemsTable = renderItemsTable(data, tr, fullWidthRules);
  const primaryTax = vatAmount > 0 ? vatAmount : otherTaxAmount > 0 ? otherTaxAmount : taxAmount;
  const taxLabel = resolvePrimaryTaxLabel(tr, primaryTax, taxableBase);

  const discountMeta =
    data.discount > 0 ? renderAmountRow(tr.discount, -data.discount, 'tax-row') : '';

  const serviceChargeRow =
    serviceCharge > 0 ? renderAmountRow(tr.serviceCharge, serviceCharge, 'service-row') : '';

  const changeRow =
    data.changeAmount != null && data.changeAmount > 0
      ? renderAmountRow(tr.change, data.changeAmount, 'amount-row')
      : '';

  const qrMarkup = qrSvg ? `<div class="qr-wrap">${qrSvg}</div>` : '';
  const footerMarkup = `
    <div class="footer-powered">
      <span class="footer-label">${escapeHtml(tr.poweredBy)}</span>
      <span class="footer-brand">${escapeHtml(tr.brandName)}</span>
    </div>`;
  const invoiceBannerText = tr.invoiceBanner(
    resolveReceiptPaymentLabel(data.paymentMethod, languageId)
  );

  const s = thermalLayoutStyle(variant);
  const g = s.blockGapPx;
  const r = s.rowGapPx;
  const isPrint = variant === 'print';
  const kvWeight = isPrint ? 400 : 700;
  const metaFontPx =
    isPrint && 'kvFontPx' in s ? (s as typeof THERMAL_RECEIPT_PRINT_STYLE).kvFontPx : s.metaFontPx;
  // Preview fills its container (full-screen WebView / 384px bitmap capture);
  // print keeps the physical 58mm roll width for the PDF.
  const bodyWidth = isPrint ? '58mm' : '100%';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Receipt typography (px @ 58mm): body ${s.bodyFontPx}, items ${s.itemFontPx}, subtotal ${s.subtotalFontPx}, total ${s.totalFontPx}, payment ${s.paymentFontPx}, qr ${s.qrSizePx} -->
    <style>
      @page { margin: 0; size: 58mm auto; }
      * { box-sizing: border-box; }
      body {
        width: ${bodyWidth};
        max-width: ${bodyWidth};
        margin: 0 auto;
        padding: ${s.bodyPaddingTopPx}px ${s.bodyPaddingHorizontalPx}px ${s.bodyPaddingBottomPx}px;
        font-family: ${fontFamily};
        font-size: ${s.bodyFontPx}px;
        line-height: ${s.bodyLineHeight};
        color: #000;
        background: #fff;
      }
      .address-block {
        text-align: center;
        margin: 0;
      }
      .address-line {
        font-size: ${s.addressFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
        margin: 0;
        text-transform: uppercase;
      }
      .fs-date-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 4px;
        font-size: ${s.fsDateFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
        margin: ${g}px 0;
      }
      .receipt-datetime {
        text-align: center;
        font-size: ${s.fsDateFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
        margin: ${r}px 0 ${g}px;
      }
      .fs-date {
        text-align: right;
        white-space: nowrap;
      }
      .section-banner {
        text-align: center;
        font-size: ${s.bannerFontPx}px;
        font-weight: 700;
        letter-spacing: 0.1px;
        margin: ${g}px 0;
        white-space: nowrap;
        overflow: hidden;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 6px;
        font-size: ${metaFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
        margin: ${r}px 0;
      }
      .meta-label {
        flex-shrink: 0;
      }
      .meta-value {
        flex: 1;
        min-width: 0;
        text-align: right;
        word-break: break-word;
      }
      .line-dashed,
      .line-solid {
        font-size: ${s.ruleFontPx}px;
        line-height: 1;
        margin: ${g}px 0;
        white-space: nowrap;
        overflow: hidden;
      }
      .items-table {
        margin: ${g}px 0 0;
      }
      .items-table .items-header-row {
        margin-bottom: 0;
      }
      .items-table .items-header-rule {
        margin: 0;
        line-height: 1;
      }
      .items-table .item-row:first-of-type {
        margin-top: 0;
      }
      .items-header-row,
      .item-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        font-size: ${s.itemFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
        width: 100%;
      }
      .items-header-row {
        font-weight: ${kvWeight};
        margin-bottom: 0;
        text-transform: none;
      }
      .item-row {
        margin: ${r}px 0;
      }
      .col-desc {
        flex: 1;
        min-width: 0;
        padding-right: 4px;
        word-break: break-word;
        text-align: left;
      }
      .col-nums {
        display: flex;
        flex-shrink: 0;
        align-items: baseline;
        margin-left: auto;
      }
      .col-qty {
        width: ${s.qtyColPx}px;
        text-align: right;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .col-price {
        width: ${s.priceColPx}px;
        text-align: right;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .col-amount {
        width: ${s.amountColPx}px;
        text-align: right;
        font-weight: ${kvWeight};
        flex-shrink: 0;
        text-transform: none;
        white-space: nowrap;
      }
      .amount-row,
      .tax-row,
      .service-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 4px;
        margin: ${r}px 0;
        line-height: ${s.bodyLineHeight};
      }
      .subtotal-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 4px;
        margin: ${g}px 0 ${r}px;
        font-size: ${s.subtotalFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
      }
      .service-row {
        font-size: ${s.taxFontPx}px;
      }
      .tax-row {
        font-size: ${s.taxFontPx}px;
      }
      .amount-label,
      .amount-value {
        font-weight: ${kvWeight};
      }
      .amount-value {
        text-align: right;
        white-space: nowrap;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 4px;
        margin: ${g}px 0 ${r}px;
        font-size: ${s.totalFontPx}px;
        font-weight: 800;
        line-height: 1.05;
        text-transform: uppercase;
      }
      .payment-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 4px;
        margin: ${r}px 0;
        font-size: ${s.paymentFontPx}px;
        font-weight: ${kvWeight};
        line-height: ${s.bodyLineHeight};
        text-transform: uppercase;
      }
      .qr-wrap {
        margin-top: ${s.qrMarginTopPx}px;
        text-align: center;
      }
      .qr-svg {
        width: ${s.qrSizePx}px;
        height: ${s.qrSizePx}px;
        display: block;
        margin: 0 auto;
      }
      .footer-powered {
        display: flex;
        justify-content: center;
        align-items: baseline;
        gap: 4px;
        margin-top: ${s.footerMarginTopPx}px;
        text-align: center;
      }
      .footer-label {
        font-size: ${s.fsDateFontPx}px;
        font-weight: ${kvWeight};
      }
      .footer-brand {
        font-size: ${s.metaFontPx}px;
        font-weight: 700;
        letter-spacing: 0.3px;
        text-transform: uppercase;
      }
      .print-bottom-safe {
        height: ${s.printBottomSafePx}px;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div class="address-block">
      ${renderAddressBlock(data, companyName, tr)}
      <div class="receipt-datetime">${escapeHtml(dateStr)} ${escapeHtml(timeStr)}</div>
    </div>

    <div class="fs-date-row">
      <span class="fs-no">${escapeHtml(tr.irnPrefix)} ${escapeHtml(irnDisplay)}</span>
    </div>

    ${renderSectionBanner(invoiceBannerText)}

    ${renderMetaLine(tr.invoice, reference)}
    ${data.operatorName ? renderMetaLine(tr.operator, data.operatorName) : ''}
    ${renderCustomerMeta(data, tr)}

    ${itemsTable}

    ${renderAmountRow(tr.subtotal, subtotalAfterItems, 'subtotal-row')}
    ${serviceChargeRow}
    ${discountMeta}

    ${renderDashedLine(fullWidthRules)}

    ${primaryTax > 0 ? renderAmountRow(tr.txbl1, taxableBase, 'tax-row') : ''}
    ${primaryTax > 0 ? renderAmountRow(taxLabel, primaryTax, 'tax-row') : ''}

    ${renderSolidLine(fullWidthRules)}

    <div class="total-row">
      <span class="amount-label">${escapeHtml(tr.total)}</span>
      <span class="amount-value">${escapeHtml(formatReceiptStarAmount(data.total))}</span>
    </div>

    ${renderDashedLine(fullWidthRules)}

    <div class="payment-row">
      <span class="amount-label">${escapeHtml(paymentLabel)}</span>
      <span class="amount-value">${escapeHtml(formatReceiptStarAmount(paymentAmount))}</span>
    </div>
    ${changeRow}

    ${qrMarkup}
    ${footerMarkup}
    ${s.printBottomSafePx > 0 ? '<div class="print-bottom-safe"></div>' : ''}
  </body>
</html>`;
}

export async function buildThermalReceiptHtmlAsync(
  data: ReceiptData,
  options?: BuildThermalReceiptHtmlOptions
): Promise<string> {
  const languageId = options?.languageId ?? 'en';
  const strings = options?.strings ?? getThermalReceiptStrings(languageId);
  const merged = { ...options, strings, languageId };
  try {
    const qrSvg = await buildReceiptQrSvgForPrint(data);
    return buildThermalReceiptHtml(data, { ...merged, ...(qrSvg ? { qrSvg } : {}) });
  } catch {
    return buildThermalReceiptHtml(data, merged);
  }
}

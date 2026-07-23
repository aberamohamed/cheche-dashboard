/**
 * bluetoothPrinterService.ts
 *
 * Direct Bluetooth ESC/POS printing service.
 * Uses @vardrz/react-native-bluetooth-escpos-printer (maintained fork) to
 * communicate with Bluetooth thermal receipt printers without opening the
 * system print dialog.
 *
 * Flow:
 *   1. Ensure Bluetooth is enabled
 *   2. Connect to a saved/chosen printer address
 *   3. Send ESC/POS commands directly
 *   4. Printer prints immediately — no dialog
 */

// Side-effect import: registers the native module under NativeModules
import '@vardrz/react-native-bluetooth-escpos-printer';
import { NativeModules, PermissionsAndroid, Platform, DeviceEventEmitter } from 'react-native';
import type { ReceiptData } from '@/types/receipt';
import {
  getThermalReceiptStrings,
  resolveReceiptPaymentLabel,
  type ThermalReceiptStrings,
} from '@/i18n/thermalReceipt';
import {
  buildSectionBannerText,
  formatReceiptDate,
  formatReceiptPrice,
  formatReceiptStarAmount,
  formatReceiptTime,
  THERMAL_DASHED_LINE,
  THERMAL_RECEIPT_PRINT_STYLE,
  THERMAL_SOLID_LINE,
} from '@/utils/thermalReceiptHtml';
import { buildReceiptQrTaxDocumentUrl } from '@/utils/thermalReceiptQr';

const { BluetoothManager, BluetoothEscposPrinter } = NativeModules;

function qrErrorCorrectionLevel(): number {
  const levels = BluetoothEscposPrinter?.ERROR_CORRECTION as { L?: number } | undefined;
  return levels?.L ?? 1;
}

async function printReceiptQr(data: ReceiptData): Promise<void> {
  const payload = buildReceiptQrTaxDocumentUrl(data);
  if (!payload) return;
  const correction = qrErrorCorrectionLevel();
  const sizes = [
    THERMAL_RECEIPT_PRINT_STYLE.printQrPixelSize,
    200,
    160,
  ];
  await BluetoothEscposPrinter.printerAlign(CENTER);
  let lastError: unknown;
  for (const size of sizes) {
    try {
      await BluetoothEscposPrinter.printQRCode(payload, size, correction);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function printPoweredByFooter(tr: ThermalReceiptStrings): Promise<void> {
  await BluetoothEscposPrinter.printerAlign(CENTER);
  await setBold(false);
  await BluetoothEscposPrinter.printText(`${esc(tr.poweredBy)} `, {
    fonttype: FONT_NORMAL,
  });
  await setBold(true);
  await BluetoothEscposPrinter.printText(`${esc(tr.brandName)}\n`, {
    fonttype: FONT_NORMAL,
  });
  await setBold(false);
}

function printKvTextOptions() {
  return {
    widthtimes: 0,
    heigthtimes: THERMAL_RECEIPT_PRINT_STYLE.printKvHeightTimes,
    fonttype: THERMAL_RECEIPT_PRINT_STYLE.printKvFontType,
  };
}

function printLineWidth(): number {
  return THERMAL_RECEIPT_PRINT_STYLE.printLineWidthChars;
}

/** Smaller, non-bold key/value rows (print layout — TOTAL uses printTotalRow). */
async function printKeyValueRow(label: string, value: string): Promise<void> {
  const escapedLabel = esc(label);
  const escapedValue = esc(value);
  const opts = printKvTextOptions();
  const width = printLineWidth();
  const valueCol = Math.min(14, Math.max(10, Math.floor(width * 0.33)));
  const labelCol = width - valueCol;

  if (escapedValue.length > valueCol) {
    await setBold(false);
    await BluetoothEscposPrinter.printText(`${escapedLabel}\n`, opts);
    await BluetoothEscposPrinter.printText(`${padStart(escapedValue, width)}\n`, opts);
    return;
  }

  await setBold(false);
  await BluetoothEscposPrinter.printText(padEnd(escapedLabel, labelCol), opts);
  await BluetoothEscposPrinter.printText(`${padStart(escapedValue, valueCol)}\n`, opts);
}

export interface BluetoothDevice {
  name: string;
  address: string;
}

// ─── Permissions ───────────────────────────────────────────────────────────────

/**
 * Requests the runtime permissions the native module needs to see paired/
 * discoverable devices. Declaring these in the manifest is not enough —
 * BLUETOOTH_SCAN/BLUETOOTH_CONNECT (Android 12+) and ACCESS_FINE_LOCATION
 * (Android <12, required for classic Bluetooth discovery) are "dangerous"
 * permissions the user must grant at runtime, or getBondedDevices()/
 * startDiscovery() silently throw and no devices are ever returned.
 */
export async function ensureBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

// ─── Connection ────────────────────────────────────────────────────────────────

export async function isBluetoothEnabled(): Promise<boolean> {
  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();
    return enabled === true || enabled === 'true';
  } catch {
    return false;
  }
}

/** Android only — resolves with paired device list */
export async function enableBluetooth(): Promise<BluetoothDevice[]> {
  if (Platform.OS !== 'android') return [];
  try {
    const rawList: string[] = await BluetoothManager.enableBluetooth();
    return parseDeviceList(rawList);
  } catch {
    return [];
  }
}

export async function scanDevices(): Promise<{ paired: BluetoothDevice[]; found: BluetoothDevice[] }> {
  return new Promise((resolve, reject) => {
    const result: { paired: BluetoothDevice[]; found: BluetoothDevice[] } = {
      paired: [],
      found: [],
    };

    const pairedSub = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
      (rsp: { devices: string }) => {
        try {
          const list = JSON.parse(rsp.devices) as BluetoothDevice[];
          result.paired = list;
        } catch {}
      }
    );

    const foundSub = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_FOUND,
      (rsp: { devices: string }) => {
        try {
          const device = JSON.parse(rsp.devices) as BluetoothDevice;
          result.found.push(device);
        } catch {}
      }
    );

    const doneSub = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_DISCOVER_DONE,
      () => {
        pairedSub.remove();
        foundSub.remove();
        doneSub.remove();
        resolve(result);
      }
    );

    BluetoothManager.scanDevices().catch((err: unknown) => {
      pairedSub.remove();
      foundSub.remove();
      doneSub.remove();
      reject(err);
    });
  });
}

export async function connectToPrinter(address: string): Promise<void> {
  await BluetoothManager.connect(address);
}

// ─── ESC/POS Direct Printing ───────────────────────────────────────────────────

const LINE_TEXT = THERMAL_DASHED_LINE;
const SOLID_LINE_TEXT = THERMAL_SOLID_LINE;
const CENTER = 1;
const LEFT = 0;
const RIGHT = 2;

function esc(text: string): string {
  // Normalize all Unicode whitespace (Intl.NumberFormat inserts a
  // non-breaking space between currency code and amount, e.g. "ETB 1,234.00")
  // to a plain space before stripping non-ASCII, otherwise it prints as "?".
  return text.replace(/\s/g, ' ').replace(/[^\x00-\x7F]/g, '?');
}

function padEnd(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function padStart(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : ' '.repeat(len - str.length) + str;
}

async function setBold(on: boolean): Promise<void> {
  await BluetoothEscposPrinter.setBlob(on ? 1 : 0);
}

async function printLine(text = ''): Promise<void> {
  await BluetoothEscposPrinter.printText(`${esc(text)}\n`, { fonttype: 0 });
}

const FONT_NORMAL = 0;

/** Plain line — used for row labels/keys. Same font as the value (see printRow doc). */
async function printLabelLine(text: string): Promise<void> {
  await BluetoothEscposPrinter.printText(`${esc(text)}\n`, { fonttype: FONT_NORMAL });
}

/** Bold line — used for row values. */
async function printValueLine(text: string): Promise<void> {
  await setBold(true);
  await BluetoothEscposPrinter.printText(`${esc(text)}\n`, { fonttype: FONT_NORMAL });
  await setBold(false);
}

/**
 * Label/value row. The label prints plain, the value bold — both in the
 * SAME font. Mixing fonts (e.g. a narrower font for the label) breaks the
 * character-count-equals-dot-width assumption padEnd/padStart rely on, which
 * left a gap at the right margin instead of the value sitting flush right.
 * Values that don't fit the 12-char right column (e.g. a long customer name)
 * are printed on their own full-width line beneath the label instead of
 * being silently truncated.
 */
async function printRow(label: string, value: string): Promise<void> {
  await printKeyValueRow(label, value);
}

/**
 * Headline "Total" row — bold on BOTH label and value, height stepped up by
 * 2 (0 -> 2, i.e. triple height). Height only, not width, so the 20/12-char
 * column alignment still holds and the value still lands flush at the right
 * edge, same as every other row.
 */
async function printTotalRow(label: string, value: string): Promise<void> {
  const lbl = padEnd(esc(label), 20);
  const val = padStart(esc(value), 12);
  const heightTimes = THERMAL_RECEIPT_PRINT_STYLE.printTotalHeightTimes;
  const bigOptions = { widthtimes: 0, heigthtimes: heightTimes, fonttype: FONT_NORMAL };
  await setBold(true);
  await BluetoothEscposPrinter.printText(lbl, bigOptions);
  await BluetoothEscposPrinter.printText(`${val}\n`, bigOptions);
  await setBold(false);
}

/** Mirrors buildSectionBannerText() in thermalReceiptHtml.ts. */
async function printSectionBanner(label: string): Promise<void> {
  await setBold(true);
  await printLine(buildSectionBannerText(label));
  await setBold(false);
}

/** Key left, value right — always a single row (never wraps Invoice etc.). */
async function printMetaLine(label: string, value: string): Promise<void> {
  const width = printLineWidth();
  const opts = printKvTextOptions();
  const escapedLabel = esc(label);
  let escapedValue = esc(value);
  const gap = 1;
  const maxValueLen = Math.max(4, width - escapedLabel.length - gap);
  if (escapedValue.length > maxValueLen) {
    escapedValue = escapedValue.slice(0, maxValueLen);
  }
  const line = padEnd(escapedLabel, width - escapedValue.length) + escapedValue;
  await setBold(false);
  await BluetoothEscposPrinter.printText(`${line}\n`, opts);
}

async function printAmountRow(label: string, amount: number): Promise<void> {
  await printRow(label, formatReceiptStarAmount(amount));
}

async function printSubtotalRow(label: string, amount: number): Promise<void> {
  await printKeyValueRow(label, formatReceiptStarAmount(amount));
}

/** Qty left-aligned (gap before Price); Price + Total right-aligned to paper edge. */
const ITEM_QTY_W = 5;
const ITEM_PRICE_W = 9;
const ITEM_TOTAL_W = 11;

function itemDescWidth(): number {
  return printLineWidth() - ITEM_QTY_W - ITEM_PRICE_W - ITEM_TOTAL_W;
}

function formatItemNums(qty: string, price: string, total: string): string {
  // Left-align Qty so there is visible space before Price; keep Price/Total flush-right.
  return padEnd(qty, ITEM_QTY_W) + padStart(price, ITEM_PRICE_W) + padStart(total, ITEM_TOTAL_W);
}

async function printItemsHeader(tr: ThermalReceiptStrings): Promise<void> {
  const opts = printKvTextOptions();
  const header =
    padEnd(tr.colItem, itemDescWidth()) +
    formatItemNums(tr.colQty, tr.colPrice, tr.colTotal);
  const tightLineSpace = THERMAL_RECEIPT_PRINT_STYLE.printItemHeaderLineSpaceDots;
  await BluetoothEscposPrinter.printerLineSpace(tightLineSpace);
  await setBold(false);
  await BluetoothEscposPrinter.printText(`${esc(header)}\n`, opts);
  await BluetoothEscposPrinter.printText(`${'-'.repeat(printLineWidth())}\n`, opts);
}

async function printItemRow(
  description: string,
  qty: number,
  unitPrice: number,
  lineTotal: number
): Promise<void> {
  const nums = formatItemNums(
    String(qty),
    formatReceiptPrice(unitPrice),
    formatReceiptStarAmount(lineTotal)
  );
  const escapedDesc = esc(description);
  const opts = printKvTextOptions();
  const descW = itemDescWidth();
  const width = printLineWidth();
  await setBold(false);

  if (escapedDesc.length <= descW) {
    await BluetoothEscposPrinter.printText(`${padEnd(escapedDesc, descW)}${nums}\n`, opts);
    return;
  }

  // Long name: wrap name, then print numbers flush-right on the next line.
  await BluetoothEscposPrinter.printText(`${escapedDesc}\n`, opts);
  await BluetoothEscposPrinter.printText(`${padStart(nums, width)}\n`, opts);
}

function resolveIrnDisplay(data: ReceiptData): string {
  const irn = data.irn?.trim();
  if (irn) return irn;
  return '--------';
}

function resolveTaxableBase(data: ReceiptData): number {
  return Math.max(0, data.subtotal - data.discount);
}

function resolvePrimaryTaxLabel(
  tr: ThermalReceiptStrings,
  taxAmount: number,
  taxableBase: number
): string {
  if (taxAmount <= 0) return tr.tax1;
  if (taxableBase > 0) {
    const rate = Math.round((taxAmount / taxableBase) * 100);
    if (rate > 0) return tr.tax1Percent(rate);
  }
  return tr.tax1Percent(15);
}

async function printIrnLine(irn: string, irnPrefix: string): Promise<void> {
  await BluetoothEscposPrinter.printerAlign(LEFT);
  await printLine(`${irnPrefix} ${irn}`);
}

const QR_WIDTH_DOTS = THERMAL_RECEIPT_PRINT_STYLE.printQrWidthDots;

async function printBitmapBase64(base64: string, widthDots: number = QR_WIDTH_DOTS): Promise<boolean> {
  try {
    await BluetoothEscposPrinter.printPic(base64, {
      width: widthDots,
      left: 0,
      center: true,
      autoCut: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Prints a full receipt image (PNG base64) — used for Amharic/Tigrinya where ESC/POS
 * text cannot encode Ge'ez characters.
 */
export async function printThermalHtmlBitmap(
  pngBase64: string,
  widthDots = 384
): Promise<void> {
  await BluetoothEscposPrinter.printerInit();
  await BluetoothEscposPrinter.printAndFeed(THERMAL_RECEIPT_PRINT_STYLE.printFeedLinesStart);

  const printed = await printBitmapBase64(pngBase64, widthDots);
  if (!printed) {
    throw new Error('Failed to print receipt bitmap');
  }

  await BluetoothEscposPrinter.printAndFeed(
    THERMAL_RECEIPT_PRINT_STYLE.printAfterFooterFeedLines +
      THERMAL_RECEIPT_PRINT_STYLE.printFeedLinesEnd +
      THERMAL_RECEIPT_PRINT_STYLE.printBottomFeedLines
  );
}

/**
 * Prints the receipt ESC/POS commands directly to the connected Bluetooth printer.
 * Mirrors buildThermalReceiptHtml() field-for-field so the paper output matches
 * the on-screen preview. Call connectToPrinter() first before calling this.
 */
export type PrintEscPosOptions = {
  languageId?: string;
  strings?: ThermalReceiptStrings;
};

export async function printEscPos(
  data: ReceiptData,
  options?: PrintEscPosOptions
): Promise<void> {
  const languageId = options?.languageId ?? 'en';
  const tr = options?.strings ?? getThermalReceiptStrings(languageId);
  await BluetoothEscposPrinter.printerInit();
  await BluetoothEscposPrinter.printerLineSpace(THERMAL_RECEIPT_PRINT_STYLE.printLineSpaceDots);
  await BluetoothEscposPrinter.printAndFeed(THERMAL_RECEIPT_PRINT_STYLE.printFeedLinesStart);

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
  const paymentLabel = resolveReceiptPaymentLabel(data.paymentMethod, languageId).toUpperCase();
  const paymentAmount = data.receivedAmount ?? data.total;
  const taxableBase = resolveTaxableBase(data);
  const serviceCharge = data.serviceChargeAmount ?? 0;
  const primaryTax = vatAmount > 0 ? vatAmount : otherTaxAmount > 0 ? otherTaxAmount : taxAmount;
  const taxLabel = resolvePrimaryTaxLabel(tr, primaryTax, taxableBase);
  const invoiceBanner = tr.invoiceBanner(
    resolveReceiptPaymentLabel(data.paymentMethod, languageId)
  );

  // ── Address block (centered) ──────────────────
  await BluetoothEscposPrinter.printerAlign(CENTER);
  await printLine(companyName.toUpperCase());

  const businessAddress = data.businessAddress?.trim();
  if (businessAddress) {
    for (const part of businessAddress.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean)) {
      await printLine(part.toUpperCase());
    }
  } else {
    await printLine(tr.addressNotProvided);
  }
  const businessPhone = data.businessPhone?.trim();
  if (businessPhone) {
    await printLine(`TEL - ${businessPhone}`);
  }
  await printLine(`${dateStr} ${timeStr}`);

  // ── IRN ───────────────────────────────────────
  await printIrnLine(irnDisplay, tr.irnPrefix);

  // ── Section banner ────────────────────────────
  await BluetoothEscposPrinter.printerAlign(CENTER);
  await printSectionBanner(invoiceBanner);

  // ── Invoice / Operator / Customer ─────────────
  await BluetoothEscposPrinter.printerAlign(LEFT);
  await printMetaLine(tr.invoice, reference);
  if (data.operatorName) {
    await printMetaLine(tr.operator, data.operatorName);
  }

  const customerName = data.customerName?.trim();
  const customerPhone = data.customerPhone?.trim();
  if (customerName) {
    await printMetaLine(tr.customer, customerName);
  } else {
    await printMetaLine(tr.customer, tr.customerEmpty);
    if (customerPhone) {
      await printMetaLine(tr.phone, customerPhone);
    }
  }

  // ── Items ─────────────────────────────────────
  if (data.items.length > 0) {
    await printItemsHeader(tr);
    for (const item of data.items) {
      const name = item.product?.name ?? '';
      const unitPrice = item.product?.sellingPrice ?? 0;
      const qty = item.quantity ?? 1;
      const lineTotal = unitPrice * qty;
      await printItemRow(name, qty, unitPrice, lineTotal);
    }
    await BluetoothEscposPrinter.printerLineSpace(THERMAL_RECEIPT_PRINT_STYLE.printLineSpaceDots);
  }

  await printSubtotalRow(tr.subtotal, data.subtotal);

  if (serviceCharge > 0) {
    await printAmountRow(tr.serviceCharge, serviceCharge);
  }
  if (data.discount > 0) {
    await printAmountRow(tr.discount, -data.discount);
  }

  await printLine(LINE_TEXT);

  if (primaryTax > 0) {
    await printAmountRow(tr.txbl1, taxableBase);
    await printAmountRow(taxLabel, primaryTax);
  }

  await printLine(SOLID_LINE_TEXT);

  await printTotalRow(tr.total, formatReceiptStarAmount(data.total));

  await printLine(LINE_TEXT);

  await printRow(paymentLabel, formatReceiptStarAmount(paymentAmount));

  if (data.changeAmount != null && data.changeAmount > 0) {
    await printAmountRow(tr.change, data.changeAmount);
  }

  await BluetoothEscposPrinter.printAndFeed(THERMAL_RECEIPT_PRINT_STYLE.printFeedBeforeQrLines);

  try {
    await printReceiptQr(data);
  } catch (error) {
    if (__DEV__) {
      console.warn('[BluetoothPrinter] QR print failed:', error);
    }
  }

  await BluetoothEscposPrinter.printAndFeed(THERMAL_RECEIPT_PRINT_STYLE.printFeedAfterQrLines);
  await printPoweredByFooter(tr);

  await BluetoothEscposPrinter.printAndFeed(
    THERMAL_RECEIPT_PRINT_STYLE.printAfterFooterFeedLines +
      THERMAL_RECEIPT_PRINT_STYLE.printFeedLinesEnd +
      THERMAL_RECEIPT_PRINT_STYLE.printBottomFeedLines
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseDeviceList(rawList: string[]): BluetoothDevice[] {
  const devices: BluetoothDevice[] = [];
  for (const raw of rawList) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.address) {
        devices.push({ name: parsed.name ?? 'Unknown', address: parsed.address });
      }
    } catch {}
  }
  return devices;
}

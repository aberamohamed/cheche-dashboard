import { API_CONFIG } from '@/config/api';
import { formatCurrency } from '@/utils/format';
import { buildThermalReceiptHtml, buildThermalReceiptHtmlAsync } from '@/utils/thermalReceiptHtml';
import { getThermalReceiptStrings } from '@/i18n/thermalReceipt';
import type { TransactionDetail } from '@/types/transactionDetail';
import type { ReceiptData } from '@/types/receipt';
import { useSettingsStore } from '@/store/settingsStore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectToPrinter,
  isBluetoothEnabled,
  enableBluetooth,
  printEscPos,
  printThermalHtmlBitmap,
} from '@/services/bluetoothPrinterService';
import {
  captureThermalReceiptHtmlToPngBase64,
  needsGeEzBitmapPrint,
  prepareThermalHtmlForBitmapCapture,
  THERMAL_BITMAP_WIDTH_PX,
} from '@/utils/thermalReceiptBitmap';

export class ReceiptSaveCancelledError extends Error {
  constructor() {
    super('Save cancelled');
    this.name = 'ReceiptSaveCancelledError';
  }
}

export type TaxDocumentKey = 'irn' | 'rrn' | 'invoiceId';

export function buildTaxDocumentUrl(identifier: string, key: TaxDocumentKey = 'irn'): string {
  const base = API_CONFIG.taxDocumentPortalUrl;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${key}=${encodeURIComponent(identifier)}`;
}

export function resolveTaxDocumentReference(
  data: { irn?: string; rrn?: string },
  documentType: 'invoice' | 'receipt'
): { key: 'irn' | 'rrn'; identifier: string } | null {
  if (documentType === 'receipt') {
    return data.rrn ? { key: 'rrn', identifier: data.rrn } : null;
  }
  return data.irn ? { key: 'irn', identifier: data.irn } : null;
}

export function buildTaxDocumentUrlFromData(
  data: { irn?: string; rrn?: string },
  documentType: 'invoice' | 'receipt'
): string | null {
  const reference = resolveTaxDocumentReference(data, documentType);
  return reference ? buildTaxDocumentUrl(reference.identifier, reference.key) : null;
}

export function transactionDetailToReceiptData(detail: TransactionDetail): ReceiptData {
  const documentType: 'invoice' | 'receipt' = detail.receipt ? 'receipt' : 'invoice';
  const reference = resolveTaxDocumentReference(
    { irn: detail.irn, rrn: detail.rrn },
    documentType
  );

  return {
    invoiceNumber: detail.invoiceNumber,
    items: [],
    subtotal: detail.subtotal,
    discount: detail.discount,
    total: detail.total,
    paymentMethod: detail.paymentMethod,
    createdAt: detail.createdAt,
    ...(reference?.key === 'rrn' ? { rrn: reference.identifier } : {}),
    ...(reference?.key === 'irn' ? { irn: reference.identifier } : {}),
  };
}

export function hasTaxDocumentReference(data: ReceiptData): boolean {
  return !!(data.rrn || data.irn);
}

export function getTaxDocumentShareUrl(data: ReceiptData): string {
  if (data.rrn) return buildTaxDocumentUrl(data.rrn, 'rrn');
  if (data.irn) return buildTaxDocumentUrl(data.irn, 'irn');
  throw new Error('Tax document reference is missing');
}

export function buildTaxDocumentShareMessage(data: ReceiptData): string {
  const url = getTaxDocumentShareUrl(data);
  return `Tax document for ${data.invoiceNumber}\n${url}`;
}

function buildReceiptHtml(data: ReceiptData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td>
          ${item.product.name}
          ${
            item.product.variantName
              ? `<div style="font-size:12px;color:#8E8E93;margin-top:2px">${item.product.variantName}</div>`
              : ''
          }
        </td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.product.sellingPrice * item.quantity)}</td>
      </tr>`
    )
    .join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 24px; color: #1C1C1E; }
          .header { text-align: center; margin-bottom: 24px; }
          .brand { color: #E30074; font-size: 22px; font-weight: 700; }
          .invoice { color: #8E8E93; font-size: 13px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th { text-align: left; font-size: 12px; color: #8E8E93; padding-bottom: 8px; border-bottom: 1px solid #E5E5EA; }
          td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #F2F2F7; }
          .total { font-size: 20px; font-weight: 700; color: #E30074; text-align: right; margin-top: 16px; }
          .meta { font-size: 13px; color: #8E8E93; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">${data.businessName ?? 'Cheche POS'}</div>
          <div class="invoice">${data.invoiceNumber}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="meta">Subtotal: ${formatCurrency(data.subtotal)}</div>
        ${data.discount > 0 ? `<div class="meta">Discount: -${formatCurrency(data.discount)}</div>` : ''}
        <div class="total">Total: ${formatCurrency(data.total)}</div>
        <div class="meta">Payment: ${data.paymentMethod}</div>
        ${data.receivedAmount ? `<div class="meta">Received: ${formatCurrency(data.receivedAmount)}</div>` : ''}
        ${data.changeAmount ? `<div class="meta">Change: ${formatCurrency(data.changeAmount)}</div>` : ''}
        <div class="meta" style="margin-top:24px;text-align:center">Thank you for your purchase!</div>
      </body>
    </html>
  `;
}

async function fetchTaxDocumentHtml(identifier: string, key: TaxDocumentKey = 'irn'): Promise<string> {
  const url = buildTaxDocumentUrl(identifier, key);
  const response = await fetch(url, {
    headers: { Accept: 'text/html,application/json,text/plain,*/*' },
  });

  if (!response.ok) {
    throw new Error(`Tax document request failed (${response.status})`);
  }

  return response.text();
}

export { fetchTaxDocumentHtml };

function thermalReceiptOptions(variant: 'preview' | 'print') {
  const languageId = useSettingsStore.getState().language;
  return {
    variant,
    languageId,
    strings: getThermalReceiptStrings(languageId),
  };
}

async function resolveReceiptHtml(data: ReceiptData): Promise<string> {
  if (data.rrn) {
    return fetchTaxDocumentHtml(data.rrn, 'rrn');
  }
  if (data.irn) {
    return fetchTaxDocumentHtml(data.irn, 'irn');
  }
  return buildReceiptHtml(data);
}

export function resolveThermalReceiptHtml(data: ReceiptData): string {
  return buildThermalReceiptHtml(data, thermalReceiptOptions('preview'));
}

export async function resolveThermalReceiptHtmlAsync(
  data: ReceiptData,
  options?: { variant?: 'preview' | 'print' }
): Promise<string> {
  const variant = options?.variant ?? 'preview';
  return buildThermalReceiptHtmlAsync(data, {
    ...thermalReceiptOptions(variant),
    ...options,
  });
}

async function generatePdfUri(data: ReceiptData): Promise<string> {
  const html = await resolveReceiptHtml(data);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

async function generateThermalPdfUri(data: ReceiptData): Promise<string> {
  const html = await buildThermalReceiptHtmlAsync(data, thermalReceiptOptions('print'));
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

function buildThermalPdfBaseName(data: ReceiptData): string {
  const raw = data.receiptNumber?.trim() || data.invoiceNumber?.trim() || `receipt-${Date.now()}`;
  return raw.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '_') || 'receipt';
}

async function savePdfToUserSelectedLocation(
  sourceUri: string,
  baseName: string
): Promise<string> {
  if (Platform.OS === 'android') {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted || !permissions.directoryUri) {
      throw new ReceiptSaveCancelledError();
    }

    const pdfBase64 = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      baseName,
      'application/pdf'
    );

    await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(sourceUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Save Receipt PDF',
    });
    return sourceUri;
  }

  const dest = `${FileSystem.documentDirectory}${baseName}.pdf`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function printReceipt(data: ReceiptData): Promise<void> {
  const html = await resolveReceiptHtml(data);
  await Print.printAsync({ html });
}

/**
 * Prints directly to a Bluetooth ESC/POS thermal printer.
 * No system print dialog is shown.
 *
 * Before calling this, the user must have selected a printer via the
 * Bluetooth Printer setup screen (Settings → Bluetooth Printer).
 */
export async function printThermalReceipt(data: ReceiptData): Promise<void> {
  const savedAddress = await AsyncStorage.getItem('bt_printer_address');
  const savedName = await AsyncStorage.getItem('bt_printer_name');

  if (!savedAddress) {
    throw new Error(
      'No Bluetooth printer configured. Please go to Settings → Bluetooth Printer and select a printer.'
    );
  }

  // Ensure Bluetooth is on
  const btEnabled = await isBluetoothEnabled();
  if (!btEnabled) {
    if (Platform.OS === 'android') {
      await enableBluetooth();
    } else {
      throw new Error('Bluetooth is not enabled. Please turn on Bluetooth and try again.');
    }
  }

  // Connect and print
  await connectToPrinter(savedAddress);
  const printOpts = thermalReceiptOptions('print');

  // Amharic/Tigrinya: ESC/POS text becomes "??" — render HTML preview as a bitmap instead.
  if (needsGeEzBitmapPrint(printOpts.languageId)) {
    const html = await buildThermalReceiptHtmlAsync(data, {
      ...printOpts,
      // Preview variant: full-width body with large fonts, so rasterized
      // Ge'ez text prints big enough to read on 58mm paper.
      variant: 'preview',
    });
    const pngBase64 = await captureThermalReceiptHtmlToPngBase64(
      prepareThermalHtmlForBitmapCapture(html, THERMAL_BITMAP_WIDTH_PX),
      THERMAL_BITMAP_WIDTH_PX
    );
    await printThermalHtmlBitmap(pngBase64, THERMAL_BITMAP_WIDTH_PX);
    return;
  }

  await printEscPos(data, printOpts);
}

export async function shareReceipt(data: ReceiptData): Promise<void> {
  const uri = await generatePdfUri(data);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });
  }
}

export async function downloadReceipt(data: ReceiptData): Promise<string> {
  const uri = await generatePdfUri(data);
  const filename = `${data.invoiceNumber}.pdf`;
  const dest = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function downloadThermalReceipt(data: ReceiptData): Promise<string> {
  const uri = await generateThermalPdfUri(data);
  const baseName = buildThermalPdfBaseName(data);
  return savePdfToUserSelectedLocation(uri, baseName);
}

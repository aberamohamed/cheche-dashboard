import { API_CONFIG } from '@/config/api';
import QRCode from 'qrcode';
import type { ReceiptData } from '@/types/receipt';

type TaxDocumentKey = 'irn' | 'rrn';

function buildTaxDocumentUrl(identifier: string, key: TaxDocumentKey): string {
  const base = API_CONFIG.taxDocumentPortalUrl;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${key}=${encodeURIComponent(identifier)}`;
}

/** Portal URL for the fiscal document (RRN for receipts, else IRN). */
export function buildReceiptQrTaxDocumentUrl(data: ReceiptData): string | null {
  const rrn = data.rrn?.trim();
  if (rrn) return buildTaxDocumentUrl(rrn, 'rrn');
  const irn = data.irn?.trim();
  if (irn) return buildTaxDocumentUrl(irn, 'irn');
  return null;
}

const QR_RENDER_OPTIONS = {
  type: 'svg' as const,
  margin: 1,
  errorCorrectionLevel: 'M' as const,
};

async function qrPayloadToSvg(payload: string): Promise<string> {
  const svg = await QRCode.toString(payload, QR_RENDER_OPTIONS);
  return svg.replace(
    '<svg ',
    '<svg class="qr-svg" preserveAspectRatio="xMidYMid meet" '
  );
}

/** SVG QR for on-screen preview (tax document URL). */
export async function buildReceiptQrSvg(data: ReceiptData): Promise<string | null> {
  const payload = buildReceiptQrTaxDocumentUrl(data);
  if (!payload) return null;
  return qrPayloadToSvg(payload);
}

/** SVG QR for thermal preview / PDF (tax document URL). */
export async function buildReceiptQrSvgForPrint(data: ReceiptData): Promise<string | null> {
  const payload = buildReceiptQrTaxDocumentUrl(data);
  if (!payload) return null;
  return qrPayloadToSvg(payload);
}

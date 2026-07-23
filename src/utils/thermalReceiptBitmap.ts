import { resolveLanguageId } from '@/data/languages';

/** Ge'ez-script languages must print as bitmap — ESC/POS text cannot encode Amharic/Tigrinya. */
export function needsGeEzBitmapPrint(languageId: string | undefined): boolean {
  const id = resolveLanguageId(languageId ?? 'en');
  return id === 'am' || id === 'ti';
}

/** Capture width in px for 58mm thermal (~203 dpi). */
export const THERMAL_BITMAP_WIDTH_PX = 384;

type BitmapCaptureJob = {
  html: string;
  widthPx: number;
  resolve: (base64: string) => void;
  reject: (error: Error) => void;
};

let pendingJob: BitmapCaptureJob | null = null;
let listener: (() => void) | null = null;

export function setThermalBitmapCaptureListener(next: (() => void) | null): void {
  listener = next;
}

export function getPendingThermalBitmapCapture(): BitmapCaptureJob | null {
  return pendingJob;
}

export function clearPendingThermalBitmapCapture(): void {
  pendingJob = null;
}

/**
 * Renders thermal receipt HTML to a PNG (base64, no data-URI prefix) via the root capture host.
 */
export function captureThermalReceiptHtmlToPngBase64(
  html: string,
  widthPx = THERMAL_BITMAP_WIDTH_PX
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (pendingJob) {
      pendingJob.reject(new Error('Another receipt bitmap capture is already in progress'));
    }

    const timeout = setTimeout(() => {
      if (pendingJob?.resolve === resolve) {
        pendingJob = null;
        reject(new Error('Timed out rendering receipt for bitmap print'));
      }
    }, 20000);

    pendingJob = {
      html,
      widthPx,
      resolve: (base64) => {
        clearTimeout(timeout);
        pendingJob = null;
        resolve(base64);
      },
      reject: (error) => {
        clearTimeout(timeout);
        pendingJob = null;
        reject(error);
      },
    };

    listener?.();
  });
}

export function stripDataUrlBase64(value: string): string {
  const trimmed = value.trim();
  const marker = 'base64,';
  const index = trimmed.indexOf(marker);
  if (index >= 0) return trimmed.slice(index + marker.length);
  return trimmed;
}

/** Rewrites 58mm CSS widths to a fixed pixel width for WebView bitmap capture. */
export function prepareThermalHtmlForBitmapCapture(
  html: string,
  widthPx = THERMAL_BITMAP_WIDTH_PX
): string {
  return html
    .replace(/width:\s*58mm/g, `width: ${widthPx}px`)
    .replace(/max-width:\s*58mm/g, `max-width: ${widthPx}px`)
    .replace(/size:\s*58mm\s+auto/g, `size: ${widthPx}px auto`);
}

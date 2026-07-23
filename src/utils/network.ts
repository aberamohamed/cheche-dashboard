import { appAlert } from '@/utils/alert';
import type { AlertButton } from '@/store/alertStore';

/** User-facing copy shown whenever a request fails because the device is offline. */
export const NO_INTERNET_MESSAGE =
  'No internet connection. Please check your internet connection and try again.';

/**
 * Detects failures caused by a missing/unstable connection rather than a real
 * server response. These come through as thrown fetch errors (there is no HTTP
 * status), e.g. "Network request failed", "fetch failed",
 * "java.net.SocketException: Connection reset", DNS failures, timeouts, etc.
 */
export function isNetworkError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  if (!message) return false;
  return (
    message.includes('network request failed') ||
    message.includes('fetch failed') ||
    message.includes('socketexception') ||
    message.includes('connection reset') ||
    message.includes('connection refused') ||
    message.includes('connection abort') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname') ||
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('failed to connect')
  );
}

/**
 * Turns any thrown error into a message safe to show the user — the offline
 * copy for connection failures, otherwise the error's own message (or a
 * provided fallback).
 */
export function resolveErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (isNetworkError(error)) return NO_INTERNET_MESSAGE;
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return message || fallback;
}

/**
 * Shows the shared error modal (never a native alert) for a caught error,
 * automatically surfacing the offline message when the device has no
 * connection. Use everywhere a request can fail.
 */
export function showErrorAlert(
  error: unknown,
  options?: { title?: string; fallback?: string; buttons?: AlertButton[] }
): void {
  const isOffline = isNetworkError(error);
  appAlert(
    options?.title ?? (isOffline ? 'No Connection' : 'Error'),
    resolveErrorMessage(error, options?.fallback),
    options?.buttons,
    { variant: 'error' }
  );
}

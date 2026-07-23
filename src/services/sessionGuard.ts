import { maybeRefreshAuthTokens } from '@/services/tokenRefresh';

export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

let lastActivityAt = Date.now();

export function recordActivity(): void {
  lastActivityAt = Date.now();
  void maybeRefreshAuthTokens();
}

export function getLastActivityAt(): number {
  return lastActivityAt;
}

export function registerInactivityHandler(_handler: () => void): () => void {
  return () => {};
}

export function scheduleInactivityCheck(): void {
  void maybeRefreshAuthTokens();
}

export function clearInactivityCheck(): void {}

export function shouldForceLogout(_status: number, _message: string, _path: string): boolean {
  return false;
}

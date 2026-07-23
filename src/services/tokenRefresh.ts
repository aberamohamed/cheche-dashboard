import { persistAuth, useAuthStore } from '@/store/authStore';
import { getTokenExpiryMs } from '@/utils/jwt';

const TOKEN_REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const REFRESH_THROTTLE_MS = 30 * 1000;
const FALLBACK_REFRESH_INTERVAL_MS = 4 * 60 * 1000;

let refreshPromise: Promise<boolean> | null = null;
let lastSuccessfulRefreshAt = 0;

export function markTokenFresh(): void {
  lastSuccessfulRefreshAt = Date.now();
}

export function shouldRefreshToken(token: string | null): boolean {
  const now = Date.now();
  const expiry = getTokenExpiryMs(token);

  if (expiry) {
    return expiry - now <= TOKEN_REFRESH_BEFORE_EXPIRY_MS;
  }

  return now - lastSuccessfulRefreshAt >= FALLBACK_REFRESH_INTERVAL_MS;
}

export async function refreshAuthTokens(force = false): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  const state = useAuthStore.getState();
  if (!state.refreshToken) {
    if (__DEV__) {
      console.warn('[Auth] Token refresh skipped: no refresh token');
    }
    return false;
  }

  const now = Date.now();
  if (!force) {
    if (now - lastSuccessfulRefreshAt < REFRESH_THROTTLE_MS) {
      return true;
    }
    if (!shouldRefreshToken(state.token)) {
      return true;
    }
  }

  refreshPromise = (async () => {
    const current = useAuthStore.getState();
    const refreshToken = current.refreshToken;
    if (!refreshToken) return false;

    try {
      const { refreshAccessToken } = await import('@/services/authService');
      const result = await refreshAccessToken(refreshToken);

      current.setToken(result.token);
      if (result.refreshToken) {
        current.setRefreshToken(result.refreshToken);
      }

      if (current.user) {
        await persistAuth({
          user: current.user,
          business: current.business,
          token: result.token,
          refreshToken: result.refreshToken ?? refreshToken,
          organizationId: current.organizationId,
          sessionId: current.sessionId,
          rememberMe: current.rememberMe,
          isGuest: current.isGuest,
        });
      }

      lastSuccessfulRefreshAt = Date.now();
      return true;
    } catch (error) {
      if (__DEV__) {
        console.warn('[Auth] Token refresh failed', error);
      }
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function maybeRefreshAuthTokens(): Promise<void> {
  const { isAuthenticated, refreshToken, token } = useAuthStore.getState();
  if (!isAuthenticated || !refreshToken) return;
  if (!shouldRefreshToken(token)) return;
  await refreshAuthTokens();
}

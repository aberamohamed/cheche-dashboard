export function getTokenExpiryMs(token: string | null | undefined): number | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };
    if (typeof decoded.exp === 'number') {
      return decoded.exp * 1000;
    }
  } catch {
    // ignore malformed tokens
  }

  return null;
}

// Sales session service

import { ApiError, apiRequest } from '@/services/apiClient';
import type { ApiSalesSession } from '@/types/api';
import { unwrapData } from '@/utils/apiHelpers';

function isNoActiveSession(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 404) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('no active session') ||
    message.includes('no active sales session') ||
    message.includes('open a sales session')
  );
}

export class SalesSessionError extends Error {
  code: 'SESSION_OPEN_FAILED';

  constructor(code: SalesSessionError['code'], message: string) {
    super(message);
    this.name = 'SalesSessionError';
    this.code = code;
  }
}

function resolveSessionId(session: ApiSalesSession): string {
  const value = String(session.uuid ?? session.id ?? '').trim();
  if (!value) {
    throw new SalesSessionError('SESSION_OPEN_FAILED', 'Invalid sales session response from server');
  }
  return value;
}

export async function openSalesSession(openingCashAmount = 0): Promise<ApiSalesSession> {
  const response = await apiRequest<unknown>('/auth/sales-sessions/open', {
    method: 'POST',
    silent: true,
    body: { openingCashAmount },
  });
  return unwrapData<ApiSalesSession>(response);
}

export async function getActiveSession(): Promise<ApiSalesSession | null> {
  try {
    const response = await apiRequest<unknown>('/auth/sales-sessions/active', {
      silent: true,
    });
    const session = unwrapData<ApiSalesSession | null>(response);
    if (!session) return null;

    resolveSessionId(session);
    return session;
  } catch (error) {
    if (isNoActiveSession(error)) return null;
    throw error;
  }
}

export async function ensureSalesSession(): Promise<string> {
  try {
    const active = await getActiveSession();
    if (active) return resolveSessionId(active);
  } catch {
    // fall through and try to open a new session
  }

  const opened = await openSalesSession();
  return resolveSessionId(opened);
}

export async function closeSalesSession(closingCashAmount = 0): Promise<void> {
  await apiRequest('/auth/sales-sessions/close', {
    method: 'POST',
    body: { closingCashAmount },
  });
}

export async function getSessionSummary(): Promise<unknown> {
  const response = await apiRequest<unknown>('/auth/sales-sessions/summary');
  return unwrapData(response);
}

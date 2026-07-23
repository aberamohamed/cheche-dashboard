import { API_CONFIG, buildApiUrl } from '@/config/api';
import { recordActivity } from '@/services/sessionGuard';
import { refreshAuthTokens } from '@/services/tokenRefresh';
import { useAuthStore } from '@/store/authStore';
import { handleSessionExpired } from '@/utils/sessionExpired';

export class ApiError extends Error {
  status: number;
  url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  device?: boolean;
  /** Skip dev console.error for expected failures (e.g. no active session) */
  silent?: boolean;
  /** Internal: skip token refresh retry */
  _retried?: boolean;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const json = await response.json();
    if (typeof json === 'object' && json) {
      const record = json as Record<string, unknown>;
      const nestedError = record.error;
      if (nestedError && typeof nestedError === 'object') {
        const nestedMessage = (nestedError as Record<string, unknown>).message;
        if (typeof nestedMessage === 'string') return nestedMessage;
      }
      const message = record.message ?? record.error ?? record.detail;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(', ');
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

async function executeFetch<T>(
  url: string,
  path: string,
  options: RequestOptions
): Promise<T> {
  const { body, auth = true, device = false, silent = false, headers, method, _retried, ...rest } =
    options;
  const { token, deviceId } = useAuthStore.getState();
  const requestMethod = method ?? (body !== undefined ? 'POST' : 'GET');

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (device && deviceId) {
    requestHeaders['x-device-id'] = deviceId;
  }

  const response = await fetch(url, {
    ...rest,
    method: requestMethod,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);

    if (
      auth &&
      response.status === 401 &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/refresh') &&
      !path.includes('/auth/logout')
    ) {
      if (!_retried) {
        const refreshed = await refreshAuthTokens(true);
        if (refreshed) {
          return executeFetch<T>(url, path, { ...options, _retried: true });
        }
      }
      await handleSessionExpired();
    }

    if (__DEV__ && !silent) {
      console.error(`[API] ${requestMethod} ${url} -> ${response.status}`, message);
    }
    throw new ApiError(message, response.status, url);
  }

  if (auth && useAuthStore.getState().isAuthenticated) {
    recordActivity();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiRequestText(
  path: string,
  options: RequestOptions = {}
): Promise<string> {
  const url = buildApiUrl(API_CONFIG.baseUrl, path);
  const { body, auth = true, device = false, silent = false, headers, method, _retried, ...rest } =
    options;
  const { token, deviceId } = useAuthStore.getState();
  const requestMethod = method ?? (body !== undefined ? 'POST' : 'GET');

  const requestHeaders: Record<string, string> = {
    Accept: 'text/html,application/json,text/plain,*/*',
    ...(headers as Record<string, string>),
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (device && deviceId) {
    requestHeaders['x-device-id'] = deviceId;
  }

  const response = await fetch(url, {
    ...rest,
    method: requestMethod,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);

    if (
      auth &&
      response.status === 401 &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/refresh') &&
      !path.includes('/auth/logout')
    ) {
      if (!_retried) {
        const refreshed = await refreshAuthTokens(true);
        if (refreshed) {
          return apiRequestText(path, { ...options, _retried: true });
        }
      }
      await handleSessionExpired();
    }

    if (__DEV__ && !silent) {
      console.error(`[API] ${requestMethod} ${url} -> ${response.status}`, message);
    }
    throw new ApiError(message, response.status, url);
  }

  if (auth && useAuthStore.getState().isAuthenticated) {
    recordActivity();
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      const html = json.html ?? json.data;
      if (typeof html === 'string' && html.trim()) {
        return html;
      }
    } catch {
      // fall through to raw text
    }
  }

  return text;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = buildApiUrl(API_CONFIG.baseUrl, path);
  return executeFetch<T>(url, path, options);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, 'body'> = {}
): Promise<T> {
  const url = buildApiUrl(API_CONFIG.baseUrl, path);
  const { auth = true, device = false, silent = false, headers, method = 'POST', _retried, ...rest } =
    options;
  const { token, deviceId } = useAuthStore.getState();

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (device && deviceId) {
    requestHeaders['x-device-id'] = deviceId;
  }

  const response = await fetch(url, {
    ...rest,
    method,
    headers: requestHeaders,
    body: formData,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);

    if (
      auth &&
      response.status === 401 &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/refresh') &&
      !path.includes('/auth/logout')
    ) {
      if (!_retried) {
        const refreshed = await refreshAuthTokens(true);
        if (refreshed) {
          return apiUpload<T>(path, formData, { ...options, _retried: true });
        }
      }
      await handleSessionExpired();
    }

    if (__DEV__ && !silent) {
      console.error(`[API] ${method} ${url} -> ${response.status}`, message);
    }
    throw new ApiError(message, response.status, url);
  }

  if (auth && useAuthStore.getState().isAuthenticated) {
    recordActivity();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function authServiceRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, method, ...rest } = options;
  const url = buildApiUrl(API_CONFIG.authServiceUrl, path);
  const requestMethod = method ?? (body !== undefined ? 'POST' : 'GET');

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...rest,
    method: requestMethod,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    if (__DEV__) {
      console.error(`[Auth API] ${requestMethod} ${url} -> ${response.status}`, message);
    }
    throw new ApiError(message, response.status, url);
  }

  return response.json() as Promise<T>;
}

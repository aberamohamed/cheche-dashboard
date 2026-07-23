const POS_API_BASE_URL = 'https://pos-api-ertfzm-652f41-196-188-249-221.sslip.io/v1';
const EIRMS_BASE_URL =
  'https://invoice-api-apiproxy-grykeb-14616c-196-188-249-221.sslip.io';
const TAX_DOCUMENT_PORTAL_URL =
  'https://frontend-portal-rnbuxd-22424f-196-188-249-221.sslip.io/public/invoice';

function resolveUrl(value: unknown, fallback: string): string {
  const url = typeof value === 'string' ? value.trim() : '';
  return (url || fallback).replace(/\/$/, '');
}

export const API_CONFIG = {
  baseUrl: resolveUrl(process.env.EXPO_PUBLIC_API_BASE_URL, POS_API_BASE_URL),
  authServiceUrl: resolveUrl(process.env.EXPO_PUBLIC_AUTH_SERVICE_URL, POS_API_BASE_URL),
  eirmsBaseUrl: resolveUrl(process.env.EXPO_PUBLIC_EIRMS_BASE_URL, EIRMS_BASE_URL),
  eirmsPublicBaseUrl: resolveUrl(
    process.env.EXPO_PUBLIC_EIRMS_PUBLIC_BASE_URL,
    EIRMS_BASE_URL
  ),
  taxDocumentPortalUrl: resolveUrl(
    process.env.EXPO_PUBLIC_TAX_DOCUMENT_PORTAL_URL,
    TAX_DOCUMENT_PORTAL_URL
  ),
} as const;

export function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

import type { EtradeBusinessByLicenseDetail, EtradeRegistrationInfo } from '@/types/etrade';
import { Platform } from 'react-native';

/** https://etrade.gov.et/api/Registration/GetRegistrationInfoByTin/{tin}/en */
const ETRADE_GET_REGISTRATION_BY_TIN_URL =
  'https://etrade.gov.et/api/Registration/GetRegistrationInfoByTin';

/** https://etrade.gov.et/api/BusinessMain/GetBusinessByLicenseNo?LicenseNo=...&Tin=...&Lang=en */
const ETRADE_GET_BUSINESS_BY_LICENSE_URL =
  'https://etrade.gov.et/api/BusinessMain/GetBusinessByLicenseNo';

const ETRADE_REFERER = 'https://etrade.gov.et/business-license-checker';
const REQUEST_TIMEOUT_MS = 30_000;
const TIN_LENGTH = 10;

export class EtradeApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EtradeApiError';
    this.status = status;
  }
}

export function normalizeEtradeTin(value: string): string {
  return value.replace(/\D/g, '');
}

/** @deprecated Use normalizeEtradeTin */
export const normalizeBusinessLicense = normalizeEtradeTin;

export function isValidEtradeTin(tin: string): boolean {
  return normalizeEtradeTin(tin).length === TIN_LENGTH;
}

/** @deprecated Use isValidEtradeTin */
export const isValidEtradeBusinessLicense = isValidEtradeTin;

export function buildEtradeRegistrationUrl(tin: string, locale: 'en' | 'am' = 'en'): string {
  const normalizedTin = normalizeEtradeTin(tin);
  return `${ETRADE_GET_REGISTRATION_BY_TIN_URL}/${encodeURIComponent(normalizedTin)}/${locale}`;
}

export function buildEtradeBusinessByLicenseUrl(params: {
  licenseNo: string;
  tin: string;
  lang?: 'en' | 'am';
}): string {
  const query = new URLSearchParams({
    LicenseNo: params.licenseNo.trim(),
    Tin: normalizeEtradeTin(params.tin),
    Lang: params.lang ?? 'en',
  });
  return `${ETRADE_GET_BUSINESS_BY_LICENSE_URL}?${query.toString()}`;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  }
  return null;
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function parseEtradeRegistrationResponse(payload: unknown): EtradeRegistrationInfo {
  if (!payload || typeof payload !== 'object') {
    throw new EtradeApiError('No business found for this TIN.', 404);
  }

  const record = payload as Record<string, unknown>;
  const tin = readString(record, 'Tin', 'tin');
  if (!tin) {
    throw new EtradeApiError('No business found for this TIN.', 404);
  }

  const associates = record.AssociateShortInfos ?? record.associateShortInfos;
  const businesses = record.Businesses ?? record.businesses;
  const parsedBusinesses = Array.isArray(businesses)
    ? (businesses as EtradeRegistrationInfo['Businesses'])
    : [];

  const primaryLicense = parsedBusinesses[0]?.LicenceNumber?.trim() ?? null;

  return {
    Tin: tin,
    LicenseNo: primaryLicense,
    LegalCondtion: readString(record, 'LegalCondtion', 'LegalCondition', 'legalCondition'),
    RegNo: readString(record, 'RegNo', 'regNo'),
    RegDate: readString(record, 'RegDate', 'regDate'),
    BusinessName: readString(record, 'BusinessName', 'businessName'),
    BusinessNameAmh: readString(record, 'BusinessNameAmh', 'businessNameAmh'),
    PaidUpCapital: readNumber(record, 'PaidUpCapital', 'paidUpCapital'),
    AssociateShortInfos: Array.isArray(associates)
      ? (associates as EtradeRegistrationInfo['AssociateShortInfos'])
      : [],
    Businesses: parsedBusinesses,
  };
}

function unwrapRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const nested = record.data ?? record.Data ?? record.result ?? record.Result;
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return record;
}

function parseAddressInfo(value: unknown): EtradeBusinessByLicenseDetail['AddressInfo'] {
  if (!value || typeof value !== 'object') return null;
  const address = value as Record<string, unknown>;
  return {
    Region: readString(address, 'Region', 'region'),
    Zone: readString(address, 'Zone', 'zone'),
    Woreda: readString(address, 'Woreda', 'woreda'),
    Kebele: readString(address, 'Kebele', 'kebele'),
    HouseNo: readString(address, 'HouseNo', 'houseNo'),
    MobilePhone: readString(address, 'MobilePhone', 'mobilePhone'),
    RegularPhone: readString(address, 'RegularPhone', 'regularPhone'),
  };
}

function parseEtradeBusinessByLicenseResponse(payload: unknown): EtradeBusinessByLicenseDetail {
  const record = unwrapRecord(payload);
  if (!record) {
    throw new EtradeApiError('No business details found for this license.', 404);
  }

  const licenceNumber = readString(record, 'LicenceNumber', 'LicenseNo', 'licenseNo');
  if (!licenceNumber) {
    throw new EtradeApiError('No business details found for this license.', 404);
  }

  const associates = record.AssociateShortInfos ?? record.associateShortInfos;
  const subGroups = record.SubGroups ?? record.subGroups;

  return {
    MainGuid: readString(record, 'MainGuid', 'mainGuid'),
    OwnerTIN: readString(record, 'OwnerTIN', 'ownerTIN', 'Tin', 'tin'),
    DateRegistered: readString(record, 'DateRegistered', 'dateRegistered'),
    TradeName: readString(record, 'TradeName', 'TradesName', 'tradeName'),
    LicenceNumber: licenceNumber,
    Status: readNumber(record, 'Status', 'status'),
    StatusDescription: readString(record, 'StatusDescription', 'statusDescription'),
    Capital: readNumber(record, 'Capital', 'capital'),
    AssociateShortInfos: Array.isArray(associates)
      ? (associates as EtradeBusinessByLicenseDetail['AssociateShortInfos'])
      : [],
    AddressInfo: parseAddressInfo(record.AddressInfo ?? record.addressInfo),
    SubGroups: Array.isArray(subGroups)
      ? (subGroups as EtradeBusinessByLicenseDetail['SubGroups'])
      : [],
    RenewedTo: readString(record, 'RenewedTo', 'renewedTo'),
    RenewedToDateString: readString(record, 'RenewedToDateString', 'renewedToDateString'),
    RenewalDate: readString(record, 'RenewalDate', 'renewalDate'),
    RenewedFrom: readString(record, 'RenewedFrom', 'renewedFrom'),
    CancellationDate: readString(record, 'CancellationDate', 'cancellationDate'),
  };
}

/**
 * eTrade's IIS server returns HTTP 417 to React Native fetch (Expect: 100-continue).
 * XMLHttpRequest avoids that header and matches browser requests more closely.
 */
async function etradeGetJson(url: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = REQUEST_TIMEOUT_MS;
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
    xhr.setRequestHeader('Referer', ETRADE_REFERER);
    xhr.setRequestHeader('Origin', 'https://etrade.gov.et');
    xhr.setRequestHeader('Connection', 'close');
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    if (Platform.OS === 'web') {
      xhr.withCredentials = false;
    }

    xhr.onload = () => {
      const { status, responseText } = xhr;
      if (!responseText) {
        resolve({ status, data: null });
        return;
      }

      try {
        resolve({ status, data: JSON.parse(responseText) });
      } catch {
        reject(new EtradeApiError('Invalid response from eTrade. Try again.', 502));
      }
    };

    xhr.onerror = () => {
      reject(
        new EtradeApiError(
          'Could not connect to eTrade. Check your internet connection and try again.',
          0
        )
      );
    };

    xhr.ontimeout = () => {
      reject(new EtradeApiError('eTrade request timed out. Try again.', 0));
    };

    xhr.send();
  });
}

export async function fetchEtradeRegistrationByTin(
  tin: string,
  locale: 'en' | 'am' = 'en'
): Promise<EtradeRegistrationInfo> {
  const normalizedTin = normalizeEtradeTin(tin);

  if (!isValidEtradeTin(normalizedTin)) {
    throw new EtradeApiError(`TIN must be exactly ${TIN_LENGTH} digits.`, 400);
  }

  const url = buildEtradeRegistrationUrl(normalizedTin, locale);
  const { status, data } = await etradeGetJson(url);

  if (status < 200 || status >= 300) {
    const message =
      status === 404
        ? 'No business found for this TIN.'
        : status === 417
          ? 'eTrade rejected the request. Please try again in a moment.'
          : `Unable to reach eTrade (${status}). Try again.`;
    throw new EtradeApiError(message, status);
  }

  return parseEtradeRegistrationResponse(data);
}

export async function fetchEtradeBusinessByLicenseNo(params: {
  licenseNo: string;
  tin: string;
  lang?: 'en' | 'am';
}): Promise<EtradeBusinessByLicenseDetail> {
  const licenseNo = params.licenseNo.trim();
  const tin = normalizeEtradeTin(params.tin);

  if (!licenseNo) {
    throw new EtradeApiError('Business license number is required.', 400);
  }
  if (!isValidEtradeTin(tin)) {
    throw new EtradeApiError(`TIN must be exactly ${TIN_LENGTH} digits.`, 400);
  }

  const url = buildEtradeBusinessByLicenseUrl({ licenseNo, tin, lang: params.lang });
  const { status, data } = await etradeGetJson(url);

  if (status < 200 || status >= 300) {
    const message =
      status === 404
        ? 'No business details found for this license.'
        : status === 417
          ? 'eTrade rejected the request. Please try again in a moment.'
          : `Unable to reach eTrade (${status}). Try again.`;
    throw new EtradeApiError(message, status);
  }

  return parseEtradeBusinessByLicenseResponse(data);
}

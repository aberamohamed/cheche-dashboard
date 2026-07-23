import type { BusinessForm } from '@/features/auth/schemas';
import type {
  EtradeBusinessByLicenseDetail,
  EtradeBusinessEntry,
  EtradeRegistrationInfo,
} from '@/types/etrade';
import { stripToLocalPhone } from '@/utils/phone';

export type EtradePreviewTableRow = {
  label: string;
  value: string;
};

export function formatEtradeCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getPrimaryEtradeBusiness(
  info: EtradeRegistrationInfo
): EtradeBusinessEntry | null {
  return info.Businesses?.[0] ?? null;
}

export function formatEtradeLegalCondition(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return '—';
  if (normalized === '1') return 'Private';
  if (normalized === '2') return 'Public';
  return normalized;
}

export function formatEtradeSectors(business: EtradeBusinessEntry | null): string {
  if (!business?.SubGroups?.length) return '—';
  return business.SubGroups.map((group) => group.Description?.trim() || String(group.Code))
    .filter(Boolean)
    .join(', ');
}

export function formatEtradeValidity(business: EtradeBusinessEntry | null): string {
  if (!business) return '—';
  const from = business.RenewedFrom?.trim();
  const to = business.RenewedTo?.trim();
  if (from && to) return `${from} – ${to}`;
  return from || to || '—';
}

function pushRow(rows: EtradePreviewTableRow[], label: string, value: string | null | undefined) {
  const normalized = value?.trim();
  if (normalized) {
    rows.push({ label, value: normalized });
  }
}

export function buildEtradePreviewTableRows(
  data: EtradeRegistrationInfo,
  detail?: EtradeBusinessByLicenseDetail | null
): EtradePreviewTableRow[] {
  const primaryBusiness = getPrimaryEtradeBusiness(data);
  const rows: EtradePreviewTableRow[] = [];

  pushRow(
    rows,
    'Business name',
    data.BusinessName?.trim() || detail?.TradeName?.trim() || primaryBusiness?.TradesName?.trim()
  );
  pushRow(rows, 'Business name (Amharic)', data.BusinessNameAmh?.trim());
  pushRow(rows, 'TIN', data.Tin?.trim() || detail?.OwnerTIN?.trim());
  pushRow(rows, 'Registered no.', data.RegNo?.trim());
  pushRow(
    rows,
    'Business license no.',
    detail?.LicenceNumber?.trim() ||
      primaryBusiness?.LicenceNumber?.trim() ||
      data.LicenseNo?.trim()
  );
  pushRow(
    rows,
    'Trade name',
    detail?.TradeName?.trim() || primaryBusiness?.TradesName?.trim()
  );
  pushRow(
    rows,
    'Sector',
    detail?.SubGroups?.length
      ? detail.SubGroups.map((g) => g.Description?.trim() || String(g.Code)).join(', ')
      : formatEtradeSectors(primaryBusiness) === '—'
        ? ''
        : formatEtradeSectors(primaryBusiness)
  );
  pushRow(rows, 'Registration date', data.RegDate?.trim() || detail?.DateRegistered?.trim());

  if (detail) {
    pushRow(rows, 'Status', detail.StatusDescription?.trim());
    pushRow(
      rows,
      'Capital (ETB)',
      detail.Capital != null ? formatEtradeCurrency(detail.Capital) : ''
    );
    pushRow(rows, 'Region', detail.AddressInfo?.Region);
    pushRow(rows, 'Zone', detail.AddressInfo?.Zone);
    pushRow(rows, 'Woreda', detail.AddressInfo?.Woreda);
    pushRow(rows, 'Kebele', detail.AddressInfo?.Kebele);
    pushRow(rows, 'House no.', detail.AddressInfo?.HouseNo);
    pushRow(rows, 'Mobile phone', detail.AddressInfo?.MobilePhone);
    pushRow(rows, 'Regular phone', detail.AddressInfo?.RegularPhone);
    pushRow(rows, 'Renewal date', detail.RenewalDate?.trim());
    pushRow(rows, 'Renewed from', detail.RenewedFrom?.trim());
    pushRow(
      rows,
      'Renewed to',
      detail.RenewedToDateString?.trim() || detail.RenewedTo?.trim()
    );
    pushRow(rows, 'Cancellation date', detail.CancellationDate?.trim());
  } else {
    const validity = formatEtradeValidity(primaryBusiness);
    pushRow(rows, 'License valid', validity === '—' ? '' : validity);
  }

  return rows;
}

export function mapEtradeToBusinessDefaults(
  info: EtradeRegistrationInfo
): Partial<BusinessForm> {
  const manager = info.AssociateShortInfos?.[0];
  const primaryBusiness = getPrimaryEtradeBusiness(info);
  const rawPhone =
    manager?.MobilePhone ??
    manager?.RegularPhone ??
    '';
  const phone = rawPhone ? stripToLocalPhone(String(rawPhone)) : '';

  const businessName =
    info.BusinessName?.trim() ||
    primaryBusiness?.TradesName?.trim() ||
    info.BusinessNameAmh?.trim() ||
    '';

  return {
    businessName,
    legalName: info.BusinessName?.trim() || primaryBusiness?.TradesName?.trim() || '',
    tin: info.Tin?.trim() || '',
    phone: phone.length >= 9 ? phone : '',
  };
}

import { formatCountryForApi } from '@/data/ethiopianLocations';
import { apiRequest } from '@/services/apiClient';
import type { CustomerRecord } from '@/types';
import type { ApiCustomer } from '@/types/api';
import { mapApiCustomer, unwrapData } from '@/utils/apiHelpers';
import { formatPhoneForCustomerApi } from '@/utils/phone';

export interface CreateCustomerInput {
  fullName: string;
  phone?: string;
  email?: string;
  country?: string;
  region?: string;
  city?: string;
  zone?: string;
  wereda?: string;
  kebele?: string;
  locality?: string;
  street?: string;
  houseNumber?: string;
  transactionType?: string;
  idType?: string;
  idNumber?: string;
}

function optionalField(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerRecord> {
  const body: Record<string, unknown> = {
    name: input.fullName.trim(),
  };

  const phone = formatPhoneForCustomerApi(input.phone);
  const email = optionalField(input.email);
  const country = formatCountryForApi(input.country) ?? (optionalField(input.city) ? 'ET' : undefined);
  const region = optionalField(input.region);
  const city = optionalField(input.city);
  const zone = optionalField(input.zone);
  const wereda = optionalField(input.wereda);
  const kebele = optionalField(input.kebele);
  const locality = optionalField(input.locality);
  const street = optionalField(input.street);
  const houseNumber = optionalField(input.houseNumber);
  const transactionType = optionalField(input.transactionType) ?? 'B2C';
  const idType = optionalField(input.idType);
  const idNumber = optionalField(input.idNumber);

  if (phone) body.phone = phone;
  if (email) body.email = email;
  if (country) body.country = country;
  if (region) body.region = region;
  if (city) body.city = city;
  if (zone) body.zone = zone;
  if (wereda) body.wereda = wereda;
  if (kebele) body.kebele = kebele;
  if (locality) body.locality = locality;
  if (street) body.street = street;
  if (houseNumber) body.house_number = houseNumber;
  body.transaction_type = transactionType;
  if (idType) body.id_type = idType;
  if (idNumber) body.id_number = idNumber;

  const response = await apiRequest<unknown>('/sales/customers', {
    method: 'POST',
    body,
  });
  const raw = unwrapData<ApiCustomer>(response);
  return mapApiCustomer(raw);
}

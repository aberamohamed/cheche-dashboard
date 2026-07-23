import { apiRequest, authServiceRequest } from '@/services/apiClient';
import { ensureSalesSession } from '@/services/sessionService';
import { useAuthStore } from '@/store/authStore';
import type { Business, User } from '@/types';
import type { ApiLoginResponse, ApiOrganization, ApiUser } from '@/types/api';
import {
    getAccessToken,
    getRefreshToken,
    mapApiUser,
    mapApiUserToBusiness,
    normalizeApiRoles,
    unwrapData,
    unwrapList,
} from '@/utils/apiHelpers';
import type { OnboardingBilling, OnboardingPlanId } from '@/data/onboardingPlans';
import { normalizePhone } from '@/utils/phone';
import { resolveIsGuestUser } from '@/utils/guestSession';

export interface LoginCredentials {
  phone: string;
  password: string;
  organizationId?: string;
}

export interface RegisterBusinessData {
  businessName: string;
  legalName?: string;
  tin?: string;
  businessType: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  workspaceName?: string;
}

export interface RegisterOwnerData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  user: User;
  business: Business;
  token: string;
  refreshToken: string | null;
  organizationId: string | null;
  sessionId: string;
  isGuest: boolean;
  mfaRequired?: boolean;
}

export interface RegisterGuestData {
  phone: string;
  password: string;
}

export interface OnboardingPayload {
  organizationName: string;
  legalName: string;
  tin: string;
  businessType: string;
  adminName: string;
  adminEmail: string;
  phone: string;
  city: string;
  address: string;
  workspaceName: string;
  plan?: string;
  billing?: string;
  isGuest?: boolean;
  password?: string;
}

function fallbackUser(phone: string): User {
  return {
    id: 'user',
    fullName: 'User',
    email: '',
    phone: normalizePhone(phone),
    createdAt: new Date().toISOString(),
  };
}

export async function login(
  credentials: LoginCredentials,
  deviceId: string
): Promise<AuthResult> {
  const phone = normalizePhone(credentials.phone);

  const response = await apiRequest<ApiLoginResponse>('/auth/login', {
    auth: false,
    method: 'POST',
    body: {
      phone,
      password: credentials.password,
    },
  });

  const token = getAccessToken(response);
  if (!token) {
    const mfaRequired = Boolean(
      response.mfaRequired ?? response.data?.mfaRequired
    );
    if (mfaRequired) {
      throw new Error('MFA is required. Please complete verification on web.');
    }
    throw new Error('Invalid login response');
  }

  const refreshToken = getRefreshToken(response);
  const apiUser = response.user ?? response.data?.user;

  useAuthStore.getState().setToken(token);
  useAuthStore.getState().setRefreshToken(refreshToken);

  let profile: User;
  try {
    profile = apiUser ? mapApiUser(apiUser) : await fetchProfile();
  } catch {
    profile = fallbackUser(phone);
  }

  let organizationId =
    apiUser?.organizationId ??
    apiUser?.organization_id ??
    credentials.organizationId ??
    null;

  let org: ApiOrganization | undefined;
  if (!organizationId) {
    try {
      const organizations = await getOrganizations();
      org = organizations[0];
      organizationId = org?.id ?? null;
    } catch {
      // optional during login
    }
  } else {
    try {
      const organizations = await getOrganizations();
      org = organizations.find((item) => item.id === organizationId);
    } catch {
      // optional during login
    }
  }

  const business = mapApiUserToBusiness(
    apiUser ?? { id: profile.id, email: profile.email, phone: profile.phone },
    org?.name ?? org?.organizationName
  );
  const organizationLogo = org?.logo ?? org?.logoUrl ?? org?.image;
  if (organizationLogo) {
    business.logo = String(organizationLogo);
  }

  const isGuest = resolveIsGuestUser(
    business,
    org?.name ?? org?.organizationName
  );

  let sessionId = '';
  try {
    sessionId = await ensureSalesSession();
  } catch {
    // opened lazily at checkout if this fails
  }

  return {
    user: profile,
    business,
    token,
    refreshToken,
    organizationId: organizationId,
    sessionId,
    isGuest,
  };
}

export interface UserProfileDetails {
  user: User;
  organizationId?: string;
  organizationName?: string;
  roles: string[];
}

export async function fetchProfile(): Promise<User> {
  const details = await fetchUserProfileDetails();
  return details.user;
}

export async function fetchUserProfileDetails(): Promise<UserProfileDetails> {
  const response = await apiRequest<unknown>('/auth/me');
  const apiUser = unwrapData<ApiUser>(response);
  const user = mapApiUser(apiUser);
  const organizationId =
    apiUser.organizationId ?? apiUser.organization_id ?? undefined;

  let organizationName: string | undefined;
  if (organizationId) {
    try {
      const organizations = await getOrganizations();
      const org = organizations.find((item) => item.id === organizationId);
      organizationName = org?.name ?? org?.organizationName;
    } catch {
      // optional
    }
  }

  return {
    user,
    organizationId,
    organizationName,
    roles: normalizeApiRoles(apiUser.roles),
  };
}

export async function updatePassword(userId: string, password: string): Promise<void> {
  await apiRequest(`/auth/password/update/${userId}`, {
    method: 'PUT',
    body: { password },
  });
}

export async function getOrganizations(): Promise<ApiOrganization[]> {
  const response = await apiRequest<unknown>('/auth/organizations');
  return unwrapList<ApiOrganization>(response);
}

export async function submitOnboardingRequest(
  business: RegisterBusinessData,
  owner: RegisterOwnerData,
  options: { plan: OnboardingPlanId; billing: OnboardingBilling }
): Promise<{ message: string }> {
  const payload: OnboardingPayload = {
    organizationName: business.businessName,
    legalName: business.legalName ?? business.businessName,
    tin: business.tin ?? '',
    businessType: business.businessType,
    adminName: owner.fullName,
    adminEmail: owner.email,
    phone: normalizePhone(owner.phone || business.phone),
    city: business.city ?? business.address.split(',')[0]?.trim() ?? 'Addis Ababa',
    address: business.address,
    workspaceName: business.workspaceName ?? `${business.businessName} Branch`,
    plan: options.plan,
    billing: options.billing,
    password: owner.password,
  };

  const response = await apiRequest<unknown>('/auth/onboarding/requests', {
    auth: false,
    method: 'POST',
    body: payload,
  });

  return {
    message:
      (unwrapData<{ message?: string }>(response)?.message as string) ??
      'Onboarding request submitted. Awaiting admin approval.',
  };
}

export async function submitGuestOnboardingRequest(
  guest: RegisterGuestData,
  options: { plan: OnboardingPlanId; billing: OnboardingBilling }
): Promise<{ message: string }> {
  const payload: OnboardingPayload = {
    organizationName: 'Guest',
    legalName: 'Guest',
    tin: '',
    businessType: 'guest',
    adminName: 'Guest',
    adminEmail: '',
    phone: normalizePhone(guest.phone),
    city: 'Addis Ababa',
    address: 'Guest',
    workspaceName: 'Guest Workspace',
    plan: options.plan,
    billing: options.billing,
    isGuest: true,
    password: guest.password,
  };

  const response = await apiRequest<unknown>('/auth/onboarding/requests', {
    auth: false,
    method: 'POST',
    body: payload,
  });

  return {
    message:
      (unwrapData<{ message?: string }>(response)?.message as string) ??
      'Guest onboarding request submitted. Awaiting admin approval.',
  };
}

export async function registerBusiness(data: RegisterBusinessData): Promise<Business> {
  return {
    id: 'pending',
    name: data.businessName,
    type: data.businessType as Business['type'],
    phone: data.phone,
    email: data.email,
    address: data.address,
    location: data.city,
    ownerId: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export async function registerOwner(data: RegisterOwnerData): Promise<User> {
  return {
    id: 'pending',
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    createdAt: new Date().toISOString(),
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ token: string; refreshToken: string | null }> {
  const response = await apiRequest<ApiLoginResponse>('/auth/refresh', {
    auth: false,
    method: 'POST',
    body: { refreshToken },
  });
  const token = getAccessToken(response);
  if (!token) throw new Error('Failed to refresh token');
  return {
    token,
    refreshToken: getRefreshToken(response) ?? refreshToken,
  };
}

export async function logoutApi(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors on logout
  }
}

export async function sendOtp(phone: string): Promise<void> {
  await apiRequest('/auth/send-otp', {
    auth: false,
    method: 'POST',
    body: { phone: normalizePhone(phone) },
  });
}

export async function resetPassword(
  mobile: string,
  otp: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/auth/reset-password', {
    auth: false,
    method: 'POST',
    body: {
      mobile: normalizePhone(mobile),
      otp,
      new_password: newPassword,
    },
  });
}

export async function sendOtpAuthService(mobile: string): Promise<void> {
  await authServiceRequest('/users/send-otp', {
    method: 'POST',
    body: { mobile: normalizePhone(mobile) },
  });
}

export async function resetPasswordAuthService(
  mobile: string,
  otp: string,
  newPassword: string
): Promise<void> {
  await authServiceRequest('/users/reset-password', {
    method: 'POST',
    body: {
      mobile: normalizePhone(mobile),
      otp,
      new_password: newPassword,
    },
  });
}

import { apiRequest } from '@/services/apiClient';
import type { OrganizationBranch, User } from '@/types';
import type { ApiBranch, ApiUser } from '@/types/api';
import { mapApiUser, unwrapList } from '@/utils/apiHelpers';

function mapBranch(raw: ApiBranch | Record<string, unknown>): OrganizationBranch {
  const item = raw as ApiBranch;
  return {
    id: String(item.id),
    name: String(
      item.name ?? item.branch_name ?? item.workspace_name ?? item.workspaceName ?? 'Branch'
    ),
    phone: item.phone ? String(item.phone) : undefined,
    email: item.email ? String(item.email) : undefined,
    address: item.address ? String(item.address) : undefined,
    city: item.city ? String(item.city) : undefined,
  };
}

export async function fetchOrganizationBranches(
  organizationId: string
): Promise<OrganizationBranch[]> {
  try {
    const response = await apiRequest<unknown>(
      `/auth/organizations/${organizationId}/branches?page_size=100`
    );
    return unwrapList<ApiBranch>(response).map(mapBranch);
  } catch {
    const response = await apiRequest<unknown>(
      `/auth/organizations/branches?organization_id=${organizationId}&page_size=100`
    );
    return unwrapList<ApiBranch>(response).map(mapBranch);
  }
}

export async function fetchBranchUsers(branchId: string, search?: string): Promise<User[]> {
  const params = new URLSearchParams({
    page_size: '100',
    branch_id: branchId,
  });
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  const response = await apiRequest<unknown>(`/auth/users?${params.toString()}`);
  return unwrapList<ApiUser>(response).map(mapApiUser);
}

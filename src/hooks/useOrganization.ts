import {
  fetchBranchUsers,
  fetchOrganizationBranches,
} from '@/services/organizationService';
import { useQuery } from '@tanstack/react-query';

export function useOrganizationBranches(organizationId?: string) {
  return useQuery({
    queryKey: ['organization-branches', organizationId],
    queryFn: () => fetchOrganizationBranches(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useBranchUsers(branchId?: string, search?: string) {
  return useQuery({
    queryKey: ['branch-users', branchId, search?.trim() ?? ''],
    queryFn: () => fetchBranchUsers(branchId!, search),
    enabled: Boolean(branchId),
  });
}

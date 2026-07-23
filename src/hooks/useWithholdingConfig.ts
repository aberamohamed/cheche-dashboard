import { fetchOrganizationWithholdingConfig } from '@/services/withholdingService';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';

export function useWithholdingConfig() {
  const organizationId = useAuthStore((s) => s.organizationId);

  return useQuery({
    queryKey: ['withholding-config', organizationId],
    queryFn: () => fetchOrganizationWithholdingConfig(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });
}

import { getPurchaseInvoice } from '@/services/purchaseListService';
import { useQuery } from '@tanstack/react-query';

export function usePurchaseInvoice(id?: string) {
  return useQuery({
    queryKey: ['purchase-invoice', id],
    queryFn: () => getPurchaseInvoice(id!),
    enabled: Boolean(id),
  });
}

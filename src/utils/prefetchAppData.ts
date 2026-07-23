import { usePaymentMethodsStore } from '@/store/paymentMethodsStore';
import { usePaymentTermsStore } from '@/store/paymentTermsStore';

/** Warm caches after authentication without blocking navigation. */
export function prefetchAppData(): void {
  usePaymentMethodsStore.getState().prefetchPaymentMethods();
  usePaymentTermsStore.getState().prefetchPaymentTerms();
}

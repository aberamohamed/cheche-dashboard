import { useReceiptStore } from '@/store/receiptStore';
import { router } from 'expo-router';
import { useEffect } from 'react';

/** Legacy route — receipt is shown as a modal on the Sell tab after checkout. */
export default function ReceiptRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/sell');
  }, []);

  useReceiptStore((s) => s.receipt);

  return null;
}

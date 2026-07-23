import { TransactionDetailModal } from '@/components/receipt/TransactionDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/theme';
import { getInvoiceStrings } from '@/i18n/invoice';
import type { TransactionDetail } from '@/types/transactionDetail';
import { findCachedInvoice } from '@/utils/invoiceCache';
import { saleToTransactionDetail } from '@/utils/transactionDetail';
import { useSettingsStore } from '@/store/settingsStore';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [ready, setReady] = useState(false);
  const language = useSettingsStore((s) => s.language);
  const strings = getInvoiceStrings(language);

  const loadFromCache = useCallback(() => {
    if (!id) {
      setDetail(null);
      setReady(true);
      return;
    }

    const sale = findCachedInvoice(queryClient, id);
    setDetail(sale ? saleToTransactionDetail(sale) : null);
    setReady(true);
  }, [id, queryClient]);

  useEffect(() => {
    setReady(false);
    setDetail(null);
    loadFromCache();
  }, [loadFromCache]);

  const reloadDetail = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    const sale = id ? findCachedInvoice(queryClient, id) : null;
    setDetail(sale ? saleToTransactionDetail(sale) : null);
  }, [id, queryClient]);

  if (!ready) {
    return <View style={styles.screen} />;
  }

  if (!detail) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={strings.invoiceDetail} onBack={() => router.back()} />
        <EmptyState title={strings.noInvoicesTitle} message={strings.noInvoicesMessage} />
      </View>
    );
  }

  return (
    <TransactionDetailModal
      presentation="screen"
      visible
      detail={detail}
      onClose={() => router.back()}
      actionMode="invoice"
      onInvoiceUpdated={reloadDetail}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

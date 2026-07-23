import { PurchaseDocumentsScreen } from '@/components/purchase/PurchaseDocumentsScreen';
import { getPurchaseStrings } from '@/i18n/purchase';
import { useSettingsStore } from '@/store/settingsStore';
import { FileText } from 'lucide-react-native';

export default function PurchaseInvoicesScreen() {
  const language = useSettingsStore((s) => s.language);
  const strings = getPurchaseStrings(language);

  return (
    <PurchaseDocumentsScreen
      type="invoices"
      title={strings.purchaseInvoices}
      searchPlaceholder={strings.invoiceSearchPlaceholder}
      emptyTitle={strings.noPurchaseInvoicesTitle}
      emptyMessage={strings.noPurchaseInvoicesMessage}
      icon={FileText}
    />
  );
}

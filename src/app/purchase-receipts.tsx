import { PurchaseDocumentsScreen } from '@/components/purchase/PurchaseDocumentsScreen';
import { getPurchaseStrings } from '@/i18n/purchase';
import { useSettingsStore } from '@/store/settingsStore';
import { Receipt } from 'lucide-react-native';

export default function PurchaseReceiptsScreen() {
  const language = useSettingsStore((s) => s.language);
  const strings = getPurchaseStrings(language);

  return (
    <PurchaseDocumentsScreen
      type="receipts"
      title={strings.purchaseReceipts}
      searchPlaceholder={strings.receiptSearchPlaceholder}
      emptyTitle={strings.noPurchaseReceiptsTitle}
      emptyMessage={strings.noPurchaseReceiptsMessage}
      icon={Receipt}
    />
  );
}

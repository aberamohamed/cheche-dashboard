import { PurchaseDocumentsScreen } from '@/components/purchase/PurchaseDocumentsScreen';
import { getPurchaseStrings } from '@/i18n/purchase';
import { useSettingsStore } from '@/store/settingsStore';
import { RotateCcw } from 'lucide-react-native';

export default function PurchaseReturnsScreen() {
  const language = useSettingsStore((s) => s.language);
  const strings = getPurchaseStrings(language);

  return (
    <PurchaseDocumentsScreen
      type="returns"
      title={strings.purchaseReturns}
      searchPlaceholder={strings.returnSearchPlaceholder}
      emptyTitle={strings.noPurchaseReturnsTitle}
      emptyMessage={strings.noPurchaseReturnsMessage}
      icon={RotateCcw}
    />
  );
}

import { LanguageDropdown } from '@/components/settings/LanguageDropdown';

interface LanguagePickerModalProps {
  visible: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (languageId: string) => void;
}

/** Controlled language dropdown for screens like More (superapp-style list). */
export function LanguagePickerModal({
  visible,
  selectedId,
  onClose,
  onSelect,
}: LanguagePickerModalProps) {
  return (
    <LanguageDropdown
      selectedId={selectedId}
      onSelect={onSelect}
      variant="default"
      visible={visible}
      onClose={onClose}
      hideTrigger
    />
  );
}

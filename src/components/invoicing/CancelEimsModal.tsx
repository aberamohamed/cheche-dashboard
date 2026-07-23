import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  cancelInvoiceEims,
  fetchEimsCancelReasons,
} from '@/services/invoiceAdjustmentService';
import { EIMS_CANCEL_REASONS } from '@/types/invoiceAdjustment';
import { appAlert } from '@/utils/alert';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, TriangleAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface CancelEimsModalProps {
  visible: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelEimsModal({
  visible,
  invoiceId,
  onClose,
  onSuccess,
}: CancelEimsModalProps) {
  const [reasonCode, setReasonCode] = useState('');
  const [remark, setRemark] = useState('');
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: reasons = EIMS_CANCEL_REASONS,
    isLoading: reasonsLoading,
  } = useQuery({
    queryKey: ['eims-cancel-reasons'],
    queryFn: fetchEimsCancelReasons,
    enabled: visible,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!visible) {
      setReasonCode('');
      setRemark('');
      setReasonPickerOpen(false);
      setSubmitting(false);
      setErrorMessage(null);
    }
  }, [visible]);

  // Default to the first available reason once the list is loaded.
  useEffect(() => {
    if (visible && !reasonCode && reasons.length > 0) {
      setReasonCode(reasons[0].code);
    }
  }, [visible, reasonCode, reasons]);

  const selectedReason = useMemo(
    () => reasons.find((reason) => reason.code === reasonCode) ?? reasons[0],
    [reasons, reasonCode]
  );

  const handleConfirm = async () => {
    if (!invoiceId || submitting || !reasonCode) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await cancelInvoiceEims(invoiceId, reasonCode, remark);
      onClose();
      onSuccess();
      appAlert(
        'Invoice Cancelled',
        'The invoice has been cancelled on EIMS.',
        undefined,
        { variant: 'success' }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to cancel invoice on EIMS.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ModalSheetHeader title="Cancel EIMS Invoice" onBack={onClose} />

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <TriangleAlert size={16} color={Colors.danger} strokeWidth={2.4} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.subtitle}>
                Are you sure you want to cancel this invoice on EIMS? This action cannot be
                undone and will explicitly update its status on the Ministry of Revenues
                servers.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Cancellation Reason</Text>
                <Pressable
                  style={styles.select}
                  onPress={() => setReasonPickerOpen((open) => !open)}
                >
                  {reasonsLoading && !selectedReason ? (
                    <View style={styles.selectLoading}>
                      <ActivityIndicator size="small" color={Colors.textSecondary} />
                      <Text style={styles.selectPlaceholder}>Loading reasons…</Text>
                    </View>
                  ) : (
                    <Text style={styles.selectValue}>
                      {selectedReason?.label ?? 'Select a reason'}
                    </Text>
                  )}
                  <ChevronDown size={18} color={Colors.textSecondary} />
                </Pressable>
                {reasonPickerOpen ? (
                  <View style={styles.reasonList}>
                    {reasons.map((reason) => {
                      const active = reason.code === reasonCode;
                      return (
                        <Pressable
                          key={reason.code}
                          style={[styles.reasonRow, active && styles.reasonRowActive]}
                          onPress={() => {
                            setReasonCode(reason.code);
                            setReasonPickerOpen(false);
                          }}
                        >
                          <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]}>
                            {reason.label}
                          </Text>
                          {active ? <Check size={16} color={Brand.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <Input
                label="Additional Remark (Optional)"
                placeholder="E.g. Voided due to incorrect tin."
                value={remark}
                onChangeText={setRemark}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={styles.footerBtn}
              />
              <Button
                title="Confirm"
                variant="destructive"
                loading={submitting}
                onPress={handleConfirm}
                style={styles.footerBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrap: {
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '100%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.danger,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 16,
  },
  subtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  field: { gap: 8 },
  label: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  selectPlaceholder: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  reasonList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  reasonRowActive: {
    backgroundColor: Brand.primaryMuted,
  },
  reasonLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  reasonLabelActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerBtn: {
    flex: 1,
  },
});

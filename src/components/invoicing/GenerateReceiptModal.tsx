import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheetHeader } from '@/components/ui/ModalSheetHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  createInvoiceReceipt,
  type PaymentCoverage,
  type ReceiptPaymentMode,
} from '@/services/receiptCreationService';
import { fetchProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { TransactionDetail } from '@/types/transactionDetail';
import { appAlert } from '@/utils/alert';
import { formatCurrency } from '@/utils/format';
import { resolveInvoicingApiId } from '@/utils/invoicingIds';
import {
  canUsePartialPaymentCoverage,
  getInvoiceRemainingBalance,
} from '@/utils/invoicePayment';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAYMENT_MODES: { value: ReceiptPaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

interface GenerateReceiptModalProps {
  visible: boolean;
  detail: TransactionDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CoverageOption({
  label,
  description,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.coverageOption,
        selected && styles.coverageOptionSelected,
        disabled && styles.coverageOptionDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <View style={styles.coverageOptionCopy}>
        <Text style={[styles.coverageOptionLabel, selected && styles.coverageOptionLabelActive]}>
          {label}
        </Text>
        <Text style={styles.coverageOptionHint}>{description}</Text>
      </View>
    </Pressable>
  );
}

export function GenerateReceiptModal({
  visible,
  detail,
  onClose,
  onSuccess,
}: GenerateReceiptModalProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [reason, setReason] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState<ReceiptPaymentMode>('CASH');
  const [collectorName, setCollectorName] = useState('');
  const [provider, setProvider] = useState('');
  const [providerName, setProviderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [paymentCoverage, setPaymentCoverage] = useState<PaymentCoverage>('FULL');
  const [partialAmount, setPartialAmount] = useState('');
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = detail?.total ?? 0;
  const paidAmount = detail?.paidAmount ?? 0;
  const remainingBalance = useMemo(
    () => getInvoiceRemainingBalance(paidAmount, totalAmount),
    [paidAmount, totalAmount]
  );
  const allowPartial = useMemo(
    () => canUsePartialPaymentCoverage(paidAmount, totalAmount, detail?.status),
    [paidAmount, totalAmount, detail?.status]
  );
  const receiptAmount = useMemo(() => {
    if (paymentCoverage === 'FULL') return remainingBalance;
    const value = Number(partialAmount);
    return Number.isFinite(value) ? value : 0;
  }, [paymentCoverage, partialAmount, remainingBalance]);

  const loggedInCollectorName = useMemo(() => user?.fullName?.trim() ?? '', [user?.fullName]);

  useEffect(() => {
    if (!visible) {
      setReason('');
      setModeOfPayment('CASH');
      setCollectorName('');
      setProvider('');
      setProviderName('');
      setAccountNumber('');
      setTransactionNumber('');
      setPaymentCoverage('FULL');
      setPartialAmount('');
      setModePickerOpen(false);
      setSubmitting(false);
      return;
    }

    setCollectorName(loggedInCollectorName);
    setPartialAmount(remainingBalance > 0 ? String(remainingBalance) : '');
    setPaymentCoverage('FULL');

    if (!loggedInCollectorName || loggedInCollectorName === 'User') {
      let cancelled = false;
      fetchProfile()
        .then((profile) => {
          if (cancelled) return;
          if (profile.fullName.trim() && profile.fullName !== 'User') {
            setCollectorName(profile.fullName);
            setUser(profile);
          }
        })
        .catch(() => {
          // keep current collector name
        });

      return () => {
        cancelled = true;
      };
    }
  }, [visible, loggedInCollectorName, remainingBalance, setUser]);

  const handleSubmit = async () => {
    if (!detail?.recordId || submitting) return;

    if (remainingBalance <= 0.01) {
      appAlert('Already Paid', 'This invoice is already fully paid.', undefined, {
        variant: 'info',
      });
      return;
    }

    if (receiptAmount <= 0) {
      appAlert('Invalid Amount', 'Collected amount must be greater than zero.', undefined, {
        variant: 'error',
      });
      return;
    }

    if (receiptAmount > remainingBalance + 0.01) {
      appAlert(
        'Invalid Amount',
        `Amount cannot exceed the remaining balance (${formatCurrency(remainingBalance)}).`,
        undefined,
        { variant: 'error' }
      );
      return;
    }

    const collector = collectorName.trim() || loggedInCollectorName || 'Collector';
    const invoiceId = resolveInvoicingApiId(detail);
    if (!invoiceId) {
      appAlert('Unavailable', 'Invoice UUID is missing for this document.', undefined, {
        variant: 'error',
      });
      return;
    }
    const defaultReason = 'Payment for goods purchased';

    setSubmitting(true);
    try {
      await createInvoiceReceipt({
        reason: reason.trim() || defaultReason,
        collectedAmount: receiptAmount,
        invoice: {
          id: invoiceId,
          irn: detail.irn,
          paymentCoverage,
          invoicePaidAmount: receiptAmount,
          remainingAmount: remainingBalance - receiptAmount,
          totalAmount,
        },
        modeOfPayment,
        collectorName: collector,
        provider,
        providerName,
        accountNumber,
        transactionNumber,
      });

      onClose();
      onSuccess();
      appAlert(
        'Receipt Created',
        'Receipt created and registered with EIRMS.',
        undefined,
        { variant: 'success' }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to generate receipt.';
      appAlert('Receipt Failed', message, undefined, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!detail) return null;

  const title = `Generate Receipt for ${detail.invoiceNumber}`;

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
            <ModalSheetHeader title={title} onBack={onClose} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Reason"
                placeholder="Payment for goods purchased"
                value={reason}
                onChangeText={setReason}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Mode of Payment</Text>
                  <Pressable
                    style={styles.select}
                    onPress={() => setModePickerOpen((open) => !open)}
                  >
                    <Text style={styles.selectValue}>
                      {PAYMENT_MODES.find((mode) => mode.value === modeOfPayment)?.label ?? 'Cash'}
                    </Text>
                  </Pressable>
                  {modePickerOpen ? (
                    <View style={styles.optionList}>
                      {PAYMENT_MODES.map((mode) => {
                        const active = mode.value === modeOfPayment;
                        return (
                          <Pressable
                            key={mode.value}
                            style={[styles.optionRow, active && styles.optionRowActive]}
                            onPress={() => {
                              setModeOfPayment(mode.value);
                              setModePickerOpen(false);
                            }}
                          >
                            <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                              {mode.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
                <View style={styles.col}>
                  <Input
                    label="Collector Name"
                    placeholder="Jane Doe"
                    value={collectorName}
                    onChangeText={setCollectorName}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Input
                    label="Provider"
                    placeholder="Bank"
                    value={provider}
                    onChangeText={setProvider}
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="Provider Name"
                    placeholder="CBE"
                    value={providerName}
                    onChangeText={setProviderName}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Input
                    label="Account Number"
                    placeholder="123456789"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="Transaction ID"
                    placeholder="TRX987654321"
                    value={transactionNumber}
                    onChangeText={setTransactionNumber}
                  />
                </View>
              </View>

              <View style={styles.coverageSection}>
                <Text style={styles.coverageTitle}>Payment Coverage</Text>
                <CoverageOption
                  label="Full"
                  description="Collect full remaining balance"
                  selected={paymentCoverage === 'FULL'}
                  onPress={() => setPaymentCoverage('FULL')}
                />
                <CoverageOption
                  label="Partial"
                  description="Collect part of the remaining balance"
                  selected={paymentCoverage === 'PARTIAL'}
                  disabled={!allowPartial}
                  onPress={() => setPaymentCoverage('PARTIAL')}
                />
              </View>

              {paymentCoverage === 'PARTIAL' && allowPartial ? (
                <Input
                  label="Amount to Pay"
                  placeholder="0.00"
                  value={partialAmount}
                  onChangeText={setPartialAmount}
                  keyboardType="decimal-pad"
                />
              ) : null}

              <View style={styles.summaryCard}>
                <SummaryRow label="Total Invoice Amount" value={formatCurrency(totalAmount)} />
                <SummaryRow label="Remaining Balance" value={formatCurrency(remainingBalance)} />
                <SummaryRow
                  label="This Receipt"
                  value={formatCurrency(receiptAmount)}
                  accent
                  bold
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button title="Cancel" variant="outline" onPress={onClose} style={styles.footerBtn} />
              <Button
                title="Generate Receipt"
                loading={submitting}
                onPress={handleSubmit}
                style={styles.footerBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.summaryBold,
          accent && styles.summaryAccent,
        ]}
      >
        {value}
      </Text>
    </View>
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
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 8,
  },
  label: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  select: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectValue: {
    ...Typography.body,
    color: Colors.text,
  },
  optionList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionRowActive: {
    backgroundColor: Brand.primaryMuted,
  },
  optionLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  optionLabelActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
  coverageSection: {
    gap: 10,
  },
  coverageTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  coverageOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  coverageOptionSelected: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  coverageOptionDisabled: {
    opacity: 0.45,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: Brand.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.primary,
  },
  coverageOptionCopy: {
    flex: 1,
    gap: 2,
  },
  coverageOptionLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  coverageOptionLabelActive: {
    color: Brand.primary,
  },
  coverageOptionHint: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...Typography.caption1,
    color: Colors.text,
    textAlign: 'right',
  },
  summaryBold: {
    fontWeight: '700',
  },
  summaryAccent: {
    color: Brand.primary,
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

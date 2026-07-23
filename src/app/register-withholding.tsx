import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { useWithholdingConfig } from '@/hooks/useWithholdingConfig';
import {
  computeWithholdingAmount,
  registerVatWithholdingReceipt,
  registerWithholdingReceipt,
  type WithholdingFormType,
} from '@/services/withholdingService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function ReadOnlyField({
  label,
  value,
  helperText,
  accent,
}: {
  label: string;
  value: string;
  helperText?: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.readOnlyField, accent && styles.amountField]}>
        <Text style={[styles.readOnlyText, accent && styles.amountText]}>{value}</Text>
      </View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.select} onPress={onPress}>
        <Text style={styles.selectText}>{value}</Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export default function RegisterWithholdingScreen() {
  const { type: typeParam } = useLocalSearchParams<{
    type?: string;
    invoiceNumber?: string;
  }>();
  const type: WithholdingFormType = typeParam === 'vat' ? 'vat' : 'standard';
  const isVat = type === 'vat';

  const queryClient = useQueryClient();
  const configQuery = useWithholdingConfig();
  const config = configQuery.data;

  const [invoiceIrn, setInvoiceIrn] = useState('');
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [withholdingCategory, setWithholdingCategory] = useState(
    () => config?.withholdingCategories?.[0] ?? 'B2B'
  );
  const [reason, setReason] = useState(
    isVat ? 'VAT withhold for goods purchased' : 'Withhold for goods purchased.'
  );
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const configuredRate = isVat ? config?.vatWithholdRate ?? 50 : config?.withholdRate ?? 3;
  const sourceSystemNumber = config?.sourceSystemNumber ?? '';
  const categories = config?.withholdingCategories ?? ['B2B', 'B2C'];

  const withholdingAmount = useMemo(
    () => computeWithholdingAmount(parseAmount(baseAmount), configuredRate),
    [baseAmount, configuredRate]
  );

  const title = isVat ? 'Register VAT Withholding Receipt' : 'Register Withholding Receipt';

  const handleSubmit = async () => {
    if (!invoiceIrn.trim()) {
      appAlert('Missing Field', "Supplier's Invoice IRN is required.", undefined, {
        variant: 'warning',
      });
      return;
    }

    const amountValue = parseAmount(baseAmount);
    if (amountValue <= 0) {
      appAlert(
        'Missing Field',
        isVat ? 'VAT Amount must be greater than zero.' : 'Pre-Tax Amount must be greater than zero.',
        undefined,
        { variant: 'warning' }
      );
      return;
    }

    if (!reason.trim()) {
      appAlert('Missing Field', 'Reason is required.', undefined, { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      await withLoading(async () => {
        if (isVat) {
          await registerVatWithholdingReceipt({
            invoiceIrn: invoiceIrn.trim(),
            manualReceiptNumber: manualReceiptNumber.trim() || undefined,
            vatAmount: amountValue,
            withholdRate: configuredRate,
            withholdingAmount,
            reason: reason.trim(),
            sourceSystemNumber,
          });
        } else {
          await registerWithholdingReceipt({
            invoiceIrn: invoiceIrn.trim(),
            manualReceiptNumber: manualReceiptNumber.trim() || undefined,
            preTaxAmount: amountValue,
            withholdingCategory,
            withholdRate: configuredRate,
            withholdingAmount,
            reason: reason.trim(),
            sourceSystemNumber,
          });
        }
      }, isVat ? 'Registering VAT withholding...' : 'Registering withholding...');

      await queryClient.invalidateQueries({ queryKey: ['withholding-receipts'] });
      appAlert(
        isVat ? 'VAT Withholding Registered' : 'Withholding Registered',
        'The withholding receipt was created successfully.',
        [{ text: 'OK', onPress: () => router.back() }],
        { variant: 'success' }
      );
    } catch (error) {
      appAlert('Registration Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Invoice IRN"
            placeholder="Supplier's Invoice IRN"
            value={invoiceIrn}
            onChangeText={setInvoiceIrn}
            autoCapitalize="characters"
          />

          <Input
            label="Manual Receipt #"
            placeholder="Optional"
            value={manualReceiptNumber}
            onChangeText={setManualReceiptNumber}
          />

          <Input
            label={isVat ? 'VAT Amount (ETB)' : 'Pre-Tax Amount (ETB)'}
            placeholder="0"
            value={baseAmount}
            onChangeText={setBaseAmount}
            keyboardType="decimal-pad"
          />

          {!isVat ? (
            <SelectField
              label="Withholding Category"
              value={withholdingCategory}
              onPress={() => setCategoryPickerOpen(true)}
            />
          ) : null}

          <ReadOnlyField
            label="Configured Rate (%)"
            value={String(configuredRate)}
            helperText="Configured by Super Admin under organization details."
          />

          <ReadOnlyField
            label="Withholding Amount (ETB)"
            value={String(withholdingAmount)}
            accent
          />

          <Input
            label="Reason"
            placeholder={isVat ? 'VAT withhold for goods purchased' : 'Withhold for goods purchased.'}
            value={reason}
            onChangeText={setReason}
          />

          <ReadOnlyField
            label="Source system number"
            value={sourceSystemNumber || '—'}
            helperText="Defaults from your organization configuration. The printed document uses that value, not your TIN."
          />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Button
              title={isVat ? 'Register VAT Withholding' : 'Register Withholding'}
              onPress={() => void handleSubmit()}
              loading={submitting}
              disabled={submitting}
              style={styles.submitBtn}
              fullWidth={false}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal
        visible={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        title="Withholding Category"
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            style={styles.categoryOption}
            onPress={() => {
              setWithholdingCategory(category);
              setCategoryPickerOpen(false);
            }}
          >
            <Text
              style={[
                styles.categoryOptionText,
                category === withholdingCategory && styles.categoryOptionTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1, backgroundColor: Colors.white },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '500',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },
  selectText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  readOnlyField: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  readOnlyText: {
    ...Typography.body,
    color: Colors.text,
  },
  amountField: {
    backgroundColor: '#ECFDF3',
    borderColor: '#BBF7D0',
  },
  amountText: {
    color: Colors.success,
    fontWeight: '700',
  },
  helperText: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  footerSafe: {
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  cancelText: {
    ...Typography.headline,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitBtn: { flex: 1.4, height: 52 },
  categoryOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  categoryOptionText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  categoryOptionTextActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
});

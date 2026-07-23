import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  createExchangeRateSchema,
  type CreateExchangeRateForm,
} from '@/features/pricing/exchangeRateSchemas';
import { useExchangeRateFormOptions } from '@/hooks/usePricing';
import { createExchangeRate } from '@/services/pricingService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { ArrowLeftRight, ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function SelectField({
  label,
  value,
  placeholder,
  error,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={[styles.select, error && styles.selectError]} onPress={onPress}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function CreateExchangeRateScreen() {
  const queryClient = useQueryClient();
  const formOptionsQuery = useExchangeRateFormOptions();
  const insets = useSafeAreaInsets();
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [customCurrencyCode, setCustomCurrencyCode] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateExchangeRateForm>({
    resolver: zodResolver(createExchangeRateSchema),
    defaultValues: {
      currencyCode: '',
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
      rateToEtb: 0,
    },
  });

  const currencyCode = watch('currencyCode');
  const currencyCodes = formOptionsQuery.data?.currencyCodes ?? [];

  const filteredCurrencyCodes = useMemo(() => {
    const q = currencySearch.trim().toLowerCase();
    if (!q) return currencyCodes;
    return currencyCodes.filter((code) => code.toLowerCase().includes(q));
  }, [currencyCodes, currencySearch]);

  const rateLabel = currencyCode
    ? `Rate to ETB (1 ${currencyCode} = ? ETB)`
    : 'Rate to ETB';

  const onSubmit = async (data: CreateExchangeRateForm) => {
    try {
      await withLoading(async () => {
        await createExchangeRate(data);
      }, 'Saving exchange rate...');
      await queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      await queryClient.invalidateQueries({ queryKey: ['exchange-rate-form-options'] });
      reset();
      appAlert('Exchange Rate Saved', 'The exchange rate has been saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Save Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const closeCurrencyPicker = () => {
    setCurrencySearch('');
    setCustomCurrencyCode('');
    setCurrencyPickerOpen(false);
  };

  const selectCurrency = (code: string) => {
    setValue('currencyCode', code, { shouldValidate: true });
    closeCurrencyPicker();
  };

  const applyCustomCurrency = () => {
    const code = customCurrencyCode.trim().toUpperCase();
    if (code.length !== 3) {
      appAlert('Invalid Code', 'Enter a 3-letter currency code.', undefined, { variant: 'error' });
      return;
    }
    selectCurrency(code);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Add Exchange Rate" onBack={() => router.back()} />

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
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <ArrowLeftRight size={18} color={Brand.primary} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Add exchange rate</Text>
              <Text style={styles.heroSubtitle}>
                Pick an existing currency or create a new code, then set how many ETB equal 1 unit
                on the effective date.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Controller
              control={control}
              name="currencyCode"
              render={() => (
                <SelectField
                  label="Currency code"
                  value={currencyCode}
                  placeholder="Select currency"
                  error={errors.currencyCode?.message}
                  onPress={() => {
                    setCurrencySearch('');
                    setCustomCurrencyCode('');
                    setCurrencyPickerOpen(true);
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="effectiveDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  label="Effective date"
                  value={value ?? ''}
                  onChange={onChange}
                  error={errors.effectiveDate?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="rateToEtb"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={rateLabel}
                  placeholder="0.00"
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(text) => {
                    const parsed = Number(text);
                    onChange(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  error={errors.rateToEtb?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            fullWidth={false}
            style={styles.cancelBtn}
          />
          <Button
            title="Save"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth={false}
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={currencyPickerOpen}
        onClose={closeCurrencyPicker}
        title="Currency Code"
        keyboardAvoiding
      >
        <View style={styles.modalBody}>
          <SearchBar
            placeholder="Search currency..."
            value={currencySearch}
            onChangeText={setCurrencySearch}
          />

          <FlatList
            data={filteredCurrencyCodes}
            keyExtractor={(code) => code}
            style={styles.currencyList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item: code }) => {
              const active = currencyCode === code;
              return (
                <Pressable
                  style={[styles.currencyRow, active && styles.currencyRowActive]}
                  onPress={() => selectCurrency(code)}
                >
                  <Text style={[styles.currencyText, active && styles.currencyTextActive]}>
                    {code}
                  </Text>
                </Pressable>
              );
            }}
          />

          <View style={styles.customCurrencyBox}>
            <Text style={styles.customCurrencyLabel}>Create new currency code</Text>
            <Input
              placeholder="ABC"
              value={customCurrencyCode}
              onChangeText={(text) => setCustomCurrencyCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={3}
            />
            <Button title="Use" onPress={applyCustomCurrency} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { ...Typography.headline, color: Colors.text, fontWeight: '700' },
  heroSubtitle: { ...Typography.subhead, color: Colors.textSecondary, lineHeight: 20 },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectError: { borderColor: Colors.danger },
  selectText: { ...Typography.body, color: Colors.text, flex: 1 },
  selectPlaceholder: { color: Colors.textTertiary },
  fieldError: { ...Typography.caption1, color: Colors.danger },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1.2 },
  modalBody: { gap: 12 },
  currencyList: { maxHeight: 240 },
  currencyRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  currencyRowActive: { backgroundColor: Brand.primaryMuted },
  currencyText: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  currencyTextActive: { color: Brand.primary },
  customCurrencyBox: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: 10,
  },
  customCurrencyLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
});

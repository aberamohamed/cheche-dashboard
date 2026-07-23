import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Radius, Typography } from '@/constants/theme';
import { createGiftCardSchema, type CreateGiftCardForm } from '@/features/pricing/schemas';
import { issueGiftCard } from '@/services/pricingService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { generateGiftCardNumber } from '@/utils/giftCard';
import { withLoading } from '@/utils/withLoading';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Gift } from 'lucide-react-native';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function CreateGiftCardScreen() {
  const queryClient = useQueryClient();
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGiftCardForm>({
    resolver: zodResolver(createGiftCardSchema),
    defaultValues: {
      cardNumber: '',
      initialBalance: 0,
      expiryDate: '',
    },
  });

  const handleGenerate = () => {
    setValue('cardNumber', generateGiftCardNumber(), { shouldValidate: true });
  };

  const onSubmit = async (data: CreateGiftCardForm) => {
    try {
      await withLoading(async () => {
        await issueGiftCard(data);
      }, 'Issuing gift card...');
      await queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      reset();
      appAlert('Gift Card Issued', 'The gift card has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Issue Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Issue Gift Card" onBack={() => router.back()} />

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
          <Text style={styles.lead}>Create a new gift card for a customer.</Text>

          <View style={styles.formCard}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Card Number</Text>
              <View style={styles.inlineRow}>
                <View style={styles.inlineInput}>
                  <Controller
                    control={control}
                    name="cardNumber"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        placeholder="GC1234567890"
                        value={value}
                        onChangeText={(text) => onChange(text.toUpperCase())}
                        error={errors.cardNumber?.message}
                        icon={<Gift size={20} color={Colors.textSecondary} />}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    )}
                  />
                </View>
                <Button
                  title="Generate"
                  variant="outline"
                  onPress={handleGenerate}
                  fullWidth={false}
                  style={styles.generateBtn}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="initialBalance"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Initial Balance (ETB)"
                  placeholder="0"
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(text) => {
                    const parsed = Number(text);
                    onChange(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  error={errors.initialBalance?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="expiryDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  label="Expiry Date (Optional)"
                  placeholder="mm/dd/yyyy"
                  value={value ?? ''}
                  onChange={onChange}
                  error={errors.expiryDate?.message}
                  minimumDate={today}
                  clearable
                />
              )}
            />
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              fullWidth={false}
              style={styles.cancelBtn}
            />
            <Button
              title="Issue Gift Card"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  lead: { ...Typography.subhead, color: Colors.textSecondary },
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
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inlineInput: { flex: 1 },
  generateBtn: {
    minWidth: 104,
    height: 50,
    marginTop: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1.4 },
});

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingToggle } from '@/components/settings/SettingToggle';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  createCouponSchema,
  DISCOUNT_TYPES,
  type CreateCouponForm,
  type DiscountTypeId,
} from '@/features/pricing/schemas';
import { createCoupon } from '@/services/pricingService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ChevronDown, Tag } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

export default function CreateCouponScreen() {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCouponForm>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: '',
      name: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUsage: '100',
      perCustomerLimit: 1,
      minimumPurchase: '',
      active: true,
    },
  });

  const discountType = watch('discountType');
  const discountTypeLabel =
    DISCOUNT_TYPES.find((option) => option.id === discountType)?.label ?? 'Percentage';

  const onSubmit = async (data: CreateCouponForm) => {
    try {
      await withLoading(async () => {
        await createCoupon(data);
      }, 'Creating coupon...');
      await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      reset();
      appAlert('Coupon Created', 'Your discount coupon has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Create Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Create Coupon" onBack={() => router.back()} />

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
          <Text style={styles.lead}>Create a discount coupon code for your customers.</Text>

          <View style={styles.formCard}>
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Coupon Code"
                  placeholder="SAVE20"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  error={errors.code?.message}
                  icon={<Tag size={20} color={Colors.textSecondary} />}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              )}
            />

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Name (Optional)"
                  placeholder="Summer Sale 2026"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="discountType"
              render={() => (
                <SelectField
                  label="Discount Type"
                  value={discountTypeLabel}
                  placeholder="Select discount type"
                  onPress={() => setPickerOpen(true)}
                />
              )}
            />

            <Controller
              control={control}
              name="discountValue"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (ETB)'}
                  placeholder="0"
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(text) => {
                    const parsed = Number(text);
                    onChange(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  error={errors.discountValue?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="maxUsage"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Max Usage (Optional)"
                  placeholder="100"
                  value={value}
                  onChangeText={onChange}
                  error={errors.maxUsage?.message}
                  keyboardType="number-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="perCustomerLimit"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Per Customer Limit"
                  placeholder="1"
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(text) => {
                    const parsed = Number(text);
                    onChange(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  error={errors.perCustomerLimit?.message}
                  keyboardType="number-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="minimumPurchase"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Minimum Purchase (Optional)"
                  placeholder="500"
                  value={value}
                  onChangeText={onChange}
                  error={errors.minimumPurchase?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="active"
              render={({ field: { value, onChange } }) => (
                <View style={styles.toggleWrap}>
                  <SettingToggle label="Active" value={value} onValueChange={onChange} />
                </View>
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
              title="Create Coupon"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Discount Type">
        <View style={styles.pickerList}>
          {DISCOUNT_TYPES.map((option) => {
            const active = discountType === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.pickerOption, active && styles.pickerOptionActive]}
                onPress={() => {
                  setValue('discountType', option.id as DiscountTypeId, { shouldValidate: true });
                  setPickerOpen(false);
                }}
              >
                <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
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
  toggleWrap: {
    marginHorizontal: -16,
    marginBottom: -16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1.4 },
  pickerList: { gap: 8 },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  pickerOptionActive: {
    backgroundColor: Brand.primaryMuted,
    borderColor: Brand.primary,
  },
  pickerOptionText: { ...Typography.body, color: Colors.text },
  pickerOptionTextActive: { color: Brand.primary, fontWeight: '600' },
});

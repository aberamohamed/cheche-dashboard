import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingToggle } from '@/components/settings/SettingToggle';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  PROMOTION_APPLICATIONS,
  PROMOTION_TYPES,
  createPromotionSchema,
  type CreatePromotionForm,
  type PromotionTypeId,
} from '@/features/pricing/promotionSchemas';
import { usePromotionFormOptions } from '@/hooks/usePricing';
import { createPromotion } from '@/services/pricingService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronDown, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type PickerKind = 'application' | 'condition' | 'rewardType' | null;

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

function LimitInput({
  label,
  value,
  onChangeText,
  error,
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  error?: string;
}) {
  return (
    <View style={styles.limitField}>
      <Text style={styles.limitLabel}>{label}</Text>
      <TextInput
        style={[styles.limitInput, error && styles.limitInputError]}
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder="∞"
        placeholderTextColor={Colors.textTertiary}
        keyboardType="number-pad"
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function CreatePromotionScreen() {
  const queryClient = useQueryClient();
  const formOptionsQuery = usePromotionFormOptions();
  const [pickerOpen, setPickerOpen] = useState<PickerKind>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePromotionForm>({
    resolver: zodResolver(createPromotionSchema),
    defaultValues: {
      promotionType: 'discount',
      name: '',
      description: '',
      application: 'automatic',
      priority: 0,
      condition: '',
      rewardType: '',
      maxDiscountCap: '',
      startDate: '',
      endDate: '',
      stackable: true,
      excludeAlreadyDiscounted: false,
      maxUsesTotal: '',
      maxUsesPerCustomer: '',
      maxUsesPerOrder: '1',
      active: true,
    },
  });

  const promotionType = watch('promotionType');
  const application = watch('application');
  const condition = watch('condition');
  const rewardType = watch('rewardType');

  const selectedType = useMemo(
    () => PROMOTION_TYPES.find((option) => option.id === promotionType) ?? PROMOTION_TYPES[0],
    [promotionType]
  );

  const conditions = formOptionsQuery.data?.conditions ?? [];
  const rewardTypes = formOptionsQuery.data?.rewardTypes ?? [];

  const applicationLabel =
    PROMOTION_APPLICATIONS.find((option) => option.id === application)?.label ?? 'Automatic';
  const conditionLabel = conditions.find((option) => option.id === condition)?.label;
  const rewardTypeLabel = rewardTypes.find((option) => option.id === rewardType)?.label;

  const pickerOptions = useMemo(() => {
    if (pickerOpen === 'application') return PROMOTION_APPLICATIONS;
    if (pickerOpen === 'condition') return conditions;
    if (pickerOpen === 'rewardType') return rewardTypes;
    return [];
  }, [pickerOpen, conditions, rewardTypes]);

  const pickerTitle =
    pickerOpen === 'application'
      ? 'Application'
      : pickerOpen === 'condition'
        ? 'Condition'
        : pickerOpen === 'rewardType'
          ? 'Reward Type'
          : '';

  const pickerValue =
    pickerOpen === 'application'
      ? application
      : pickerOpen === 'condition'
        ? condition
        : pickerOpen === 'rewardType'
          ? rewardType
          : '';

  const onSubmit = async (data: CreatePromotionForm) => {
    try {
      await withLoading(async () => {
        await createPromotion(data);
      }, 'Creating promotion...');
      await queryClient.invalidateQueries({ queryKey: ['promotions'] });
      reset();
      appAlert('Promotion Created', 'Your promotion has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Create Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Create Promotion" onBack={() => router.back()} />

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
              <Plus size={18} color={Brand.primary} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Create New Promotion</Text>
              <Text style={styles.heroSubtitle}>Set up a new promotion for your customers.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Promotion Type</Text>
            <View style={styles.typeGrid}>
              {PROMOTION_TYPES.map(({ id, label, Icon }) => {
                const active = promotionType === id;
                return (
                  <Pressable
                    key={id}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                    onPress={() =>
                      setValue('promotionType', id as PromotionTypeId, { shouldValidate: true })
                    }
                  >
                    <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
                      <Icon size={18} color={active ? Brand.primary : Colors.textSecondary} />
                    </View>
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]} numberOfLines={2}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.typeHint}>{selectedType.description}</Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Promotion Name"
                  placeholder="e.g., Weekend Happy Hour 15% Off"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Description — optional</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe the promotion for internal reference..."
                    placeholderTextColor={Colors.textTertiary}
                    value={value}
                    onChangeText={onChange}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Controller
                  control={control}
                  name="application"
                  render={() => (
                    <SelectField
                      label="Application"
                      value={applicationLabel}
                      placeholder="Select application"
                      error={errors.application?.message}
                      onPress={() => setPickerOpen('application')}
                    />
                  )}
                />
              </View>
              <View style={styles.rowItem}>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Priority"
                      placeholder="0"
                      value={String(value)}
                      onChangeText={(text) => {
                        const parsed = Number(text);
                        onChange(Number.isFinite(parsed) ? parsed : 0);
                      }}
                      error={errors.priority?.message}
                      keyboardType="number-pad"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="condition"
              render={() => (
                <SelectField
                  label="Condition"
                  value={conditionLabel}
                  placeholder="Select condition"
                  error={errors.condition?.message}
                  onPress={() => setPickerOpen('condition')}
                />
              )}
            />

            <Controller
              control={control}
              name="rewardType"
              render={() => (
                <SelectField
                  label="Reward Type"
                  value={rewardTypeLabel}
                  placeholder="Select reward"
                  error={errors.rewardType?.message}
                  onPress={() => setPickerOpen('rewardType')}
                />
              )}
            />

            <Controller
              control={control}
              name="maxDiscountCap"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Max Discount Cap (ETB) — optional"
                  placeholder="No cap"
                  value={value}
                  onChangeText={onChange}
                  error={errors.maxDiscountCap?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerField
                      label="Start Date"
                      value={value ?? ''}
                      onChange={onChange}
                      error={errors.startDate?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.rowItem}>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerField
                      label="End Date"
                      value={value ?? ''}
                      onChange={onChange}
                      error={errors.endDate?.message}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Advanced Settings</Text>
            <Controller
              control={control}
              name="stackable"
              render={({ field: { value, onChange } }) => (
                <View style={styles.toggleWrap}>
                  <SettingToggle
                    label="Stackable"
                    description="Can combine with other promotions"
                    value={value}
                    onValueChange={onChange}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="excludeAlreadyDiscounted"
              render={({ field: { value, onChange } }) => (
                <View style={styles.toggleWrap}>
                  <SettingToggle
                    label="Exclude Already Discounted"
                    description="Skip pre-discounted items"
                    value={value}
                    onValueChange={onChange}
                  />
                </View>
              )}
            />

            <View style={styles.limitsRow}>
              <Controller
                control={control}
                name="maxUsesTotal"
                render={({ field: { onChange, value } }) => (
                  <LimitInput label="Max Uses (Total)" value={value} onChangeText={onChange} />
                )}
              />
              <Controller
                control={control}
                name="maxUsesPerCustomer"
                render={({ field: { onChange, value } }) => (
                  <LimitInput label="Per Customer" value={value} onChangeText={onChange} />
                )}
              />
              <Controller
                control={control}
                name="maxUsesPerOrder"
                render={({ field: { onChange, value } }) => (
                  <LimitInput
                    label="Per Order"
                    value={value}
                    onChangeText={onChange}
                    error={errors.maxUsesPerOrder?.message}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Controller
              control={control}
              name="active"
              render={({ field: { value, onChange } }) => (
                <View style={styles.toggleWrapLast}>
                  <SettingToggle
                    label="Active Status"
                    description="Active promotions are applied at the POS"
                    value={value}
                    onValueChange={onChange}
                  />
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
              title="Create Promotion"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen != null} onClose={() => setPickerOpen(null)} title={pickerTitle}>
        <View style={styles.pickerList}>
          {pickerOptions.map((option) => {
            const active = pickerValue === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.pickerOption, active && styles.pickerOptionActive]}
                onPress={() => {
                  if (pickerOpen === 'application') {
                    setValue('application', option.id, { shouldValidate: true });
                  } else if (pickerOpen === 'condition') {
                    setValue('condition', option.id, { shouldValidate: true });
                  } else if (pickerOpen === 'rewardType') {
                    setValue('rewardType', option.id, { shouldValidate: true });
                  }
                  setPickerOpen(null);
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
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
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
  heroSubtitle: { ...Typography.subhead, color: Colors.textSecondary },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  sectionTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '31%',
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 6,
  },
  typeCardActive: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  typeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
  },
  typeIconWrapActive: { backgroundColor: Colors.white },
  typeLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 13,
  },
  typeLabelActive: { color: Brand.primary, fontWeight: '700' },
  typeHint: { ...Typography.caption1, color: Colors.textTertiary },
  fieldWrap: { gap: 6 },
  fieldLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  textArea: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    ...Typography.body,
    color: Colors.text,
  },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  toggleWrapLast: {
    marginHorizontal: -16,
    marginBottom: -16,
  },
  limitsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  limitField: { flex: 1, gap: 6 },
  limitLabel: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '600' },
  limitInput: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  limitInputError: { borderColor: Colors.danger },
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

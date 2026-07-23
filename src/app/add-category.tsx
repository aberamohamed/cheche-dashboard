import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { addCategorySchema, type AddCategoryForm } from '@/features/products/schemas';
import { useCategories, useGovernmentItemCategories, useTaxes } from '@/hooks/useProducts';
import { createCategory, updateCategory, type TaxOption } from '@/services/productService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { waitForModalTransition, withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, Info, Landmark, Pencil, Plus, RefreshCw, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FOOTER_RESERVED_SPACE = 72;
const ANDROID_KEYBOARD_SCROLL_DELAY_MS = 80;

function toggleTaxId(ids: string[], taxId: string): string[] {
  return ids.includes(taxId) ? ids.filter((id) => id !== taxId) : [...ids, taxId];
}

function TaxOptionRow({
  tax,
  checked,
  tone,
  onToggle,
}: {
  tax: TaxOption;
  checked: boolean;
  tone: 'sale' | 'purchase';
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.taxRow} onPress={onToggle}>
      <View style={[styles.taxCheck, checked && styles.taxCheckActive]}>
        {checked ? <Check size={14} color={Colors.white} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.taxName} numberOfLines={1}>
        {tax.name}
      </Text>
      <Text style={[styles.taxRate, tone === 'sale' ? styles.taxRateSale : styles.taxRatePurchase]}>
        ({tax.rate}%)
      </Text>
    </Pressable>
  );
}

export default function AddCategoryScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [footerHeight, setFooterHeight] = useState(FOOTER_RESERVED_SPACE);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [governmentPickerOpen, setGovernmentPickerOpen] = useState(false);
  const scrollBottomPadding = footerHeight + 8;

  const { categoryId: categoryIdParam } = useLocalSearchParams<{ categoryId?: string }>();
  const editingId = typeof categoryIdParam === 'string' ? categoryIdParam : undefined;
  const isEditing = !!editingId;
  const prefilledRef = useRef(false);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: taxes = [], isLoading: taxesLoading } = useTaxes();
  const {
    data: governmentCategories = [],
    isLoading: governmentLoading,
    isFetching: governmentFetching,
    refetch: refetchGovernment,
  } = useGovernmentItemCategories();

  const editingCategory = editingId
    ? categories.find((category) => category.id === editingId)
    : undefined;

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddCategoryForm>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      name: '',
      code: '',
      parentCategoryId: '',
      description: '',
      saleTaxIds: [],
      purchaseTaxIds: [],
      isActive: true,
      governmentCategoryId: '',
      governmentCategoryName: '',
      governmentCategoryCode: '',
      governmentTaxCode: '',
    },
  });

  const parentCategoryId = watch('parentCategoryId');
  const saleTaxIds = watch('saleTaxIds');
  const purchaseTaxIds = watch('purchaseTaxIds');
  const governmentCategoryId = watch('governmentCategoryId');
  const governmentTaxCode = watch('governmentTaxCode');

  useEffect(() => {
    if (!isEditing || !editingCategory || prefilledRef.current) return;
    prefilledRef.current = true;
    reset({
      name: editingCategory.name,
      code: editingCategory.code ?? '',
      parentCategoryId: editingCategory.parentCategoryId ?? '',
      description: editingCategory.description ?? '',
      saleTaxIds: editingCategory.saleTaxIds,
      purchaseTaxIds: editingCategory.purchaseTaxIds,
      isActive: editingCategory.isActive,
      governmentCategoryId: editingCategory.governmentCategoryId ?? '',
      governmentCategoryName: editingCategory.governmentCategoryName ?? '',
      governmentCategoryCode: editingCategory.governmentCategoryCode ?? '',
      governmentTaxCode: editingCategory.governmentTaxCode ?? '',
    });
  }, [isEditing, editingCategory, reset]);

  const parentLabel =
    categories.find((category) => category.id === parentCategoryId)?.name ?? 'None (Root Category)';

  const selectedGovernmentCategory = governmentCategories.find(
    (category) => category.id === governmentCategoryId
  );
  const governmentLabel = selectedGovernmentCategory
    ? `${selectedGovernmentCategory.name} (${selectedGovernmentCategory.code})`
    : 'Select the matching government category';

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, ANDROID_KEYBOARD_SCROLL_DELAY_MS);
    });

    return () => {
      showSub.remove();
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      code: values.code,
      parentCategoryId: values.parentCategoryId || undefined,
      description: values.description,
      saleTaxIds: values.saleTaxIds,
      purchaseTaxIds: values.purchaseTaxIds,
      isActive: values.isActive,
      governmentCategoryId: values.governmentCategoryId,
      governmentCategoryName: values.governmentCategoryName,
      governmentCategoryCode: values.governmentCategoryCode,
      governmentTaxCode: values.governmentTaxCode,
    };

    try {
      await withLoading(async () => {
        if (isEditing && editingId) {
          await updateCategory(editingId, payload);
        } else {
          await createCategory(payload);
        }
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
      }, isEditing ? 'Updating category...' : 'Creating category...');

      // Dismiss the sheet first, then surface the success alert once the modal
      // transition has settled. Showing the alert while this screen is still a
      // mounted modal and then calling router.back() from the alert stacks two
      // native modal dismissals and can freeze the screen on iOS.
      router.back();
      await waitForModalTransition();
      appAlert(
        'Success',
        `Category ${isEditing ? 'updated' : 'created'} successfully`,
        undefined,
        { variant: 'success' }
      );
    } catch (error) {
      appAlert('Error', getApiErrorMessage(error));
    }
  });

  const lookupsLoading = categoriesLoading || taxesLoading || governmentLoading;

  return (
    <RNModal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => router.back()}
    >
      <View style={styles.sheetContainer}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={[styles.header, { paddingTop: 6 }]}>
        <View style={styles.headerMain}>
          <View style={styles.headerIcon}>
            {isEditing ? (
              <Pencil size={20} color={Brand.primary} strokeWidth={2.5} />
            ) : (
              <Plus size={20} color={Brand.primary} strokeWidth={2.5} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{isEditing ? 'Edit Category' : 'Add New Category'}</Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? 'Update this product category and its tax settings'
                : 'Create a new product category with default tax settings'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {lookupsLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Brand.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <View style={styles.body}>
              <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                showsVerticalScrollIndicator={false}
              >
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Category Name *"
                      placeholder="e.g., Electronics, Beverages"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.name?.message}
                      autoCapitalize="words"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <Input
                        label="Code"
                        placeholder="e.g., ELEC, BEV"
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="characters"
                      />
                      <Text style={styles.fieldHint}>Auto-generated if left empty.</Text>
                    </View>
                  )}
                />

                <View style={styles.govCard}>
                  <View style={styles.govHeader}>
                    <View style={styles.govHeaderMain}>
                      <Landmark size={18} color={Brand.primary} strokeWidth={2.4} />
                      <Text style={styles.govTitle}>
                        Government Item Category <Text style={styles.required}>*</Text>
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => refetchGovernment()}
                      hitSlop={8}
                      disabled={governmentFetching}
                      accessibilityRole="button"
                      accessibilityLabel="Refresh government item categories"
                    >
                      {governmentFetching ? (
                        <ActivityIndicator size="small" color={Brand.primary} />
                      ) : (
                        <RefreshCw size={16} color={Colors.textSecondary} />
                      )}
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.govSelect}
                    onPress={() => setGovernmentPickerOpen(true)}
                  >
                    <Text
                      style={[styles.selectText, !selectedGovernmentCategory && styles.selectPlaceholder]}
                      numberOfLines={1}
                    >
                      {governmentLabel}
                    </Text>
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  </Pressable>
                  {errors.governmentCategoryId ? (
                    <Text style={styles.govError}>{errors.governmentCategoryId.message}</Text>
                  ) : null}

                  <Text style={styles.govFieldLabel}>
                    Tax / VAT Code <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.govTaxField}>
                    <Text
                      style={[styles.selectText, !governmentTaxCode && styles.selectPlaceholder]}
                      numberOfLines={1}
                    >
                      {governmentTaxCode || 'e.g., VAT15, VATEX'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Info size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>
                      Required by the tax authority. Items in this category will report this
                      government category and VAT code on every invoice.
                    </Text>
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Parent Category</Text>
                  <Pressable style={styles.select} onPress={() => setParentPickerOpen(true)}>
                    <Text style={styles.selectText} numberOfLines={1}>
                      {parentLabel}
                    </Text>
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  </Pressable>
                  <View style={styles.infoRow}>
                    <Info size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>
                      Parents inherit tax settings and organize hierarchy.
                    </Text>
                  </View>
                </View>

                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Description"
                      placeholder="Brief description of the category..."
                      value={value ?? ''}
                      onChangeText={onChange}
                      multiline
                    />
                  )}
                />

                <View style={styles.taxColumns}>
                  <View style={styles.taxColumn}>
                    <View style={styles.taxColumnHeader}>
                      <Text style={styles.taxColumnTitle}>Customer Taxes</Text>
                      <View style={[styles.taxBadge, styles.taxBadgeSale]}>
                        <Text style={styles.taxBadgeSaleText}>Sale</Text>
                      </View>
                    </View>
                    <View style={styles.taxList}>
                      {taxes.length === 0 ? (
                        <Text style={styles.taxEmpty}>No taxes available</Text>
                      ) : (
                        taxes.map((tax) => (
                          <TaxOptionRow
                            key={`sale-${tax.id}`}
                            tax={tax}
                            checked={saleTaxIds.includes(tax.id)}
                            tone="sale"
                            onToggle={() =>
                              setValue('saleTaxIds', toggleTaxId(saleTaxIds, tax.id), {
                                shouldDirty: true,
                              })
                            }
                          />
                        ))
                      )}
                    </View>
                  </View>

                  <View style={styles.taxColumn}>
                    <View style={styles.taxColumnHeader}>
                      <Text style={styles.taxColumnTitle}>Supplier Taxes</Text>
                      <View style={[styles.taxBadge, styles.taxBadgePurchase]}>
                        <Text style={styles.taxBadgePurchaseText}>Purchase</Text>
                      </View>
                    </View>
                    <View style={styles.taxList}>
                      {taxes.length === 0 ? (
                        <Text style={styles.taxEmpty}>No taxes available</Text>
                      ) : (
                        taxes.map((tax) => (
                          <TaxOptionRow
                            key={`purchase-${tax.id}`}
                            tax={tax}
                            checked={purchaseTaxIds.includes(tax.id)}
                            tone="purchase"
                            onToggle={() =>
                              setValue('purchaseTaxIds', toggleTaxId(purchaseTaxIds, tax.id), {
                                shouldDirty: true,
                              })
                            }
                          />
                        ))
                      )}
                    </View>
                  </View>
                </View>

                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.activeCard}>
                      <View style={styles.activeText}>
                        <Text style={styles.activeTitle}>Active Status</Text>
                        <Text style={styles.activeHint}>
                          Inactive categories won&apos;t be visible in Point of Sale.
                        </Text>
                      </View>
                      <Switch
                        value={value}
                        onValueChange={onChange}
                        trackColor={{ false: Colors.border, true: Colors.success }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  )}
                />
              </ScrollView>

              <View
                onLayout={(event) => {
                  const nextHeight = event.nativeEvent.layout.height;
                  if (nextHeight > 0 && nextHeight !== footerHeight) {
                    setFooterHeight(nextHeight);
                  }
                }}
                style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
              >
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Button
                  title={isEditing ? 'Save Changes' : 'Create Category'}
                  onPress={onSubmit}
                  loading={isSubmitting}
                  style={styles.submitBtn}
                  fullWidth={false}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      <Modal visible={parentPickerOpen} onClose={() => setParentPickerOpen(false)} title="Parent Category">
        <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
          <Pressable
            style={[styles.pickerOption, !parentCategoryId && styles.pickerOptionActive]}
            onPress={() => {
              setValue('parentCategoryId', '');
              setParentPickerOpen(false);
            }}
          >
            <Text style={[styles.pickerOptionText, !parentCategoryId && styles.pickerOptionTextActive]}>
              None (Root Category)
            </Text>
          </Pressable>
          {categories.map((category) => {
            const active = parentCategoryId === category.id;
            return (
              <Pressable
                key={category.id}
                style={[styles.pickerOption, active && styles.pickerOptionActive]}
                onPress={() => {
                  setValue('parentCategoryId', category.id);
                  setParentPickerOpen(false);
                }}
              >
                <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>

      <Modal
        visible={governmentPickerOpen}
        onClose={() => setGovernmentPickerOpen(false)}
        title="Government Item Category"
      >
        <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
          {governmentCategories.length === 0 ? (
            <Text style={styles.taxEmpty}>No government categories available</Text>
          ) : (
            governmentCategories.map((category) => {
              const active = governmentCategoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.pickerOption, active && styles.pickerOptionActive]}
                  onPress={() => {
                    setValue('governmentCategoryId', category.id, { shouldValidate: true });
                    setValue('governmentCategoryName', category.name);
                    setValue('governmentCategoryCode', category.code);
                    setValue(
                      'governmentTaxCode',
                      category.defaultTaxCode ?? category.taxCodes[0] ?? ''
                    );
                    setGovernmentPickerOpen(false);
                  }}
                >
                  <View style={styles.govOptionText}>
                    <Text
                      style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                    <Text style={styles.govOptionMeta}>
                      {category.code}
                      {category.defaultTaxCode ? ` · ${category.defaultTaxCode}` : ''}
                    </Text>
                  </View>
                  {active ? <Check size={18} color={Brand.primary} strokeWidth={3} /> : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </Modal>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    height: '92%',
    maxHeight: '92%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 8,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  flex: { flex: 1 },
  body: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 18,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldHint: {
    ...Typography.caption2,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  selectText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  selectPlaceholder: {
    color: Colors.textTertiary,
  },
  required: {
    color: Colors.danger,
    fontWeight: '700',
  },
  govCard: {
    gap: 10,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F7D0E6',
    backgroundColor: Brand.primaryMuted,
  },
  govHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  govHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  govTitle: {
    flex: 1,
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  govSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  govError: {
    ...Typography.caption1,
    color: Colors.danger,
    marginLeft: 2,
  },
  govFieldLabel: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  govTaxField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  govOptionText: {
    flex: 1,
    gap: 2,
  },
  govOptionMeta: {
    ...Typography.caption2,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  taxColumns: {
    gap: 16,
  },
  taxColumn: {
    gap: 10,
  },
  taxColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  taxColumnTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  taxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taxBadgeSale: {
    backgroundColor: '#EFF6FF',
  },
  taxBadgeSaleText: {
    ...Typography.caption2,
    color: '#2563EB',
    fontWeight: '700',
  },
  taxBadgePurchase: {
    backgroundColor: Colors.successBg,
  },
  taxBadgePurchaseText: {
    ...Typography.caption2,
    color: Colors.success,
    fontWeight: '700',
  },
  taxList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 88,
  },
  taxEmpty: {
    ...Typography.caption1,
    color: Colors.textTertiary,
    paddingVertical: 12,
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  taxCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  taxCheckActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  taxName: {
    flex: 1,
    ...Typography.subhead,
    color: Colors.text,
  },
  taxRate: {
    ...Typography.caption1,
    fontWeight: '700',
  },
  taxRateSale: {
    color: '#2563EB',
  },
  taxRatePurchase: {
    color: Colors.success,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  activeText: {
    flex: 1,
    gap: 4,
  },
  activeTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  activeHint: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  cancelText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitBtn: {
    minWidth: 148,
    height: 48,
  },
  pickerList: {
    maxHeight: 360,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  pickerOptionActive: {
    backgroundColor: Brand.primaryMuted,
  },
  pickerOptionText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  pickerOptionTextActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
});

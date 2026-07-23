import { BarcodeScannerModal } from '@/components/products/BarcodeScannerModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingToggle } from '@/components/settings/SettingToggle';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { PRODUCT_TYPES } from '@/data/productFormOptions';
import { addItemSchema, type AddItemForm } from '@/features/products/schemas';
import { useBrands, useCategories, useProductDetail, useTaxes, useUoms } from '@/hooks/useProducts';
import { createProduct, updateProduct, uploadProductImage } from '@/services/productService';
import type { TaxOption } from '@/services/productService';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { OTHER_CATEGORY_TAB_ID } from '@/utils/productFilters';
import { withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Box,
  Check,
  ChevronDown,
  ClipboardList,
  ImagePlus,
  Layers,
  Plus,
  ScanBarcode,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PickerField =
  | 'productType'
  | 'categoryId'
  | 'brandId'
  | 'uomId';

type SelectOption = { id: string; label: string };

const FOOTER_RESERVED_SPACE = 88;
const ANDROID_KEYBOARD_SCROLL_DELAY_MS = 80;

function parseOptionalNumber(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Box;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Icon size={16} color={Brand.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

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

function CurrencyField({
  label,
  value,
  onChangeText,
  error,
  required,
  accent,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  required?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={[styles.currencyInput, accent && styles.currencyInputAccent, error && styles.selectError]}>
        <Text style={[styles.currencyPrefix, accent && styles.currencyPrefixAccent]}>ETB</Text>
        <TextInput
          style={styles.currencyValue}
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="decimal-pad"
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function TaxRow({
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
      <View style={styles.taxRowMain}>
        <Text style={styles.taxName} numberOfLines={1}>
          {tax.name}
        </Text>
        <Text style={[styles.taxRate, tone === 'sale' ? styles.taxRateSale : styles.taxRatePurchase]}>
          {tax.rate}%
        </Text>
      </View>
      <View style={[styles.taxCheck, checked && styles.taxCheckActive]}>
        {checked ? <Check size={14} color={Colors.white} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

function toggleTaxId(ids: string[], taxId: string): string[] {
  return ids.includes(taxId) ? ids.filter((id) => id !== taxId) : [...ids, taxId];
}

export default function AddItemScreen() {
  const { id: editId, categoryId: initialCategoryId } = useLocalSearchParams<{
    id?: string;
    categoryId?: string;
  }>();
  const isEditMode = !!editId;
  const categoryPrefilledRef = useRef(false);
  const queryClient = useQueryClient();
  const productQuery = useProductDetail(isEditMode ? editId : undefined);
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [productImageUri, setProductImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imagePickerOpening, setImagePickerOpening] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [footerHeight, setFooterHeight] = useState(FOOTER_RESERVED_SPACE);
  const scrollBottomPadding = footerHeight + 8;

  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();
  const uomsQuery = useUoms();
  const taxesQuery = useTaxes();

  const categories = categoriesQuery.data ?? [];
  const brands = brandsQuery.data ?? [];
  const uoms = uomsQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];

  const lookupsLoading =
    categoriesQuery.isLoading ||
    brandsQuery.isLoading ||
    uomsQuery.isLoading ||
    taxesQuery.isLoading;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddItemForm>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: '',
      productType: 'storable',
      sku: '',
      barcode: '',
      description: '',
      categoryId: '',
      brandId: '',
      uomId: '',
      isStockItem: true,
      minStockQty: '0',
      maxStockQty: '100',
      sellingPrice: '0',
      costPrice: '0',
      hsCode: '',
      hsRate: '0',
      useTaxesFromCategory: true,
      saleTaxIds: [],
      purchaseTaxIds: [],
      multiVariantEnabled: false,
    },
  });

  const productType = watch('productType');
  const categoryId = watch('categoryId');
  const brandId = watch('brandId');
  const uomId = watch('uomId');
  const useTaxesFromCategory = watch('useTaxesFromCategory');
  const saleTaxIds = watch('saleTaxIds');
  const purchaseTaxIds = watch('purchaseTaxIds');
  const isService = productType === 'service';

  useEffect(() => {
    const product = productQuery.data;
    if (!isEditMode || !product) return;

    reset({
      name: product.name,
      productType: product.productType ?? 'storable',
      sku: product.sku,
      barcode: product.barcode,
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      brandId: product.brandId ?? '',
      uomId: product.uomId ?? '',
      isStockItem: product.isStockItem ?? true,
      minStockQty: String(product.lowStockAlert ?? 0),
      maxStockQty: String(product.maxStockQty ?? 100),
      sellingPrice: String(product.sellingPrice),
      costPrice: String(product.costPrice),
      hsCode: product.hsCode ?? '',
      hsRate: String(product.hsRate ?? 0),
      useTaxesFromCategory: !(product.taxesIds?.length),
      saleTaxIds: product.taxesIds ?? [],
      purchaseTaxIds: [],
      multiVariantEnabled: false,
    });
    setProductImageUri(product.image ?? null);
    setUploadedImageUrl(product.image?.startsWith('http') ? product.image : null);
  }, [isEditMode, productQuery.data, reset]);

  useEffect(() => {
    if (isEditMode || categoryPrefilledRef.current) return;

    const paramId = typeof initialCategoryId === 'string' ? initialCategoryId.trim() : '';
    if (!paramId || paramId === OTHER_CATEGORY_TAB_ID) return;
    if (categories.length === 0) return;
    if (!categories.some((category) => category.id === paramId)) return;

    setValue('categoryId', paramId);
    categoryPrefilledRef.current = true;
  }, [isEditMode, initialCategoryId, categories, setValue]);

  useEffect(() => {
    if (!uomId && uoms.length > 0) {
      setValue('uomId', uoms[0].id);
    }
  }, [uomId, uoms, setValue]);

  useEffect(() => {
    if (!isService) return;

    setValue('isStockItem', false);
    setValue('categoryId', '');
    setValue('brandId', '');
    setValue('minStockQty', '0');
    setValue('maxStockQty', '0');
    setValue('costPrice', '0');
    setValue('hsCode', '');
    setValue('hsRate', '0');
    setValue('useTaxesFromCategory', false);
    setValue('purchaseTaxIds', []);
  }, [isService, setValue]);

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

  const productTypeLabel =
    PRODUCT_TYPES.find((option) => option.id === productType)?.label ?? productType;
  const categoryLabel = categories.find((item) => item.id === categoryId)?.name;
  const brandLabel = brands.find((item) => item.id === brandId)?.name ?? 'Unbranded';
  const uomLabel = uoms.find((item) => item.id === uomId)?.name;

  const pickerOptions = useMemo((): SelectOption[] => {
    if (pickerField === 'productType') {
      return PRODUCT_TYPES.map((option) => ({ id: option.id, label: option.label }));
    }
    if (pickerField === 'categoryId') {
      return categories.map((option) => ({ id: option.id, label: option.name }));
    }
    if (pickerField === 'brandId') {
      return [
        { id: '', label: 'Unbranded' },
        ...brands.map((option) => ({ id: option.id, label: option.name })),
      ];
    }
    if (pickerField === 'uomId') {
      return uoms.map((option) => ({ id: option.id, label: option.name }));
    }
    return [];
  }, [pickerField, categories, brands, uoms]);

  const pickerValue =
    pickerField === 'productType'
      ? productType
      : pickerField === 'categoryId'
        ? categoryId
        : pickerField === 'brandId'
          ? brandId
          : uomId;

  const productName = watch('name');
  const imageMediaBusy = imagePickerOpening || imageUploading;

  const pickProductImage = async () => {
    if (imageMediaBusy) return;

    setImagePickerOpening(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        appAlert(
          'Permission Required',
          'Allow photo library access to upload a product image.',
          undefined,
          { variant: 'error' }
        );
        return;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      setImagePickerOpening(false);

      if (result.canceled || !result.assets[0]?.uri) return;

      const localUri = result.assets[0].uri;
      setProductImageUri(localUri);
      setUploadedImageUrl(null);
      setImageUploading(true);

      try {
        const imageUrl = await uploadProductImage(localUri, productName);
        setUploadedImageUrl(imageUrl);
      } catch (error) {
        setProductImageUri(null);
        setUploadedImageUrl(null);
        appAlert('Upload Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
      } finally {
        setImageUploading(false);
      }
    } finally {
      setImagePickerOpening(false);
    }
  };

  const onSubmit = async (data: AddItemForm) => {
    try {
      if (imageUploading) {
        appAlert('Please Wait', 'Image upload is still in progress.', undefined, { variant: 'warning' });
        return;
      }

      await withLoading(async () => {
        let imageUrl: string | undefined;
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        } else if (productImageUri?.startsWith('http://') || productImageUri?.startsWith('https://')) {
          imageUrl = productImageUri;
        }

        const payload = {
          name: data.name,
          productType: data.productType,
          sku: data.sku ?? '',
          barcode: data.barcode ?? '',
          categoryId: data.categoryId ?? '',
          brandId: data.brandId || null,
          uomId: data.uomId || undefined,
          sellingPrice: Number(data.sellingPrice),
          costPrice: parseOptionalNumber(data.costPrice) ?? 0,
          isStockItem: data.isStockItem,
          minStockQty: parseOptionalNumber(data.minStockQty) ?? 0,
          maxStockQty: parseOptionalNumber(data.maxStockQty) ?? 0,
          hsCode: data.hsCode ?? '',
          hsRate: parseOptionalNumber(data.hsRate) ?? 0,
          description: data.description ?? '',
          imageUrl,
          useTaxesFromCategory: data.useTaxesFromCategory,
          saleTaxIds: data.saleTaxIds,
          purchaseTaxIds: data.purchaseTaxIds,
        };

        if (isEditMode && editId) {
          await updateProduct(editId, payload);
        } else {
          await createProduct(payload);
        }

        await queryClient.invalidateQueries({ queryKey: ['products'] });
        await queryClient.invalidateQueries({ queryKey: ['lowStock'] });
        if (isEditMode && editId) {
          await queryClient.invalidateQueries({ queryKey: ['product', editId] });
        }
      }, isEditMode ? 'Updating product...' : 'Establishing product...');

      appAlert(
        isEditMode ? 'Product Updated' : 'Product Established',
        isEditMode
          ? 'The item was updated successfully.'
          : 'The new item was added to your inventory.',
        [{ text: 'OK', onPress: () => router.back() }],
        { variant: 'success' }
      );
    } catch (error) {
      appAlert(
        isEditMode ? 'Could Not Update Item' : 'Could Not Add Item',
        getApiErrorMessage(error),
        undefined,
        { variant: 'error' }
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={isEditMode ? 'Edit Item' : 'New Collection Item'}
        onBack={() => router.back()}
      />

      {lookupsLoading || (isEditMode && productQuery.isLoading && !productQuery.data) ? (
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
            <FormSection title="ESSENTIAL INFORMATION" icon={Box}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Product Name *"
                    placeholder="Premium Coffee Beans..."
                    value={value}
                    onChangeText={onChange}
                    error={errors.name?.message}
                  />
                )}
              />
              <SelectField
                label="Product Type"
                value={productTypeLabel}
                placeholder="Select product type"
                onPress={() => setPickerField('productType')}
              />
              <Controller
                control={control}
                name="sku"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Item Code"
                    placeholder="SKU-1001"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="characters"
                  />
                )}
              />
              <Controller
                control={control}
                name="barcode"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Barcode / UPC"
                    placeholder="0001234567"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    rightAccessory={
                      <Pressable
                        onPress={() => setBarcodeScannerOpen(true)}
                        hitSlop={8}
                        style={styles.barcodeScanBtn}
                      >
                        <ScanBarcode size={22} color={Brand.primary} />
                      </Pressable>
                    }
                  />
                )}
              />
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Summary Description"
                    placeholder="Describe features, origin, or usage notes..."
                    value={value}
                    onChangeText={onChange}
                    multiline
                  />
                )}
              />
            </FormSection>

            <FormSection
              title={isService ? 'MEDIA' : 'MEDIA & CATEGORIZATION'}
              icon={ImagePlus}
            >
              <View style={styles.imageCard}>
                <Pressable
                  style={styles.imageUpload}
                  onPress={pickProductImage}
                  disabled={imageMediaBusy}
                >
                  {productImageUri ? (
                    <Image source={{ uri: productImageUri }} style={styles.imagePreview} />
                  ) : (
                    <>
                      <Plus size={22} color={Colors.textSecondary} />
                      <Text style={styles.imageUploadLabel}>IMAGE</Text>
                    </>
                  )}
                </Pressable>

                <View style={styles.imageStatus}>
                  {imageMediaBusy ? (
                    <View style={styles.imageStatusBusy}>
                      <ActivityIndicator size="small" color={Brand.primary} />
                      <Text style={styles.imageStatusText}>
                        {imagePickerOpening
                          ? 'Opening photo library...'
                          : 'Uploading image...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.imageHint}>
                      {uploadedImageUrl
                        ? 'Image uploaded. Tap to change it.'
                        : productImageUri
                          ? 'Tap the image to change it.'
                          : 'Tap to choose a product photo from your library.'}
                    </Text>
                  )}
                </View>
              </View>
              {!isService ? (
                <>
                  <SelectField
                    label="Category"
                    value={categoryLabel}
                    placeholder="General"
                    onPress={() => setPickerField('categoryId')}
                  />
                  <SelectField
                    label="Manufacturer / Brand"
                    value={brandLabel}
                    placeholder="Unbranded"
                    onPress={() => setPickerField('brandId')}
                  />
                </>
              ) : null}
            </FormSection>

            {!isService ? (
            <FormSection title="INVENTORY CONTROL" icon={Layers}>
              <Controller
                control={control}
                name="isStockItem"
                render={({ field: { onChange, value } }) => (
                  <SettingToggle
                    label="Is Stock Item"
                    description="Track quantity on hand for this product"
                    value={value}
                    onValueChange={onChange}
                  />
                )}
              />
              <SelectField
                label="Unit"
                value={uomLabel}
                placeholder="Select unit"
                onPress={() => setPickerField('uomId')}
              />
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <Controller
                    control={control}
                    name="minStockQty"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Min Stock"
                        placeholder="0"
                        value={value ?? ''}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        error={errors.minStockQty?.message}
                      />
                    )}
                  />
                </View>
                <View style={styles.halfField}>
                  <Controller
                    control={control}
                    name="maxStockQty"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Max Stock"
                        placeholder="100"
                        value={value ?? ''}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        error={errors.maxStockQty?.message}
                      />
                    )}
                  />
                </View>
              </View>
            </FormSection>
            ) : null}

            <FormSection title="PRICING & VALUATION" icon={Box}>
              <Controller
                control={control}
                name="sellingPrice"
                render={({ field: { onChange, value } }) => (
                  <CurrencyField
                    label="Sale Price"
                    value={value}
                    onChangeText={onChange}
                    error={errors.sellingPrice?.message}
                    required
                    accent
                  />
                )}
              />
              {!isService ? (
                <>
                  <Controller
                    control={control}
                    name="costPrice"
                    render={({ field: { onChange, value } }) => (
                      <CurrencyField
                        label="Buying Price"
                        value={value ?? ''}
                        onChangeText={onChange}
                        error={errors.costPrice?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="hsCode"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="HS Code"
                        placeholder="e.g. 0901.11"
                        value={value ?? ''}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>HS Rate (%)</Text>
                    <View style={styles.percentInput}>
                      <Text style={styles.percentPrefix}>%</Text>
                      <Controller
                        control={control}
                        name="hsRate"
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            style={styles.percentValue}
                            value={value ?? ''}
                            onChangeText={onChange}
                            placeholder="0"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="decimal-pad"
                          />
                        )}
                      />
                    </View>
                  </View>
                </>
              ) : null}
            </FormSection>

            <View style={styles.taxCard}>
              <View style={styles.taxCardHeader}>
                <View style={styles.taxCardTitleWrap}>
                  <ClipboardList size={18} color="#2563EB" />
                  <View>
                    <Text style={styles.taxCardTitle}>Tax Intelligence</Text>
                    <Text style={styles.taxCardSubtitle}>
                      {isService
                        ? 'Define fiscal treatment for sales'
                        : 'Define fiscal treatment for sales and purchases'}
                    </Text>
                  </View>
                </View>
                {!isService ? (
                  <Controller
                    control={control}
                    name="useTaxesFromCategory"
                    render={({ field: { onChange, value } }) => (
                      <Pressable style={styles.categoryTaxToggle} onPress={() => onChange(!value)}>
                        <View style={[styles.taxCheck, value && styles.taxCheckActive]}>
                          {value ? <Check size={14} color={Colors.white} strokeWidth={3} /> : null}
                        </View>
                        <Text style={styles.categoryTaxLabel}>Use taxes from category</Text>
                      </Pressable>
                    )}
                  />
                ) : null}
              </View>

              {(isService || !useTaxesFromCategory) && taxes.length > 0 ? (
                <View style={styles.taxColumns}>
                  <View style={styles.taxColumn}>
                    <Text style={styles.taxColumnTitle}>CUSTOMER TAXES (SALE)</Text>
                    {taxes.map((tax) => (
                      <TaxRow
                        key={`sale-${tax.id}`}
                        tax={tax}
                        checked={saleTaxIds.includes(tax.id)}
                        tone="sale"
                        onToggle={() =>
                          setValue('saleTaxIds', toggleTaxId(saleTaxIds, tax.id), { shouldDirty: true })
                        }
                      />
                    ))}
                  </View>
                  {!isService ? (
                    <View style={styles.taxColumn}>
                      <Text style={styles.taxColumnTitle}>SUPPLIER TAXES (PURCHASE)</Text>
                      {taxes.map((tax) => (
                        <TaxRow
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
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.variantCard}>
              <View style={styles.variantTextWrap}>
                <Layers size={18} color={Colors.warning} />
                <View>
                  <Text style={styles.variantTitle}>Multi-Variant Configuration</Text>
                  <Text style={styles.variantSubtitle}>Size, Color, Material, etc.</Text>
                </View>
              </View>
              <Controller
                control={control}
                name="multiVariantEnabled"
                render={({ field: { value } }) => (
                  <Text style={styles.variantDisabled}>DISABLED</Text>
                )}
              />
            </View>
          </ScrollView>

          <View
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight > 0 && nextHeight !== footerHeight) {
                setFooterHeight(nextHeight);
              }
            }}
            style={[
              styles.footerSafe,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={() => router.back()} disabled={isSubmitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Button
                title={isEditMode ? 'Save Changes' : 'Establish Product'}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting || imageUploading}
                style={styles.submitBtn}
                fullWidth={false}
              />
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal
        visible={pickerField !== null}
        onClose={() => setPickerField(null)}
        title={
          pickerField === 'productType'
            ? 'Product Type'
            : pickerField === 'categoryId'
              ? 'Category'
              : pickerField === 'brandId'
                ? 'Manufacturer / Brand'
                : 'Unit'
        }
      >
        <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
          {pickerOptions.map((option) => {
            const active = pickerValue === option.id;
            return (
              <Pressable
                key={`${pickerField}-${option.id || 'default'}`}
                style={[styles.pickerOption, active && styles.pickerOptionActive]}
                onPress={() => {
                  if (pickerField === 'productType') setValue('productType', option.id, { shouldValidate: true });
                  if (pickerField === 'categoryId') setValue('categoryId', option.id);
                  if (pickerField === 'brandId') setValue('brandId', option.id);
                  if (pickerField === 'uomId') setValue('uomId', option.id);
                  setPickerField(null);
                }}
              >
                <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>

      <BarcodeScannerModal
        visible={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onScanned={(barcode) => setValue('barcode', barcode, { shouldDirty: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  body: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sectionBody: { gap: 14 },
  fieldWrap: { gap: 6 },
  barcodeScanBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
  required: { color: Brand.primary },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },
  selectError: { borderColor: Colors.danger },
  selectText: { flex: 1, ...Typography.body, color: Colors.text },
  selectPlaceholder: { color: Colors.textTertiary },
  fieldError: { ...Typography.caption1, color: Colors.danger },
  imageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
    backgroundColor: Colors.surface,
  },
  imageUpload: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    flexShrink: 0,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageStatus: {
    flex: 1,
    minHeight: 88,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  imageStatusBusy: {
    alignItems: 'flex-end',
    gap: 8,
  },
  imageStatusText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 18,
  },
  imageUploadLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  imageHint: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
  },
  rowFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  currencyInputAccent: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  currencyPrefix: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  currencyPrefixAccent: { color: Brand.primary },
  currencyValue: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
  },
  percentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  percentPrefix: { ...Typography.subhead, color: Colors.textSecondary, fontWeight: '700' },
  percentValue: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
  },
  taxCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  taxCardHeader: { gap: 12 },
  taxCardTitleWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taxCardTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  taxCardSubtitle: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  categoryTaxToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryTaxLabel: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '600' },
  taxColumns: { gap: 16 },
  taxColumn: { gap: 8 },
  taxColumnTitle: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  taxRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  taxName: { ...Typography.subhead, color: Colors.text, flex: 1 },
  taxRate: { ...Typography.caption1, fontWeight: '700' },
  taxRateSale: { color: '#2563EB' },
  taxRatePurchase: { color: Colors.success },
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
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  variantTextWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  variantTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  variantSubtitle: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  variantDisabled: {
    ...Typography.caption1,
    color: Colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  pickerList: { maxHeight: 360 },
  pickerOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pickerOptionActive: { backgroundColor: Brand.primaryMuted },
  pickerOptionText: { ...Typography.subhead, color: Colors.text },
  pickerOptionTextActive: { color: Brand.primary, fontWeight: '600' },
});

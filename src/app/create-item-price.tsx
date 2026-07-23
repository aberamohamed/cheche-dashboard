import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  ALL_CUSTOMERS_OPTION,
  createItemPriceSchema,
  type CreateItemPriceForm,
} from '@/features/pricing/itemPriceSchemas';
import { useItemPriceFormOptions } from '@/hooks/usePricing';
import { getCustomers } from '@/services/invoiceService';
import { getProducts } from '@/services/productService';
import { createItemPrice } from '@/services/pricingService';
import type { CustomerRecord } from '@/types';
import type { Product } from '@/types';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { ChevronDown, DollarSign, Package, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type PickerKind = 'product' | 'priceType' | 'customer' | null;

function SelectField({
  label,
  required,
  value,
  placeholder,
  error,
  onPress,
}: {
  label: string;
  required?: boolean;
  value?: string;
  placeholder: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
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

function ProductPickerRow({
  product,
  selected,
  onPress,
}: {
  product: Product;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.pickerRow, selected && styles.pickerRowActive]} onPress={onPress}>
      <View style={styles.pickerRowIcon}>
        <Package size={18} color={Brand.primary} />
      </View>
      <View style={styles.pickerRowBody}>
        <Text style={styles.pickerRowTitle} numberOfLines={1}>
          {product.name}
        </Text>
        {product.sku ? (
          <Text style={styles.pickerRowMeta} numberOfLines={1}>
            {product.sku}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function CustomerPickerRow({
  customer,
  selected,
  onPress,
}: {
  customer: CustomerRecord;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.pickerRow, selected && styles.pickerRowActive]} onPress={onPress}>
      <View style={styles.pickerRowIcon}>
        <Users size={18} color={Brand.primary} />
      </View>
      <View style={styles.pickerRowBody}>
        <Text style={styles.pickerRowTitle} numberOfLines={1}>
          {customer.name}
        </Text>
        {customer.phone ? (
          <Text style={styles.pickerRowMeta} numberOfLines={1}>
            {customer.phone}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function CreateItemPriceScreen() {
  const queryClient = useQueryClient();
  const formOptionsQuery = useItemPriceFormOptions();
  const [pickerOpen, setPickerOpen] = useState<PickerKind>(null);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const productsQuery = useQuery({
    queryKey: ['products', 'item-price-form'],
    queryFn: getProducts,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'item-price-form'],
    queryFn: () => getCustomers(),
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateItemPriceForm>({
    resolver: zodResolver(createItemPriceSchema),
    defaultValues: {
      productId: '',
      priceType: 'selling',
      customerId: '',
      price: 0,
      minQuantity: 1,
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validUntil: '',
    },
  });

  const productId = watch('productId');
  const priceType = watch('priceType');
  const customerId = watch('customerId');

  const priceTypes = formOptionsQuery.data?.priceTypes ?? [];
  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId]
  );

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.barcode.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.phone?.toLowerCase().includes(q) ||
        customer.email?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const priceTypeLabel =
    priceTypes.find((option) => option.id === priceType)?.label ?? 'Selling Price';
  const customerLabel = selectedCustomer?.name ?? ALL_CUSTOMERS_OPTION.label;

  const onSubmit = async (data: CreateItemPriceForm) => {
    try {
      await withLoading(async () => {
        await createItemPrice(data);
      }, 'Creating price...');
      await queryClient.invalidateQueries({ queryKey: ['item-prices'] });
      reset();
      appAlert('Price Created', 'The item price has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Create Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Add New Price" onBack={() => router.back()} />

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
              <DollarSign size={18} color={Brand.primary} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Add New Price</Text>
              <Text style={styles.heroSubtitle}>Create a new price record for a product.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Controller
              control={control}
              name="productId"
              render={() => (
                <SelectField
                  label="Product"
                  required
                  value={selectedProduct?.name}
                  placeholder="Select a product"
                  error={errors.productId?.message}
                  onPress={() => {
                    setProductSearch('');
                    setPickerOpen('product');
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="priceType"
              render={() => (
                <SelectField
                  label="Price Type"
                  value={priceTypeLabel}
                  placeholder="Select price type"
                  error={errors.priceType?.message}
                  onPress={() => setPickerOpen('priceType')}
                />
              )}
            />

            <Controller
              control={control}
              name="customerId"
              render={() => (
                <SelectField
                  label="Customer (Optional)"
                  value={customerLabel}
                  placeholder="All Customers"
                  onPress={() => {
                    setCustomerSearch('');
                    setPickerOpen('customer');
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Price *"
                  placeholder="0.00"
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(text) => {
                    const parsed = Number(text);
                    onChange(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  error={errors.price?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />

            <View style={styles.validityBox}>
              <Text style={styles.validityTitle}>Validity Period</Text>
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Controller
                    control={control}
                    name="validFrom"
                    render={({ field: { onChange, value } }) => (
                      <DatePickerField
                        label="Valid From *"
                        value={value ?? ''}
                        onChange={onChange}
                        error={errors.validFrom?.message}
                      />
                    )}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Controller
                    control={control}
                    name="validUntil"
                    render={({ field: { onChange, value } }) => (
                      <DatePickerField
                        label="Valid Until"
                        value={value ?? ''}
                        onChange={onChange}
                        error={errors.validUntil?.message}
                        clearable
                      />
                    )}
                  />
                </View>
              </View>
              <Text style={styles.validityHint}>
                Adding dates creates a temporary price rule.
              </Text>
            </View>
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
              title="Create Price"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerOpen === 'product'}
        onClose={() => setPickerOpen(null)}
        title="Select Product"
      >
        <SearchBar
          placeholder="Search products..."
          value={productSearch}
          onChangeText={setProductSearch}
        />
        {productsQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Brand.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            style={styles.pickerList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ProductPickerRow
                product={item}
                selected={productId === item.id}
                onPress={() => {
                  setValue('productId', item.id, { shouldValidate: true });
                  setPickerOpen(null);
                }}
              />
            )}
            ListEmptyComponent={
              <EmptyState title="No Products" message="No products match your search." />
            }
          />
        )}
      </Modal>

      <Modal
        visible={pickerOpen === 'priceType'}
        onClose={() => setPickerOpen(null)}
        title="Price Type"
      >
        <View style={styles.optionList}>
          {priceTypes.map((option) => {
            const active = priceType === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.optionRow, active && styles.optionRowActive]}
                onPress={() => {
                  setValue('priceType', option.id, { shouldValidate: true });
                  setPickerOpen(null);
                }}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>

      <Modal
        visible={pickerOpen === 'customer'}
        onClose={() => setPickerOpen(null)}
        title="Select Customer"
      >
        <SearchBar
          placeholder="Search customers..."
          value={customerSearch}
          onChangeText={setCustomerSearch}
        />
        {customersQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Brand.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            style={styles.pickerList}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable
                style={[
                  styles.pickerRow,
                  !customerId && styles.pickerRowActive,
                  styles.allCustomersRow,
                ]}
                onPress={() => {
                  setValue('customerId', '', { shouldValidate: true });
                  setPickerOpen(null);
                }}
              >
                <View style={styles.pickerRowIcon}>
                  <Users size={18} color={Brand.primary} />
                </View>
                <View style={styles.pickerRowBody}>
                  <Text style={styles.pickerRowTitle}>{ALL_CUSTOMERS_OPTION.label}</Text>
                </View>
              </Pressable>
            }
            renderItem={({ item }) => (
              <CustomerPickerRow
                customer={item}
                selected={customerId === item.id}
                onPress={() => {
                  setValue('customerId', item.id, { shouldValidate: true });
                  setPickerOpen(null);
                }}
              />
            )}
            ListEmptyComponent={
              <EmptyState title="No Customers" message="No customers match your search." />
            }
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
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
  heroSubtitle: { ...Typography.subhead, color: Colors.textSecondary },
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
  required: { color: Colors.danger },
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
  validityBox: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  validityTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '700' },
  validityHint: { ...Typography.caption1, color: Colors.textTertiary },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { flex: 1 },
  submitBtn: { flex: 1.4 },
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },
  pickerList: { maxHeight: 360, marginTop: 12 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pickerRowActive: { backgroundColor: Brand.primaryMuted },
  allCustomersRow: { borderRadius: Radius.md, paddingHorizontal: 10, marginBottom: 4 },
  pickerRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRowBody: { flex: 1, gap: 2 },
  pickerRowTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  pickerRowMeta: { ...Typography.caption1, color: Colors.textSecondary },
  optionList: { gap: 8 },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  optionRowActive: {
    backgroundColor: Brand.primaryMuted,
    borderColor: Brand.primary,
  },
  optionText: { ...Typography.body, color: Colors.text },
  optionTextActive: { color: Brand.primary, fontWeight: '600' },
});

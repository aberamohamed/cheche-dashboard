import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import { apiRequest } from '@/services/apiClient';
import { getProducts } from '@/services/productService';
import { useLoadingModalStore } from '@/store/loadingModalStore';
import { appAlert } from '@/utils/alert';
import { showErrorAlert } from '@/utils/network';
import type { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Supplier { id: string; name: string; }
interface Warehouse { id: string; name: string; code: string; }
interface Uom { id: string; name: string; }
interface Tax { id: string; name: string; rate: number; }

interface EditOrder {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  warehouse_id: string;
  status?: string;
  order_date?: string;
  expected_delivery_date?: string;
  items?: Array<{
    product_id: string;
    uom: string;
    description: string;
    unit_price: number;
    qty: number;
    discount_amount: number;
    taxes_id?: string[];
  }>;
}

interface LineItem {
  key: string;
  product_id: string;
  product_name: string;
  uom_id: string;
  uom_name: string;
  qty: string;
  unit_price: string;
  discount_amount: string;
  taxes_id: string[];
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Approval', color: Brand.primary },
  { value: 'ordered', label: 'Ordered', color: '#2F6BFF' },
  { value: 'cancelled', label: 'Cancelled', color: Colors.text },
  { value: 'partially_received', label: 'Partially Received', color: Colors.warning },
  { value: 'fully_received', label: 'Fully Received', color: Colors.success },
  { value: 'completed', label: 'Completed (Paid & Received)', color: Colors.success },
];

function newLineItem(): LineItem {
  return {
    key: Math.random().toString(36).slice(2),
    product_id: '',
    product_name: '',
    uom_id: '',
    uom_name: '',
    qty: '1',
    unit_price: '',
    discount_amount: '',
    taxes_id: [],
  };
}

function calcItemTotal(item: LineItem) {
  const qty = parseFloat(item.qty) || 0;
  const price = parseFloat(item.unit_price) || 0;
  const discount = parseFloat(item.discount_amount) || 0;
  return qty * price - discount;
}

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon as any} size={15} color={Brand.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function SelectRow({ label, required, value, placeholder, onPress }: {
  label: string; required?: boolean; value?: string; placeholder: string; onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel label={label} required={required} />
      <Pressable style={styles.selectRow} onPress={onPress}>
        <Text style={[styles.selectText, !value && styles.placeholderText]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function PickerModal<T extends { id: string }>({
  visible, title, items, selectedId, onSelect, onClose, renderLabel, searchable, searchPlaceholder,
}: {
  visible: boolean; title: string; items: T[]; selectedId?: string;
  onSelect: (item: T) => void; onClose: () => void; renderLabel?: (item: T) => string;
  searchable?: boolean; searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState('');
  const labelOf = (item: T) => (renderLabel ? renderLabel(item) : ((item as any).name ?? (item as any).label ?? item.id));

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const label = labelOf(item).toLowerCase();
      const sku = String((item as any).sku ?? '').toLowerCase();
      const barcode = String((item as any).barcode ?? '').toLowerCase();
      return label.includes(q) || sku.includes(q) || barcode.includes(q);
    });
  }, [items, query, searchable]);

  const handleClose = () => { setQuery(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.sheetContainer}>
        <Pressable style={styles.overlay} onPress={handleClose} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <View style={styles.pickerSheetHeader}>
            <Text style={styles.pickerSheetTitle}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={8}><Ionicons name="close" size={22} color={Colors.text} /></Pressable>
          </View>
          {searchable && (
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder ?? 'Search...'}
                placeholderTextColor={Colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
                </Pressable>
              )}
            </View>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={<Text style={styles.pickerEmptyText}>No results found</Text>}
            renderItem={({ item }) => {
              const label = labelOf(item);
              const active = item.id === selectedId;
              return (
                <Pressable style={[styles.pickerItem, active && styles.pickerItemActive]} onPress={() => { onSelect(item); handleClose(); }}>
                  <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{label}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

/** Add/Edit line item — bottom-sheet modal with a searchable product picker. */
function ItemFormModal({ visible, initial, products, uoms, taxes, onClose, onSubmit }: {
  visible: boolean; initial: LineItem; products: Product[]; uoms: Uom[]; taxes: Tax[];
  onClose: () => void; onSubmit: (item: LineItem) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<LineItem>(initial);
  const [errors, setErrors] = useState<{ product?: string; uom?: string; qty?: string; unit_price?: string }>({});
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [uomPickerVisible, setUomPickerVisible] = useState(false);
  const [taxPickerVisible, setTaxPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) { setDraft(initial); setErrors({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial.key]);

  const clearError = (field: keyof typeof errors) =>
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  const set = (field: keyof LineItem, value: any) => {
    setDraft((d) => ({ ...d, [field]: value }));
    if (field === 'qty' || field === 'unit_price') clearError(field);
  };
  const isEdit = !!initial.product_id;
  const total = calcItemTotal(draft);
  const lineSubtotal = (parseFloat(draft.qty) || 0) * (parseFloat(draft.unit_price) || 0);

  const handleSelectProduct = (p: Product) => {
    setDraft((d) => {
      const matchedUom = uoms.find((u) => u.id === p.uomId) || uoms.find((u) => u.name === p.unit);
      const availableTaxIds = (p.taxesIds ?? []).filter((id) => taxes.some((t) => t.id === id));
      return {
        ...d,
        product_id: p.id,
        product_name: p.name,
        uom_id: matchedUom?.id ?? d.uom_id,
        uom_name: matchedUom?.name ?? d.uom_name,
        unit_price:
          d.unit_price && parseFloat(d.unit_price) > 0 ? d.unit_price : String(p.sellingPrice ?? ''),
        taxes_id: d.taxes_id.length ? d.taxes_id : availableTaxIds,
      };
    });
    setErrors((e) => ({ ...e, product: undefined, uom: undefined }));
  };

  const handleSubmit = () => {
    const next: typeof errors = {};
    if (!draft.product_id) next.product = 'Please select a product.';
    if (!draft.uom_id) next.uom = 'Select a UOM.';
    if (!draft.qty || parseFloat(draft.qty) <= 0) next.qty = 'Enter a valid quantity.';
    if (draft.unit_price === '' || parseFloat(draft.unit_price) < 0) next.unit_price = 'Enter a valid unit price.';
    if (next.product || next.uom || next.qty || next.unit_price) { setErrors(next); return; }
    setErrors({});
    onSubmit(draft);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.sheetContainer}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.pickerSheet, styles.itemFormSheet]}>
          <View style={styles.pickerHandle} />
          <View style={styles.pickerSheetHeader}>
            <Text style={styles.pickerSheetTitle}>{isEdit ? 'Edit Item' : 'Add Item'}</Text>
            <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={22} color={Colors.text} /></Pressable>
          </View>

          <ScrollView
            style={styles.itemFormScroll}
            contentContainerStyle={styles.itemFormContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldWrap}>
              <FieldLabel label="Product" required />
              <Pressable style={[styles.selectRow, errors.product && styles.inputError]} onPress={() => setProductPickerVisible(true)}>
                <Text style={[styles.selectText, !draft.product_name && styles.placeholderText]} numberOfLines={1}>
                  {draft.product_name || 'Select product'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
              </Pressable>
              {errors.product && <Text style={styles.errorText}>{errors.product}</Text>}
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <FieldLabel label="UOM" required />
                <Pressable style={[styles.selectRow, errors.uom && styles.inputError]} onPress={() => setUomPickerVisible(true)}>
                  <Text style={[styles.selectText, !draft.uom_name && styles.placeholderText]} numberOfLines={1}>
                    {draft.uom_name || 'Select'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                </Pressable>
                {errors.uom && <Text style={styles.errorText}>{errors.uom}</Text>}
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <FieldLabel label="Qty" required />
                <TextInput style={[styles.textInput, errors.qty && styles.inputError]} placeholder="0" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" value={draft.qty} onChangeText={(v) => set('qty', v)} />
                {errors.qty && <Text style={styles.errorText}>{errors.qty}</Text>}
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <FieldLabel label="Unit Price" required />
                <TextInput style={[styles.textInput, errors.unit_price && styles.inputError]} placeholder="0.00" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" value={draft.unit_price} onChangeText={(v) => set('unit_price', v)} />
                {errors.unit_price && <Text style={styles.errorText}>{errors.unit_price}</Text>}
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <FieldLabel label="Discount" />
                <TextInput style={styles.textInput} placeholder="0.00" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" value={draft.discount_amount} onChangeText={(v) => set('discount_amount', v)} />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <FieldLabel label="Subtotal (Unit Price × Qty)" />
              <View style={[styles.textInput, styles.readonlyInput]}>
                <Text style={styles.readonlyText}>
                  ETB {lineSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <FieldLabel label="Tax" />
              <Pressable style={styles.selectRow} onPress={() => setTaxPickerVisible(true)}>
                <Text style={[styles.selectText, draft.taxes_id.length === 0 && styles.placeholderText]} numberOfLines={1}>
                  {draft.taxes_id.length === 0
                    ? 'No tax selected'
                    : taxes.filter((t) => draft.taxes_id.includes(t.id)).map((t) => `${t.name} (${t.rate}%)`).join(', ')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

          </ScrollView>

          <View style={[styles.itemFormFooter, { paddingBottom: insets.bottom + 14 }]}>
            <View style={styles.itemFormTotalRow}>
              <Text style={styles.itemFormTotalLabel}>Line Total</Text>
              <Text style={styles.itemFormTotalValue}>
                ETB {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <Button title={isEdit ? 'Save Item' : 'Add Item'} onPress={handleSubmit} style={styles.itemFormSubmit} />
          </View>
        </View>
      </View>

      <PickerModal
        visible={productPickerVisible}
        title="Select Product"
        items={products}
        selectedId={draft.product_id}
        searchable
        searchPlaceholder="Search products by name, SKU or barcode"
        onSelect={(p) => handleSelectProduct(p)}
        onClose={() => setProductPickerVisible(false)}
      />

      <PickerModal
        visible={uomPickerVisible}
        title="Select UOM"
        items={uoms}
        selectedId={draft.uom_id}
        onSelect={(uom) => { set('uom_id', uom.id); set('uom_name', (uom as any).name); }}
        onClose={() => setUomPickerVisible(false)}
      />

      <Modal visible={taxPickerVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setTaxPickerVisible(false)}>
        <View style={styles.sheetContainer}>
          <Pressable style={styles.overlay} onPress={() => setTaxPickerVisible(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerSheetHeader}>
              <Text style={styles.pickerSheetTitle}>Select Tax(es)</Text>
              <Pressable onPress={() => setTaxPickerVisible(false)} hitSlop={8}><Ionicons name="close" size={22} color={Colors.text} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
              {taxes.map((tax) => {
                const selected = draft.taxes_id.includes(tax.id);
                return (
                  <Pressable
                    key={tax.id}
                    style={[styles.pickerItem, selected && styles.pickerItemActive]}
                    onPress={() => {
                      const next = selected ? draft.taxes_id.filter((id) => id !== tax.id) : [...draft.taxes_id, tax.id];
                      set('taxes_id', next);
                    }}
                  >
                    <Text style={[styles.pickerItemText, selected && styles.pickerItemTextActive]}>
                      {tax.name} — {tax.rate}%
                    </Text>
                    {selected && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

export default function CreateOrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ order?: string }>();
  const editOrder = useMemo<EditOrder | null>(() => {
    if (!params.order) return null;
    try { return JSON.parse(params.order) as EditOrder; } catch { return null; }
  }, [params.order]);
  const editingId = editOrder?.id ?? null;
  const isEditMode = !!editingId;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);
  const [warehousePickerOpen, setWarehousePickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expectedDate, setExpectedDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [statusLabel, setStatusLabel] = useState('Pending Approval');
  const [notes, setNotes] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem>(newLineItem);

  useEffect(() => {
    const load = async () => {
      try {
        const [suppRes, whRes, uomRes, taxRes, productList] = await Promise.all([
          apiRequest<{ data?: Supplier[] }>('/purchase/suppliers'),
          apiRequest<{ data?: Warehouse[] }>('/inventory/warehouses?page_size=1000'),
          apiRequest<{ data?: Uom[] }>('/inventory/uoms'),
          apiRequest<{ data?: Tax[] }>('/purchase/taxes?page_size=1000'),
          getProducts(),
        ]);
        const suppList = suppRes?.data || [];
        const whList = whRes?.data || [];
        const uomList = uomRes?.data || [];
        setSuppliers(suppList);
        setWarehouses(whList);
        setUoms(uomList);
        setTaxes(taxRes?.data || []);
        setProducts(productList || []);

        // Editing an existing order — prefill from the passed-in order, resolving
        // names/ids the list payload doesn't carry against the freshly loaded lists.
        if (editOrder) {
          setSupplierId(editOrder.supplier_id || '');
          setSupplierName(
            editOrder.supplier_name || suppList.find((s) => s.id === editOrder.supplier_id)?.name || ''
          );
          setWarehouseId(editOrder.warehouse_id || '');
          setWarehouseName(whList.find((w) => w.id === editOrder.warehouse_id)?.name || '');
          if (editOrder.order_date) setOrderDate(editOrder.order_date.slice(0, 10));
          if (editOrder.expected_delivery_date) setExpectedDate(editOrder.expected_delivery_date.slice(0, 10));
          const opt = STATUS_OPTIONS.find((o) => o.value === editOrder.status);
          if (opt) { setStatus(opt.value); setStatusLabel(opt.label); }
          setItems(
            (editOrder.items || []).map((it, idx) => {
              const matchedUom = uomList.find((u) => u.name === it.uom);
              return {
                key: `edit-${idx}-${it.product_id}`,
                product_id: it.product_id,
                product_name: it.description,
                uom_id: matchedUom?.id ?? '',
                uom_name: it.uom || matchedUom?.name || '',
                qty: String(it.qty ?? ''),
                unit_price: String(it.unit_price ?? ''),
                discount_amount: String(it.discount_amount ?? 0),
                taxes_id: it.taxes_id ?? [],
              };
            })
          );
        }
      } catch (e) {
        showErrorAlert(e, { fallback: 'Failed to load form data. Please try again.' });
      } finally {
        setLoadingData(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddItem = useCallback(() => {
    setEditingItem(newLineItem());
    setItemModalOpen(true);
  }, []);

  const openEditItem = useCallback((item: LineItem) => {
    setEditingItem(item);
    setItemModalOpen(true);
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const upsertItem = useCallback((item: LineItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.key === item.key);
      return exists ? prev.map((i) => (i.key === item.key ? item : i)) : [...prev, item];
    });
    setItemModalOpen(false);
  }, []);

  const { subTotal, taxTotal, grandTotal } = (() => {
    let subTotal = 0, taxTotal = 0;
    for (const item of items) {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const discount = parseFloat(item.discount_amount) || 0;
      const base = qty * price - discount;
      const rate = taxes
        .filter((t) => item.taxes_id.includes(t.id))
        .reduce((sum, t) => sum + (t.rate || 0), 0);
      subTotal += base;
      taxTotal += base * (rate / 100);
    }
    return { subTotal, taxTotal, grandTotal: subTotal + taxTotal };
  })();

  const validate = () => {
    if (!supplierId) { Alert.alert('Validation', 'Please select a supplier.'); return false; }
    if (!warehouseId) { Alert.alert('Validation', 'Please select a warehouse.'); return false; }
    if (!orderDate) { Alert.alert('Validation', 'Please enter an order date.'); return false; }
    if (items.length === 0) { Alert.alert('Validation', 'Please add at least one item.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const { show, hide } = useLoadingModalStore.getState();
    show(isEditMode ? 'Updating order...' : 'Creating order...');
    try {
      const payload = {
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        order_date: new Date(orderDate).toISOString(),
        items: items.map((item, idx) => ({
          product_id: item.product_id,
          uom: item.uom_name,
          uom_id: item.uom_id,
          description: item.product_name,
          unit_price: parseFloat(item.unit_price) || 0,
          qty: parseFloat(item.qty) || 0,
          discount_amount: parseFloat(item.discount_amount) || 0,
          taxes_id: item.taxes_id,
          sequence: idx,
        })),
        taxes_and_charges: [],
      };

      await apiRequest(isEditMode ? `/purchase/orders/${editingId}` : '/purchase/orders', {
        method: isEditMode ? 'PUT' : 'POST',
        body: payload,
      });

      appAlert(
        'Success',
        isEditMode ? 'Purchase order updated successfully!' : 'Purchase order created successfully!',
        [{ text: 'OK', onPress: () => router.replace('/orders') }],
        { variant: 'success' }
      );
    } catch (err: any) {
      showErrorAlert(err, {
        fallback: isEditMode ? 'Failed to update purchase order.' : 'Failed to create purchase order.',
      });
    } finally {
      hide();
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'} onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={styles.loadingText}>Loading form data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="New Purchase Order" onBack={() => router.back()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Details */}
          <SectionCard icon="document-text-outline" title="Order Details">
            <SelectRow label="Supplier" required value={supplierName} placeholder="Select supplier" onPress={() => setSupplierPickerOpen(true)} />
            <SelectRow label="Warehouse" required value={warehouseName} placeholder="Select warehouse" onPress={() => setWarehousePickerOpen(true)} />
            <View style={styles.fieldWrap}>
              <FieldLabel label="Order Date" required />
              <DatePickerField value={orderDate} onChange={setOrderDate} placeholder="Select date" />
            </View>
            <View style={styles.fieldWrap}>
              <FieldLabel label="Expected Delivery Date" />
              <DatePickerField value={expectedDate} onChange={setExpectedDate} placeholder="Select date (optional)" clearable minimumDate={orderDate ? new Date(orderDate) : undefined} />
            </View>
            <SelectRow label="Status" value={statusLabel} placeholder="Select status" onPress={() => setStatusPickerOpen(true)} />
            <View style={styles.fieldWrap}>
              <FieldLabel label="Notes" />
              <TextInput style={[styles.textInput, styles.textArea]} placeholder="Optional internal notes..." placeholderTextColor={Colors.textTertiary} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />
            </View>
          </SectionCard>

          {/* Order Items */}
          <SectionCard icon="cart-outline" title={`Order Items (${items.length})`}>
            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <View style={styles.emptyItemsIcon}>
                  <Ionicons name="cart-outline" size={26} color={Colors.textTertiary} />
                </View>
                <Text style={styles.emptyItemsTitle}>The cart is empty</Text>
                <Text style={styles.emptyItemsSubtitle}>Tap “Add Item” to start building your order.</Text>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
                  <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                  <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
                  <View style={styles.colActions} />
                </View>
                {items.map((item) => {
                  const lineTotal = calcItemTotal(item);
                  return (
                    <View key={item.key} style={styles.tableRow}>
                      <View style={styles.colItem}>
                        <Text style={styles.tableItemName} numberOfLines={1}>{item.product_name}</Text>
                        <Text style={styles.tableItemMeta} numberOfLines={1}>
                          {item.uom_name || '—'} · ETB {(parseFloat(item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, styles.colQty]}>{parseFloat(item.qty) || 0}</Text>
                      <Text style={[styles.tableCell, styles.colAmount, styles.tableAmount]}>
                        {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <View style={[styles.colActions, styles.tableActions]}>
                        <Pressable onPress={() => openEditItem(item)} hitSlop={6} style={styles.tableActionBtn}>
                          <Ionicons name="create-outline" size={18} color={Brand.primary} />
                        </Pressable>
                        <Pressable onPress={() => removeItem(item.key)} hitSlop={6} style={styles.tableActionBtn}>
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            <TouchableOpacity style={styles.addItemBtn} onPress={openAddItem} activeOpacity={0.75}>
              <Ionicons name="add-circle-outline" size={20} color={Brand.primary} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary Breakdown</Text>
            <View style={styles.summaryColumns}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColLabel}>Subtotal</Text>
                <Text style={styles.summaryColValue}>ETB {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.summaryColDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColLabel}>Tax Total</Text>
                <Text style={styles.summaryColValue}>ETB {taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            </View>
            <View style={styles.summaryHr} />
            <Text style={styles.summaryGrandLabel}>Grand Total</Text>
            <Text style={styles.summaryGrandValue}>ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            title={
              submitting
                ? isEditMode ? 'Updating Order...' : 'Creating Order...'
                : isEditMode ? 'Update Purchase Order' : 'Create Purchase Order'
            }
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>

      <ItemFormModal
        visible={itemModalOpen}
        initial={editingItem}
        products={products}
        uoms={uoms}
        taxes={taxes}
        onClose={() => setItemModalOpen(false)}
        onSubmit={upsertItem}
      />

      <PickerModal
        visible={supplierPickerOpen}
        title="Select Supplier"
        items={suppliers}
        selectedId={supplierId}
        onSelect={(s) => { setSupplierId(s.id); setSupplierName((s as any).name); }}
        onClose={() => setSupplierPickerOpen(false)}
      />

      <PickerModal
        visible={warehousePickerOpen}
        title="Select Warehouse"
        items={warehouses}
        selectedId={warehouseId}
        onSelect={(w) => { setWarehouseId(w.id); setWarehouseName((w as any).name); }}
        onClose={() => setWarehousePickerOpen(false)}
        renderLabel={(w) => `${(w as any).name} (${(w as any).code})`}
      />

      <Modal visible={statusPickerOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setStatusPickerOpen(false)}>
        <View style={styles.sheetContainer}>
          <Pressable style={styles.overlay} onPress={() => setStatusPickerOpen(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerSheetHeader}>
              <Text style={styles.pickerSheetTitle}>Select Status</Text>
              <Pressable onPress={() => setStatusPickerOpen(false)} hitSlop={8}><Ionicons name="close" size={22} color={Colors.text} /></Pressable>
            </View>
            {STATUS_OPTIONS.map((opt) => {
              const active = opt.value === status;
              return (
                <Pressable key={opt.value} style={[styles.pickerItem, active && styles.statusItemActive]}
                  onPress={() => { setStatus(opt.value); setStatusLabel(opt.label); setStatusPickerOpen(false); }}>
                  <Text style={[styles.pickerItemText, { color: active ? Colors.white : opt.color, fontWeight: '700' }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={Colors.white} />}
                </Pressable>
              );
            })}
            <View style={{ height: 32 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...Typography.subhead, color: Colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  sectionCard: {
    gap: 12,
    paddingVertical: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...Typography.subhead, fontWeight: '700', color: Colors.text, fontSize: 14 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.2 },
  required: { color: Colors.danger },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 11, minHeight: 44,
  },
  selectText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  placeholderText: { color: '#9CA3AF' },
  textInput: {
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: Colors.text, minHeight: 44,
  },
  textArea: { minHeight: 80, paddingTop: 11 },
  twoCol: { flexDirection: 'row', gap: 10 },
  // ── Empty items state ──
  emptyItems: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyItemsIcon: {
    width: 52, height: 52, borderRadius: Radius.lg,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyItemsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptyItemsSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  // ── Items table ──
  table: {
    borderWidth: 1, borderColor: '#EEF0F2', borderRadius: Radius.lg, overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: '#EEF0F2',
  },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F1F3',
  },
  colItem: { flex: 1, paddingRight: 8 },
  colQty: { width: 40, textAlign: 'center' },
  colAmount: { width: 84, textAlign: 'right' },
  colActions: { width: 60, flexDirection: 'row', justifyContent: 'flex-end' },
  tableCell: { fontSize: 13, color: Colors.text },
  tableItemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  tableItemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  tableAmount: { fontWeight: '700' },
  tableActions: { gap: 8, alignItems: 'center' },
  tableActionBtn: { padding: 2 },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Brand.primary, borderStyle: 'dashed',
    borderRadius: Radius.md, paddingVertical: 12, marginTop: 4,
  },
  addItemBtnText: { fontSize: 14, fontWeight: '600', color: Brand.primary },
  summaryCard: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.xl,
    padding: 20,
    ...Shadow.iosCard,
  },
  summaryTitle: {
    fontSize: 13, fontWeight: '800', letterSpacing: 0.6,
    color: Colors.white, textTransform: 'uppercase', marginBottom: 16,
  },
  summaryColumns: { flexDirection: 'row', alignItems: 'stretch' },
  summaryCol: { flex: 1 },
  summaryColDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.18)', marginHorizontal: 16 },
  summaryColLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
    color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase', marginBottom: 6,
  },
  summaryColValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  summaryHr: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.25)', marginTop: 16, marginBottom: 14 },
  summaryGrandLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.6,
    color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4,
  },
  summaryGrandValue: {
    fontSize: 30, fontWeight: '800', color: Colors.white, textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  submitBtn: { height: 52, borderRadius: Radius.lg },
  sheetContainer: { flex: 1, justifyContent: 'flex-end' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', paddingTop: 8,
    overflow: 'hidden',
  },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 8,
  },
  pickerSheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  pickerSheetTitle: { ...Typography.headline, fontWeight: '700', color: Colors.text },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 0 },
  pickerEmptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, paddingVertical: 28 },
  itemFormSheet: { height: '88%', maxHeight: '88%' },
  itemFormScroll: { flex: 1 },
  itemFormContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, gap: 12 },
  itemFormFooter: {
    paddingHorizontal: 24, paddingTop: 12, gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 4 },
  readonlyInput: { backgroundColor: '#F3F4F6', justifyContent: 'center' },
  readonlyText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  itemFormTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemFormTotalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  itemFormTotalValue: { fontSize: 16, fontWeight: '700', color: Brand.primary },
  itemFormSubmit: { height: 50, borderRadius: Radius.lg, marginTop: 6 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6',
  },
  pickerItemActive: { backgroundColor: Brand.primaryMuted },
  statusItemActive: { backgroundColor: Brand.primary },
  pickerItemText: { fontSize: 15, color: Colors.text, flex: 1 },
  pickerItemTextActive: { color: Brand.primary, fontWeight: '600' },
});

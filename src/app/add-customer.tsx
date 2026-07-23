import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { CUSTOMER_ID_TYPES, CUSTOMER_TRANSACTION_TYPES } from '@/data/customerFormOptions';
import {
  CUSTOMER_COUNTRIES,
  DEFAULT_COUNTRY_ID,
  ETHIOPIA_REGIONS,
  getCountryLabel,
  getEthiopiaRegion,
  getEthiopiaRegionLabel,
  getEthiopiaWeredaLabel,
  getEthiopiaZone,
  getEthiopiaZoneLabel,
  isEthiopiaCountry,
} from '@/data/ethiopianLocations';
import { addCustomerSchema, type AddCustomerForm } from '@/features/customers/schemas';
import { createCustomer } from '@/services/customerService';
import { useCartStore } from '@/store/cartStore';
import { appAlert } from '@/utils/alert';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { withLoading } from '@/utils/withLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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

type PickerField =
  | 'transactionType'
  | 'idType'
  | 'country'
  | 'region'
  | 'zone'
  | 'wereda';

type SelectOption = { id: string; label: string };

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SelectField({
  label,
  value,
  placeholder,
  error,
  disabled,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={[styles.select, error && styles.selectError, disabled && styles.selectDisabled]}
        onPress={disabled ? undefined : onPress}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function AddCustomerScreen() {
  const queryClient = useQueryClient();
  const setSelectedCustomer = useCartStore((s) => s.setSelectedCustomer);
  const [pickerField, setPickerField] = useState<PickerField | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddCustomerForm>({
    resolver: zodResolver(addCustomerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      country: DEFAULT_COUNTRY_ID,
      region: '',
      city: '',
      zone: '',
      wereda: '',
      kebele: '',
      locality: '',
      street: '',
      houseNumber: '',
      transactionType: 'B2C',
      idType: '',
      idNumber: '',
    },
  });

  const transactionType = watch('transactionType');
  const idType = watch('idType');
  const country = watch('country');
  const region = watch('region');
  const zone = watch('zone');
  const wereda = watch('wereda');
  const isEthiopia = isEthiopiaCountry(country);

  useEffect(() => {
    setValue('region', '');
    setValue('zone', '');
    setValue('wereda', '');
  }, [country, setValue]);

  useEffect(() => {
    if (!isEthiopia) return;
    setValue('zone', '');
    setValue('wereda', '');
  }, [isEthiopia, region, setValue]);

  useEffect(() => {
    if (!isEthiopia) return;
    setValue('wereda', '');
  }, [isEthiopia, zone, setValue]);

  const transactionLabel =
    CUSTOMER_TRANSACTION_TYPES.find((option) => option.id === transactionType)?.label ??
    transactionType;
  const idTypeLabel =
    CUSTOMER_ID_TYPES.find((option) => option.id === idType)?.label ?? idType;
  const countryLabel = getCountryLabel(country);
  const regionLabel = isEthiopia ? getEthiopiaRegionLabel(region) : region;
  const zoneLabel = isEthiopia ? getEthiopiaZoneLabel(region, zone) : zone;
  const weredaLabel = isEthiopia ? getEthiopiaWeredaLabel(region, zone, wereda) : wereda;

  const pickerOptions = useMemo((): SelectOption[] => {
    if (pickerField === 'transactionType') {
      return CUSTOMER_TRANSACTION_TYPES.map((option) => ({ id: option.id, label: option.label }));
    }
    if (pickerField === 'idType') {
      return CUSTOMER_ID_TYPES.map((option) => ({ id: option.id, label: option.label }));
    }
    if (pickerField === 'country') {
      return CUSTOMER_COUNTRIES;
    }
    if (pickerField === 'region') {
      return ETHIOPIA_REGIONS.map((option) => ({ id: option.id, label: option.label }));
    }
    if (pickerField === 'zone') {
      return getEthiopiaRegion(region)?.zones.map((option) => ({ id: option.id, label: option.label })) ?? [];
    }
    if (pickerField === 'wereda') {
      return getEthiopiaZone(region, zone)?.weredas.map((option) => ({ id: option.id, label: option.label })) ?? [];
    }
    return [];
  }, [pickerField, region, zone]);

  const pickerValue =
    pickerField === 'transactionType'
      ? transactionType
      : pickerField === 'idType'
        ? idType
        : pickerField === 'country'
          ? country
          : pickerField === 'region'
            ? region
            : pickerField === 'zone'
              ? zone
              : wereda;

  const pickerTitle =
    pickerField === 'transactionType'
      ? 'Transaction Type'
      : pickerField === 'idType'
        ? 'ID Type'
        : pickerField === 'country'
          ? 'Country'
          : pickerField === 'region'
            ? 'Region'
            : pickerField === 'zone'
              ? 'Zone'
              : pickerField === 'wereda'
                ? 'Wereda'
                : '';

  const onSubmit = async (data: AddCustomerForm) => {
    const ethiopia = isEthiopiaCountry(data.country);

    try {
      const customer = await withLoading(async () => {
        const created = await createCustomer({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          country: data.country,
          region: ethiopia ? getEthiopiaRegionLabel(data.region) : data.region,
          city: data.city,
          zone: ethiopia ? getEthiopiaZoneLabel(data.region, data.zone) : data.zone,
          wereda: ethiopia ? getEthiopiaWeredaLabel(data.region, data.zone, data.wereda) : data.wereda,
          kebele: data.kebele,
          locality: data.locality,
          street: data.street,
          houseNumber: data.houseNumber,
          transactionType: data.transactionType,
          idType: data.idType,
          idNumber: data.idNumber,
        });

        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        return created;
      }, 'Saving customer...');

      setSelectedCustomer(customer);

      appAlert('Customer Saved', 'The new customer was added successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Could Not Save Customer', getApiErrorMessage(error), undefined, {
        variant: 'error',
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Add New Customer" onBack={() => router.back()} />

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
          <Text style={styles.lead}>
            Fill in the details below to create a new customer profile.
          </Text>

          <View style={styles.form}>
            <SectionTitle>BASIC INFORMATION</SectionTitle>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name *"
                  placeholder="e.g. John Doe"
                  value={value}
                  onChangeText={onChange}
                  error={errors.fullName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <PhoneInput
                  label="Phone Number"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="e.g. john@example.com"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <SectionTitle>ADDRESS & LOCATION</SectionTitle>
            <SelectField
              label="Country"
              value={countryLabel}
              placeholder="Select country"
              onPress={() => setPickerField('country')}
            />
            {isEthiopia ? (
              <>
                <SelectField
                  label="Region"
                  value={regionLabel}
                  placeholder="Select region"
                  onPress={() => setPickerField('region')}
                />
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <Input label="City" value={value ?? ''} onChangeText={onChange} />
                  )}
                />
                <SelectField
                  label="Zone"
                  value={zoneLabel}
                  placeholder={region ? 'Select zone' : 'Select a region first'}
                  disabled={!region}
                  onPress={() => setPickerField('zone')}
                />
                <SelectField
                  label="Wereda"
                  value={weredaLabel}
                  placeholder={zone ? 'Select wereda' : 'Select a zone first'}
                  disabled={!zone}
                  onPress={() => setPickerField('wereda')}
                />
              </>
            ) : (
              <>
                <Controller
                  control={control}
                  name="region"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Region" value={value ?? ''} onChangeText={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <Input label="City" value={value ?? ''} onChangeText={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="zone"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Zone" value={value ?? ''} onChangeText={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="wereda"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Wereda" value={value ?? ''} onChangeText={onChange} />
                  )}
                />
              </>
            )}
            <Controller
              control={control}
              name="kebele"
              render={({ field: { onChange, value } }) => (
                <Input label="Kebele" value={value ?? ''} onChangeText={onChange} />
              )}
            />
            <Controller
              control={control}
              name="locality"
              render={({ field: { onChange, value } }) => (
                <Input label="Locality" value={value ?? ''} onChangeText={onChange} />
              )}
            />
            <Controller
              control={control}
              name="street"
              render={({ field: { onChange, value } }) => (
                <Input label="Street" value={value ?? ''} onChangeText={onChange} />
              )}
            />
            <Controller
              control={control}
              name="houseNumber"
              render={({ field: { onChange, value } }) => (
                <Input label="House Number" value={value ?? ''} onChangeText={onChange} />
              )}
            />

            <SectionTitle>TAX & IDENTIFICATION</SectionTitle>
            <SelectField
              label="Transaction Type"
              value={transactionLabel}
              placeholder="Select transaction type"
              onPress={() => setPickerField('transactionType')}
            />
            <SelectField
              label="ID Type"
              value={idTypeLabel}
              placeholder="Select ID Type"
              onPress={() => setPickerField('idType')}
            />
            <Controller
              control={control}
              name="idNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="ID Number"
                  placeholder="Enter ID number"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Button
              title="Save Customer"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerField !== null}
        onClose={() => setPickerField(null)}
        title={pickerTitle}
      >
        <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
          {pickerOptions.map((option) => {
            const active = pickerValue === option.id;
            return (
              <Pressable
                key={`${pickerField}-${option.id}`}
                style={[styles.pickerOption, active && styles.pickerOptionActive]}
                onPress={() => {
                  if (pickerField === 'transactionType') {
                    setValue('transactionType', option.id, { shouldValidate: true });
                  } else if (pickerField === 'idType') {
                    setValue('idType', option.id, { shouldValidate: true });
                  } else if (pickerField === 'country') {
                    setValue('country', option.id, { shouldValidate: true });
                  } else if (pickerField === 'region') {
                    setValue('region', option.id, { shouldValidate: true });
                  } else if (pickerField === 'zone') {
                    setValue('zone', option.id, { shouldValidate: true });
                  } else if (pickerField === 'wereda') {
                    setValue('wereda', option.id, { shouldValidate: true });
                  }
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  lead: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  form: { gap: 16 },
  sectionTitle: {
    ...Typography.caption1,
    color: Brand.primary,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '500' },
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
  selectDisabled: { opacity: 0.55 },
  selectText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  selectPlaceholder: { color: Colors.textTertiary },
  fieldError: { ...Typography.caption1, color: Colors.danger },
  pickerList: { maxHeight: 320 },
  pickerOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pickerOptionActive: { backgroundColor: Brand.primaryMuted },
  pickerOptionText: { ...Typography.subhead, color: Colors.text },
  pickerOptionTextActive: { color: Brand.primary, fontWeight: '600' },
});

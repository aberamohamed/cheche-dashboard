import { AuthInputIcon } from '@/components/auth/AuthInputIcon';
import { OnboardingStepActions } from '@/components/auth/OnboardingStepActions';
import { OnboardingScreenShell } from '@/components/auth/OnboardingScreenShell';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
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
} from '@/data/ethiopianLocations';
import { BUSINESS_TYPES, OTHER_BUSINESS_TYPE, resolveBusinessTypeValue } from '@/data/businessTypes';
import type { OnboardingBilling, OnboardingPlanId } from '@/data/onboardingPlans';
import { businessSchema, type BusinessForm } from '@/features/auth/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { EtradeRegistrationInfo } from '@/types/etrade';
import { appAlert } from '@/utils/alert';
import { mapEtradeToBusinessDefaults } from '@/utils/etrade';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type RegistrationMode = 'choose' | 'business';
type ManualFormPhase = 'business' | 'address';
type PickerField = 'country' | 'region' | 'zone' | 'wereda';
type SelectOption = { id: string; label: string };

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
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.select, error && styles.selectError, disabled && styles.selectDisabled]}
        onPress={disabled ? undefined : onPress}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterBusinessScreen() {
  const params = useLocalSearchParams<{
    plan?: string;
    billing?: string;
    etrade?: string;
    source?: string;
  }>();
  const plan = (params.plan as OnboardingPlanId | undefined) ?? 'starter';
  const billing = (params.billing as OnboardingBilling | undefined) ?? 'monthly';
  const fromEtrade = params.source === 'etrade' && !!params.etrade;
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>(
    fromEtrade ? 'business' : 'choose'
  );
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [manualFormPhase, setManualFormPhase] = useState<ManualFormPhase>('business');

  const { control, handleSubmit, trigger, setError, clearErrors, setValue, watch, formState: { errors } } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      legalName: '',
      tin: '',
      businessType: '',
      otherBusinessType: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: DEFAULT_COUNTRY_ID,
      region: '',
      zone: '',
      wereda: '',
      workspaceName: '',
      businessLicenseUri: '',
    },
  });

  const selectedBusinessType = watch('businessType');
  const businessLicenseUri = watch('businessLicenseUri');
  const country = watch('country');
  const region = watch('region');
  const zone = watch('zone');
  const wereda = watch('wereda');

  const countryLabel = getCountryLabel(country);
  const regionLabel = getEthiopiaRegionLabel(region);
  const zoneLabel = getEthiopiaZoneLabel(region, zone);
  const weredaLabel = getEthiopiaWeredaLabel(region, zone, wereda);

  useEffect(() => {
    if (!params.etrade) return;
    try {
      const info = JSON.parse(params.etrade) as EtradeRegistrationInfo;
      const defaults = mapEtradeToBusinessDefaults(info);
      (Object.entries(defaults) as [keyof BusinessForm, string][]).forEach(([key, value]) => {
        if (value) setValue(key, value);
      });
      setRegistrationMode('business');
    } catch {
      // ignore malformed eTrade payload
    }
  }, [params.etrade, setValue]);

  useEffect(() => {
    if (fromEtrade) return;
    setValue('region', '', { shouldValidate: true });
    setValue('zone', '', { shouldValidate: true });
    setValue('wereda', '', { shouldValidate: true });
  }, [country, fromEtrade, setValue]);

  useEffect(() => {
    if (fromEtrade) return;
    setValue('zone', '', { shouldValidate: true });
    setValue('wereda', '', { shouldValidate: true });
  }, [region, fromEtrade, setValue]);

  useEffect(() => {
    if (fromEtrade) return;
    setValue('wereda', '', { shouldValidate: true });
  }, [zone, fromEtrade, setValue]);

  useEffect(() => {
    if (fromEtrade) return;
    const parts = [countryLabel, regionLabel, zoneLabel, weredaLabel].filter(Boolean);
    const address = parts.join(', ');
    setValue('address', address, { shouldValidate: true });
    setValue('city', weredaLabel || zoneLabel || regionLabel || '', { shouldValidate: true });
  }, [countryLabel, regionLabel, zoneLabel, weredaLabel, fromEtrade, setValue]);

  const validateManualAddress = (data: BusinessForm) => {
    if (!data.country?.trim()) {
      setError('country', { type: 'manual', message: 'Country is required.' });
      return false;
    }
    if (!data.region?.trim()) {
      setError('region', { type: 'manual', message: 'Region is required.' });
      return false;
    }
    if (!data.zone?.trim()) {
      setError('zone', { type: 'manual', message: 'Zone is required.' });
      return false;
    }
    if (!data.wereda?.trim()) {
      setError('wereda', { type: 'manual', message: 'Woreda is required.' });
      return false;
    }
    return true;
  };

  const continueManualBusinessStep = async () => {
    const fieldsValid = await trigger([
      'businessName',
      'tin',
      'businessType',
      'otherBusinessType',
      'phone',
      'email',
    ]);
    if (!businessLicenseUri?.trim()) {
      setError('businessLicenseUri', {
        type: 'manual',
        message: 'Business license upload is required for manual registration.',
      });
      return;
    }
    if (fieldsValid) {
      setManualFormPhase('address');
    }
  };

  const onSubmit = (data: BusinessForm) => {
    if (!fromEtrade && !validateManualAddress(data)) {
      return;
    }
    const { otherBusinessType, ...businessFields } = data;
    const manualAddress = [countryLabel, regionLabel, zoneLabel, weredaLabel].filter(Boolean).join(', ');
    const manualCity = weredaLabel || zoneLabel || regionLabel || '';
    router.push({
      pathname: '/(auth)/register-owner',
      params: {
        mode: 'business',
        business: JSON.stringify({
          ...businessFields,
          ...(fromEtrade
            ? {}
            : {
                address: manualAddress,
                city: manualCity,
              }),
          businessType: resolveBusinessTypeValue(data.businessType, otherBusinessType),
        }),
        plan,
        billing,
        ...(fromEtrade ? { source: 'etrade' } : {}),
      },
    });
  };

  const continueAsGuest = () => {
    router.push({
      pathname: '/(auth)/register-owner',
      params: { mode: 'guest', plan, billing },
    });
  };

  const handleBack = () => {
    if (fromEtrade) {
      router.back();
      return;
    }
    if (registrationMode === 'business' && manualFormPhase === 'address') {
      setManualFormPhase('business');
      return;
    }
    if (registrationMode === 'business') {
      setRegistrationMode('choose');
      return;
    }
    router.back();
  };

  const isChooseMode = registrationMode === 'choose';
  const isManualAddressPhase = !fromEtrade && !isChooseMode && manualFormPhase === 'address';
  const manualStep = isChooseMode ? undefined : fromEtrade ? 2 : manualFormPhase === 'address' ? 2 : 1;
  const screenTitle = isChooseMode
    ? 'How would you like to continue?'
    : fromEtrade
      ? 'Tell us about your business'
      : isManualAddressPhase
        ? 'Business address'
        : 'Business information';
  const screenSubtitle = isChooseMode
    ? 'Register your business or continue as a guest to get started quickly.'
    : fromEtrade
      ? 'Details imported from eTrade. Review, complete any missing fields, and submit for approval.'
      : isManualAddressPhase
        ? 'Select your business location using country, region, zone, and woreda.'
        : 'Enter your business details and upload your license to continue.';
  const pickerOptions: SelectOption[] =
    pickerField === 'country'
      ? CUSTOMER_COUNTRIES
      : pickerField === 'region'
        ? ETHIOPIA_REGIONS.map((option) => ({ id: option.id, label: option.label }))
        : pickerField === 'zone'
          ? getEthiopiaRegion(region)?.zones.map((option) => ({ id: option.id, label: option.label })) ?? []
          : pickerField === 'wereda'
            ? getEthiopiaZone(region, zone)?.weredas.map((option) => ({ id: option.id, label: option.label })) ?? []
            : [];
  const pickerTitle =
    pickerField === 'country'
      ? 'Country'
      : pickerField === 'region'
        ? 'Region'
        : pickerField === 'zone'
          ? 'Zone'
          : pickerField === 'wereda'
            ? 'Woreda'
            : '';
  const pickerValue =
    pickerField === 'country'
      ? country
      : pickerField === 'region'
        ? region
        : pickerField === 'zone'
          ? zone
          : wereda;

  const pickBusinessLicense = async () => {
    if (fromEtrade) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      appAlert('Permission required', 'Please allow photo library access to upload your business license.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    clearErrors('businessLicenseUri');
    setValue('businessLicenseUri', result.assets[0].uri, { shouldValidate: true });
  };

  return (
    <OnboardingScreenShell
      step={manualStep}
      totalSteps={isChooseMode ? undefined : 3}
      headerTitle="Business Registration"
      title={screenTitle}
      subtitle={screenSubtitle}
      onBack={handleBack}
      footer={
        isChooseMode ? (
          <OnboardingStepActions
            onPrevious={() => router.back()}
            showContinue={false}
          />
        ) : (
          <OnboardingStepActions
            onPrevious={
              fromEtrade
                ? () => router.back()
                : isManualAddressPhase
                  ? () => setManualFormPhase('business')
                  : () => setRegistrationMode('choose')
            }
            onContinue={
              fromEtrade
                ? handleSubmit(onSubmit)
                : isManualAddressPhase
                  ? handleSubmit(onSubmit)
                  : continueManualBusinessStep
            }
            continueTitle={isManualAddressPhase || fromEtrade ? 'Continue' : 'Next'}
          />
        )
      }
    >
      {isChooseMode ? (
        <View style={styles.choiceList}>
          <Pressable
            style={styles.choiceCard}
            onPress={() => {
              setManualFormPhase('business');
              setRegistrationMode('business');
            }}
          >
            <View style={styles.choiceIconWrap}>
              <Ionicons name="storefront-outline" size={28} color={Brand.primary} />
            </View>
            <View style={styles.choiceTextWrap}>
              <Text style={styles.choiceTitle}>Register Business</Text>
              <Text style={styles.choiceSubtitle}>
                Full business details for admin approval and your POS workspace.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.choiceCard} onPress={continueAsGuest}>
            <View style={styles.choiceIconWrap}>
              <Ionicons name="person-outline" size={28} color={Brand.primary} />
            </View>
            <View style={styles.choiceTextWrap}>
              <Text style={styles.choiceTitle}>Continue as Guest</Text>
              <Text style={styles.choiceSubtitle}>
                Skip business registration and provide guest contact details instead.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      ) : isManualAddressPhase ? (
        <View style={styles.form}>
          <View style={styles.locationBlock}>
            <SelectField
              label="Country"
              value={countryLabel}
              placeholder="Select country"
              error={errors.country?.message}
              onPress={() => setPickerField('country')}
            />
            <SelectField
              label="Region"
              value={regionLabel}
              placeholder="Select region"
              error={errors.region?.message}
              onPress={() => setPickerField('region')}
            />
            <SelectField
              label="Zone"
              value={zoneLabel}
              placeholder="Select zone"
              error={errors.zone?.message}
              disabled={!region}
              onPress={() => setPickerField('zone')}
            />
            <SelectField
              label="Woreda"
              value={weredaLabel}
              placeholder="Select woreda"
              error={errors.wereda?.message}
              disabled={!zone}
              onPress={() => setPickerField('wereda')}
            />
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <Controller control={control} name="businessName" render={({ field: { onChange, value } }) => (
            <Input label="Business Name" variant="flat" placeholder="Enter business name" value={value} onChangeText={onChange} error={errors.businessName?.message} icon={<AuthInputIcon name="storefront-outline" />} />
          )} />

          <Controller control={control} name="legalName" render={({ field: { onChange, value } }) => (
            <Input label="Legal Name (optional)" variant="flat" placeholder="Legal entity name" value={value} onChangeText={onChange} icon={<AuthInputIcon name="document-text-outline" />} />
          )} />

          <Controller control={control} name="tin" render={({ field: { onChange, value } }) => (
            <Input label="TIN" variant="flat" placeholder="0016324478" value={value} onChangeText={onChange} error={errors.tin?.message} keyboardType="number-pad" icon={<AuthInputIcon name="card-outline" />} />
          )} />

          {!fromEtrade ? (
            <View style={styles.licenseBlock}>
              <Text style={styles.label}>Business License Upload</Text>
              <Pressable
                style={[styles.licenseButton, errors.businessLicenseUri && styles.licenseButtonError]}
                onPress={pickBusinessLicense}
              >
                <View style={styles.licenseButtonLeft}>
                  <Ionicons name="document-attach-outline" size={18} color={Brand.primary} />
                  <Text
                    style={[
                      styles.licenseButtonText,
                      !businessLicenseUri && styles.licenseButtonPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {businessLicenseUri ? 'Business license selected' : 'Upload business license'}
                  </Text>
                </View>
                <Ionicons name="cloud-upload-outline" size={18} color={Brand.primary} />
              </Pressable>
              {errors.businessLicenseUri ? (
                <Text style={styles.error}>{errors.businessLicenseUri.message}</Text>
              ) : null}
            </View>
          ) : null}

          <View>
            <Text style={styles.label}>Business Type</Text>
            <Controller
              control={control}
              name="businessType"
              render={({ field: { onChange, value } }) => (
                <View style={styles.typeGrid}>
                  {BUSINESS_TYPES.map((type) => {
                    const selected = value === type.value;
                    return (
                      <Pressable
                        key={type.value}
                        style={[styles.typeTile, selected && styles.typeTileActive]}
                        onPress={() => {
                          onChange(type.value);
                          if (type.value !== OTHER_BUSINESS_TYPE) {
                            setValue('otherBusinessType', '');
                          }
                        }}
                      >
                        <View style={[styles.typeIconWrap, selected && styles.typeIconWrapActive]}>
                          <Ionicons
                            name={type.icon}
                            size={22}
                            color={selected ? Brand.primary : Colors.textSecondary}
                          />
                        </View>
                        <Text
                          style={[styles.typeLabel, selected && styles.typeLabelActive]}
                          numberOfLines={2}
                        >
                          {type.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
            {errors.businessType ? (
              <Text style={styles.error}>{errors.businessType.message}</Text>
            ) : null}
            {selectedBusinessType === OTHER_BUSINESS_TYPE ? (
              <View style={styles.otherTypeInput}>
                <Controller
                  control={control}
                  name="otherBusinessType"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Specify Business Type"
                      variant="flat"
                      placeholder="Enter your business type"
                      value={value ?? ''}
                      onChangeText={onChange}
                      error={errors.otherBusinessType?.message}
                      icon={<AuthInputIcon name="create-outline" />}
                    />
                  )}
                />
              </View>
            ) : null}
          </View>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                label="Phone Number"
                variant="flat"
                value={value}
                onChangeText={onChange}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <Input label="Email" variant="flat" placeholder="business@email.com" value={value} onChangeText={onChange} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" icon={<AuthInputIcon name="mail-outline" />} />
          )} />

          {fromEtrade ? (
            <>
              <Controller control={control} name="address" render={({ field: { onChange, value } }) => (
                <Input label="Business Address" variant="flat" placeholder="Street address" value={value} onChangeText={onChange} error={errors.address?.message} icon={<AuthInputIcon name="location-outline" />} />
              )} />
              <Controller control={control} name="city" render={({ field: { onChange, value } }) => (
                <Input label="City" variant="flat" placeholder="Addis Ababa" value={value} onChangeText={onChange} error={errors.city?.message} icon={<AuthInputIcon name="map-outline" />} />
              )} />
            </>
          ) : null}

          <Controller control={control} name="workspaceName" render={({ field: { onChange, value } }) => (
            <Input label="Branch / Workspace Name (optional)" variant="flat" placeholder="Main Branch" value={value} onChangeText={onChange} icon={<AuthInputIcon name="business-outline" />} />
          )} />
        </View>
      )}

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
                  if (pickerField === 'country') {
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
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  choiceList: { gap: 12, paddingTop: 8 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  choiceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTextWrap: { flex: 1, gap: 4 },
  choiceTitle: { ...Typography.headline, color: Colors.text, fontWeight: '700' },
  choiceSubtitle: { ...Typography.caption1, color: Colors.textSecondary, lineHeight: 18 },
  form: { gap: 16 },
  label: { ...Typography.subhead, color: Colors.text, fontWeight: '500', marginBottom: 8 },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 10,
  },
  typeTile: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    gap: 6,
  },
  typeTileActive: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryMuted,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWrapActive: {
    backgroundColor: '#FFF0F7',
  },
  typeLabel: {
    ...Typography.caption1,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  typeLabelActive: { color: Brand.primary, fontWeight: '700' },
  otherTypeInput: { marginTop: 12 },
  locationBlock: { gap: 12 },
  fieldWrap: { gap: 6 },
  select: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectError: { borderColor: Colors.danger },
  selectDisabled: { opacity: 0.5 },
  selectText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  selectPlaceholder: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  licenseBlock: {
    gap: 8,
  },
  licenseButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  licenseButtonError: {
    borderColor: Colors.danger,
  },
  licenseButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  licenseButtonText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  licenseButtonPlaceholder: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pickerList: {
    maxHeight: 360,
  },
  pickerOption: {
    minHeight: 46,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  pickerOptionActive: {
    backgroundColor: Brand.primaryMuted,
  },
  pickerOptionText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
  error: { ...Typography.caption1, color: Colors.danger, marginTop: 4 },
});

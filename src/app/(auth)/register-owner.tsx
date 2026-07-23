import { AuthInputIcon } from '@/components/auth/AuthInputIcon';
import { OnboardingStepActions } from '@/components/auth/OnboardingStepActions';
import { OnboardingScreenShell } from '@/components/auth/OnboardingScreenShell';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import type { OnboardingBilling, OnboardingPlanId } from '@/data/onboardingPlans';
import {
  guestFormSchema,
  ownerSchema,
  type BusinessForm,
  type GuestForm,
  type OwnerForm,
} from '@/features/auth/schemas';
import { submitGuestOnboardingRequest, submitOnboardingRequest } from '@/services/authService';
import type { EtradeBusinessByLicenseDetail, EtradeRegistrationInfo } from '@/types/etrade';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { appAlert } from '@/utils/alert';
import { isValidLocalPhone, stripToLocalPhone } from '@/utils/phone';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

export default function RegisterOwnerScreen() {
  const params = useLocalSearchParams<{
    business?: string;
    plan?: string;
    billing?: string;
    mode?: string;
    source?: string;
    etrade?: string;
    etradeDetail?: string;
  }>();
  const isGuest = params.mode === 'guest';
  const fromEtrade = params.source === 'etrade';
  const business: BusinessForm | null =
    !isGuest && params.business ? JSON.parse(params.business) : null;
  const etradeInfo: EtradeRegistrationInfo | null = (() => {
    if (!params.etrade) return null;
    try {
      return JSON.parse(params.etrade) as EtradeRegistrationInfo;
    } catch {
      return null;
    }
  })();
  const etradeDetail: EtradeBusinessByLicenseDetail | null = (() => {
    if (!params.etradeDetail) return null;
    try {
      return JSON.parse(params.etradeDetail) as EtradeBusinessByLicenseDetail;
    } catch {
      return null;
    }
  })();
  const associates = etradeInfo?.AssociateShortInfos ?? [];
  const detailAssociates = etradeDetail?.AssociateShortInfos ?? [];
  const etradeNameCandidates = associates.flatMap((associate) => [
    associate.ManagerNameEng?.trim() ?? '',
    associate.ManagerName?.trim() ?? '',
  ]);
  const etradeDetailNameCandidates = detailAssociates.flatMap((associate) => [
    associate.ManagerNameEng?.trim() ?? '',
    associate.ManagerName?.trim() ?? '',
  ]);
  const etradePhoneCandidates = associates.flatMap((associate) => [
    associate.MobilePhone?.trim() ?? '',
    associate.RegularPhone?.trim() ?? '',
  ]);
  const etradeDetailPhoneCandidates = [
    etradeDetail?.AddressInfo?.MobilePhone?.trim() ?? '',
    etradeDetail?.AddressInfo?.RegularPhone?.trim() ?? '',
    ...detailAssociates.flatMap((associate) => [
      associate.MobilePhone?.trim() ?? '',
      associate.RegularPhone?.trim() ?? '',
    ]),
  ];
  const plan = (params.plan as OnboardingPlanId | undefined) ?? 'starter';
  const billing = (params.billing as OnboardingBilling | undefined) ?? 'monthly';
  const prefilledOwnerName = [...etradeDetailNameCandidates, ...etradeNameCandidates]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] ?? '';
  const prefilledOwnerEmail = business?.email?.trim() || '';
  const prefilledOwnerPhoneFromApi =
    [...etradeDetailPhoneCandidates, ...etradePhoneCandidates]
      .map((phone) => stripToLocalPhone(phone))
      .find((localPhone) => isValidLocalPhone(localPhone)) ?? '';
  const prefilledOwnerPhone = prefilledOwnerPhoneFromApi || stripToLocalPhone(business?.phone || '');

  const ownerForm = useForm<OwnerForm>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      fullName: prefilledOwnerName,
      email: prefilledOwnerEmail,
      phone: prefilledOwnerPhone,
      password: '',
      confirmPassword: '',
    },
  });

  const goToPreviousStep = () => {
    if (fromEtrade && params.etrade) {
      router.replace({
        pathname: '/(auth)/register-etrade',
        params: {
          plan,
          billing,
          source: 'etrade',
          phase: 'preview',
          etrade: params.etrade,
          ...(params.etradeDetail ? { etradeDetail: params.etradeDetail } : {}),
        },
      });
      return;
    }
    router.back();
  };

  const guestForm = useForm<GuestForm>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmitOwner = async (data: OwnerForm) => {
    if (!business) {
      appAlert('Missing business info', 'Please complete business registration first.', undefined, {
        variant: 'error',
      });
      router.replace('/(auth)/register-plan');
      return;
    }

    try {
      const result = await submitOnboardingRequest(business, data, { plan, billing });
      appAlert('Request Submitted', result.message, [
        { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Registration Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const onSubmitGuest = async (data: GuestForm) => {
    try {
      const { confirmPassword: _, ...guestData } = data;
      const result = await submitGuestOnboardingRequest(guestData, { plan, billing });
      appAlert('Request Submitted', result.message, [
        { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
      ], { variant: 'success' });
    } catch (error) {
      appAlert('Registration Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
    }
  };

  const {
    control: ownerControl,
    handleSubmit: handleOwnerSubmit,
    formState: { errors: ownerErrors, isSubmitting: isOwnerSubmitting },
  } = ownerForm;

  const {
    control: guestControl,
    handleSubmit: handleGuestSubmit,
    formState: { errors: guestErrors, isSubmitting: isGuestSubmitting },
  } = guestForm;
  const submitOwner = handleOwnerSubmit(onSubmitOwner);
  const submitGuest = handleGuestSubmit(onSubmitGuest);

  const confirmSubmit = () => {
    appAlert(
      'Submit onboarding request?',
      'Please confirm before we send your registration request.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            if (isGuest) {
              submitGuest();
              return;
            }
            submitOwner();
          },
        },
      ],
      { variant: 'warning' }
    );
  };

  return (
    <OnboardingScreenShell
      step={isGuest ? undefined : 3}
      totalSteps={isGuest ? undefined : 3}
      headerTitle={isGuest ? 'Guest Details' : 'Owner Details'}
      title={isGuest ? 'Guest account details' : 'Admin account details'}
      subtitle={
        isGuest
          ? 'Enter your phone number and create a 6-digit PIN to continue.'
          : 'This will be used to manage your POS after approval.'
      }
      onBack={goToPreviousStep}
      footer={
        <OnboardingStepActions
          onPrevious={goToPreviousStep}
          onContinue={confirmSubmit}
          continueTitle="Submit Request"
          loading={isGuest ? isGuestSubmitting : isOwnerSubmitting}
        />
      }
    >
      {isGuest ? (
        <View style={styles.form}>
          <Controller
            control={guestControl}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                label="Phone Number"
                variant="flat"
                value={value}
                onChangeText={onChange}
                error={guestErrors.phone?.message}
              />
            )}
          />
          <Controller
            control={guestControl}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="PIN"
                variant="flat"
                placeholder="Create 6-digit PIN"
                value={value}
                onChangeText={onChange}
                error={guestErrors.password?.message}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                icon={<AuthInputIcon name="lock-closed-outline" />}
              />
            )}
          />
          <Controller
            control={guestControl}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm PIN"
                variant="flat"
                placeholder="Confirm 6-digit PIN"
                value={value}
                onChangeText={onChange}
                error={guestErrors.confirmPassword?.message}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                icon={<AuthInputIcon name="lock-closed-outline" />}
              />
            )}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Controller
            control={ownerControl}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                variant="flat"
                placeholder="Enter your full name"
                value={value}
                onChangeText={onChange}
                error={ownerErrors.fullName?.message}
                icon={<AuthInputIcon name="person-outline" />}
              />
            )}
          />
          <Controller
            control={ownerControl}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                variant="flat"
                placeholder="your@email.com"
                value={value}
                onChangeText={onChange}
                error={ownerErrors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<AuthInputIcon name="mail-outline" />}
              />
            )}
          />
          <Controller
            control={ownerControl}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                label="Phone Number"
                variant="flat"
                value={value}
                onChangeText={onChange}
                error={ownerErrors.phone?.message}
              />
            )}
          />
          <Controller
            control={ownerControl}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="PIN"
                variant="flat"
                placeholder="Create 6-digit PIN"
                value={value}
                onChangeText={onChange}
                error={ownerErrors.password?.message}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                icon={<AuthInputIcon name="lock-closed-outline" />}
              />
            )}
          />
          <Controller
            control={ownerControl}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm PIN"
                variant="flat"
                placeholder="Confirm 6-digit PIN"
                value={value}
                onChangeText={onChange}
                error={ownerErrors.confirmPassword?.message}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                icon={<AuthInputIcon name="lock-closed-outline" />}
              />
            )}
          />
        </View>
      )}
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
});

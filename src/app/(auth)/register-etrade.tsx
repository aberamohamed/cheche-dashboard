import { EtradeRegistrationPreview } from '@/components/auth/EtradeRegistrationPreview';
import { EtradeSearchFooterButton } from '@/components/auth/EtradeSearchFooterButton';
import { EtradeTinSearchStep } from '@/components/auth/EtradeTinSearchStep';
import { OnboardingStepActions } from '@/components/auth/OnboardingStepActions';
import { OnboardingScreenShell } from '@/components/auth/OnboardingScreenShell';
import { Brand, Colors } from '@/constants/theme';
import type { OnboardingBilling, OnboardingPlanId } from '@/data/onboardingPlans';
import {
  EtradeApiError,
  fetchEtradeRegistrationByTin,
  isValidEtradeTin,
  normalizeEtradeTin,
} from '@/services/etradeService';
import type { EtradeBusinessByLicenseDetail, EtradeRegistrationInfo } from '@/types/etrade';
import { getPrimaryEtradeBusiness } from '@/utils/etrade';
import { router, useLocalSearchParams } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';

type ScreenPhase = 'search' | 'preview';

export default function RegisterEtradeScreen() {
  const params = useLocalSearchParams<{
    plan?: string;
    billing?: string;
    source?: string;
    etrade?: string;
    etradeDetail?: string;
    phase?: string;
  }>();
  const plan = (params.plan as OnboardingPlanId | undefined) ?? 'professional';
  const billing = (params.billing as OnboardingBilling | undefined) ?? 'monthly';
  const shouldRestorePreview = params.phase === 'preview' && !!params.etrade;
  const initialRegistration = useMemo(() => {
    if (!shouldRestorePreview || !params.etrade) return null;
    try {
      return JSON.parse(params.etrade) as EtradeRegistrationInfo;
    } catch {
      return null;
    }
  }, [params.etrade, shouldRestorePreview]);
  const initialDetail = useMemo(() => {
    if (!shouldRestorePreview || !params.etradeDetail) return null;
    try {
      return JSON.parse(params.etradeDetail) as EtradeBusinessByLicenseDetail;
    } catch {
      return null;
    }
  }, [params.etradeDetail, shouldRestorePreview]);
  const initialPhase: ScreenPhase = shouldRestorePreview && initialRegistration ? 'preview' : 'search';

  const [phase, setPhase] = useState<ScreenPhase>(initialPhase);
  const [tin, setTin] = useState(initialRegistration?.Tin?.trim() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<EtradeRegistrationInfo | null>(initialRegistration);
  const [registrationDetail, setRegistrationDetail] = useState<EtradeBusinessByLicenseDetail | null>(
    initialDetail
  );

  const normalizedTin = normalizeEtradeTin(tin);
  const canSearch = isValidEtradeTin(normalizedTin) && !loading;
  const isSearchPhase = phase === 'search';

  const handleSearch = async () => {
    if (!canSearch) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchEtradeRegistrationByTin(normalizedTin, 'en');
      setRegistration(result);
      setPhase('preview');
    } catch (err) {
      const message =
        err instanceof EtradeApiError
          ? err.message
          : 'Could not connect to eTrade. Check your connection and try again.';
      setError(message);
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (phase === 'preview') {
      setPhase('search');
      setError(null);
      return;
    }
    if (params.plan || params.billing) {
      router.replace({
        pathname: '/(auth)/register-plan',
        params: { source: 'etrade' },
      });
      return;
    }
    router.replace('/(auth)/getting-started');
  };

  const handleConfirm = () => {
    if (!registration) return;
    const primaryBusiness = getPrimaryEtradeBusiness(registration);
    const primaryAssociate = registration.AssociateShortInfos?.[0];
    const contactPhone =
      registrationDetail?.AddressInfo?.MobilePhone?.trim() ||
      registrationDetail?.AddressInfo?.RegularPhone?.trim() ||
      registrationDetail?.AssociateShortInfos?.[0]?.MobilePhone?.trim() ||
      registrationDetail?.AssociateShortInfos?.[0]?.RegularPhone?.trim() ||
      primaryAssociate?.MobilePhone?.trim() ||
      primaryAssociate?.RegularPhone?.trim() ||
      '';
    const businessType =
      primaryBusiness?.BusinessLicensingGroupMain?.trim() ||
      primaryBusiness?.SubGroups?.[0]?.Description?.trim() ||
      'General';
    const businessPayload = {
      businessName: registration.BusinessName?.trim() || primaryBusiness?.TradesName?.trim() || '',
      legalName: registration.BusinessName?.trim() || primaryBusiness?.TradesName?.trim() || '',
      tin: registration.Tin?.trim() || '',
      businessType,
      phone: contactPhone,
      email: '',
      address: 'Addis Ababa',
      city: 'Addis Ababa',
      workspaceName:
        primaryBusiness?.TradesName?.trim() ||
        registration.BusinessName?.trim() ||
        'Main Branch',
    };

    router.push({
      pathname: '/(auth)/register-owner',
      params: {
        mode: 'business',
        business: JSON.stringify(businessPayload),
        etrade: JSON.stringify(registration),
        ...(registrationDetail ? { etradeDetail: JSON.stringify(registrationDetail) } : {}),
        plan,
        billing,
        source: 'etrade',
      },
    });
  };

  const handleTinChange = (value: string) => {
    setTin(normalizeEtradeTin(value).slice(0, 10));
    if (error) setError(null);
    if (phase === 'preview') {
      setPhase('search');
      setRegistration(null);
      setRegistrationDetail(null);
    }
  };

  return (
    <OnboardingScreenShell
      step={isSearchPhase ? 1 : 2}
      headerTitle="Business License"
      title={isSearchPhase ? 'Look up your business' : 'Confirm business details'}
      subtitle={
        isSearchPhase
          ? 'Enter your 10-digit TIN to verify your business license on eTrade.'
          : 'Make sure this matches your business before continuing with onboarding.'
      }
      introVariant={isSearchPhase ? 'plain' : 'card'}
      introIcon={
        !isSearchPhase ? (
          <Building2 size={24} color={Brand.primary} strokeWidth={2.2} />
        ) : undefined
      }
      accentStepLabel={isSearchPhase}
      backButtonVariant={isSearchPhase ? 'brand' : 'default'}
      hideFooterBorder={isSearchPhase}
      backgroundColor={Colors.white}
      onBack={handleBack}
      footer={
        isSearchPhase ? (
          <EtradeSearchFooterButton
            onPress={handleSearch}
            loading={loading}
            disabled={!canSearch}
          />
        ) : (
          <OnboardingStepActions
            onPrevious={() => setPhase('search')}
            showPrevious
            onContinue={handleConfirm}
            continueTitle="Confirm & Continue"
            disabled={!registration}
          />
        )
      }
    >
      {isSearchPhase ? (
        <EtradeTinSearchStep
          tin={tin}
          loading={loading}
          error={error}
          onChangeTin={handleTinChange}
          onSearch={handleSearch}
          canSearch={canSearch}
        />
      ) : null}

      {phase === 'preview' && registration ? (
        <EtradeRegistrationPreview
          data={registration}
          initialDetail={registrationDetail}
          onDetailLoaded={setRegistrationDetail}
        />
      ) : null}
    </OnboardingScreenShell>
  );
}

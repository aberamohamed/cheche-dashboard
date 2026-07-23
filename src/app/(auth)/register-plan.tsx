import { GlassSurface } from '@/components/auth/GlassSurface';
import { PlanCard } from '@/components/auth/PlanCard';
import { OnboardingStepActions } from '@/components/auth/OnboardingStepActions';
import { OnboardingScreenShell } from '@/components/auth/OnboardingScreenShell';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import {
  ONBOARDING_BILLING_OPTIONS,
  ONBOARDING_PLANS,
  type OnboardingBilling,
  type OnboardingPlanId,
} from '@/data/onboardingPlans';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function BillingToggle({
  billing,
  onChange,
}: {
  billing: OnboardingBilling;
  onChange: (value: OnboardingBilling) => void;
}) {
  return (
    <GlassSurface style={styles.billingShell}>
      <View style={styles.billingRow}>
        {ONBOARDING_BILLING_OPTIONS.map((option) => {
          const active = billing === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.billingChip, active && styles.billingChipActive]}
              onPress={() => onChange(option.id)}
            >
              <Text style={[styles.billingChipText, active && styles.billingChipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

export default function RegisterPlanScreen() {
  const params = useLocalSearchParams<{ source?: string }>();
  const isEtradeOnboarding = params.source === 'etrade';
  const [selectedPlan, setSelectedPlan] = useState<OnboardingPlanId>('professional');
  const [billing, setBilling] = useState<OnboardingBilling>('monthly');

  const handleContinue = () => {
    if (isEtradeOnboarding) {
      router.push({
        pathname: '/(auth)/register-etrade',
        params: { plan: selectedPlan, billing, source: 'etrade' },
      });
      return;
    }

    router.push({
      pathname: '/(auth)/register-business',
      params: {
        plan: selectedPlan,
        billing,
      },
    });
  };

  return (
    <OnboardingScreenShell
      headerTitle="Choose Plan"
      title="Pick your billing plan"
      subtitle="Select how you want to pay. You can change this after approval."
      backgroundColor={Colors.background}
      onBack={() => router.replace('/(auth)/getting-started')}
      pinnedAboveScroll={<BillingToggle billing={billing} onChange={setBilling} />}
      footer={
        <OnboardingStepActions
          showPrevious={false}
          onContinue={handleContinue}
          continueTitle="Get Started Now"
        />
      }
    >
      <View style={styles.cards}>
        {ONBOARDING_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            selected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id)}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  );
}

const styles = StyleSheet.create({
  billingShell: {
    borderRadius: Radius.full,
    padding: 4,
    alignSelf: 'stretch',
  },
  billingRow: {
    flexDirection: 'row',
    gap: 4,
  },
  billingChip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  billingChipActive: {
    backgroundColor: Brand.primary,
  },
  billingChipText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  billingChipTextActive: {
    color: Colors.white,
  },
  cards: { gap: 12 },
});

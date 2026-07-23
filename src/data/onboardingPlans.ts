export type OnboardingPlanId = 'starter' | 'professional' | 'enterprise';
export type OnboardingBilling = 'monthly' | 'yearly';

export interface OnboardingPlan {
  id: OnboardingPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  popular?: boolean;
}

export const ONBOARDING_BILLING_OPTIONS: { id: OnboardingBilling; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export const ONBOARDING_PLANS: OnboardingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Start selling with the essentials for a small shop or single branch.',
    monthlyPrice: 1499,
    features: [
      'Point of sale',
      'Basic inventory',
      'Customer records',
      'Sales reports',
      'Self onboarding',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Grow with better controls, branch workflows, and daily reporting.',
    monthlyPrice: 2999,
    popular: true,
    features: [
      'Multi-user access',
      'Branch operations',
      'Advanced inventory',
      'Payment tracking',
      'Approval workflow',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Run larger teams with governance, compliance, and stronger administration.',
    monthlyPrice: 4499,
    features: [
      'Multi-branch setup',
      'EIMS readiness',
      'System approvals',
      'Audit visibility',
      'Priority support',
    ],
  },
];

export function planPrice(plan: OnboardingPlan, billing: OnboardingBilling): number {
  if (billing === 'yearly') return plan.monthlyPrice * 10;
  return plan.monthlyPrice;
}

export function billingLabel(billing: OnboardingBilling): string {
  return billing === 'yearly' ? 'Per user/year' : 'Per user/month';
}

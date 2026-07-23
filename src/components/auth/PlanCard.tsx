import { GlassSurface } from '@/components/auth/GlassSurface';
import { Brand, Colors, Typography } from '@/constants/theme';
import type { OnboardingBilling, OnboardingPlan } from '@/data/onboardingPlans';
import { billingLabel, planPrice } from '@/data/onboardingPlans';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PlanCardProps {
  plan: OnboardingPlan;
  billing: OnboardingBilling;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, billing, selected, onSelect }: PlanCardProps) {
  const price = planPrice(plan, billing);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <GlassSurface selected={selected} interactive style={styles.card}>
        {plan.popular ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>POPULAR</Text>
          </View>
        ) : null}

        <Text style={styles.name}>{plan.name}</Text>
        <Text style={styles.description}>{plan.description}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.currency}>ETB</Text>
          <Text style={styles.price}>{price.toLocaleString('en-US')}</Text>
        </View>
        <Text style={styles.billing}>{billingLabel(billing)}</Text>

        <View style={styles.features}>
          {plan.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.checkWrap}>
                <Check size={14} color={Brand.primary} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.94 },
  card: {
    padding: 16,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  badgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  name: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '800',
  },
  description: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  currency: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  billing: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  features: {
    gap: 8,
    marginTop: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.primary,
  },
  featureText: {
    ...Typography.subhead,
    color: Colors.text,
    flex: 1,
  },
});

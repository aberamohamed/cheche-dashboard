import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import { WEBSITE_URL } from '@/data/contactUs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';
const CHECHE_LOGO = require('../../assets/images/icon.png');

const STATS = [
  { value: '100K+', label: 'Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: 'Fast', label: 'Checkout' },
];

const FEATURES = [
  { icon: 'cart-outline' as const, label: 'Quick Checkout', color: '#EC4899' },
  { icon: 'cube-outline' as const, label: 'Inventory', color: '#10B981' },
  { icon: 'receipt-outline' as const, label: 'Invoices', color: '#3B82F6' },
  { icon: 'people-outline' as const, label: 'Customers', color: '#8B5CF6' },
  { icon: 'pricetag-outline' as const, label: 'Coupons', color: '#F59E0B' },
  { icon: 'bar-chart-outline' as const, label: 'Reports', color: '#EF4444' },
];

const VALUES = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Trust & Security',
    desc: 'Secure authentication and reliable transaction handling for your business.',
  },
  {
    icon: 'flash-outline' as const,
    title: 'Speed',
    desc: 'Fast checkout flows designed for busy retail and service environments.',
  },
  {
    icon: 'globe-outline' as const,
    title: 'Inclusion',
    desc: 'Built for Ethiopian businesses of every size, wherever they operate.',
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="About Us" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['#BE185D', '#9D174D', '#2e0314']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />
            <Image source={CHECHE_LOGO} style={styles.heroLogo} resizeMode="contain" />
            <Text style={styles.heroTitle}>Cheche POS</Text>
            <Text style={styles.heroTagline}>
              Fast, reliable point of sale for Ethiopian businesses
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.statsRow}>
          {STATS.map((stat, index) => (
            <View key={stat.label} style={styles.statGroup}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {index < STATS.length - 1 ? <View style={styles.statDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(236,72,153,0.12)' }]}>
              <Ionicons name="rocket-outline" size={18} color={Brand.primary} />
            </View>
            <Text style={styles.cardTitle}>Our Mission</Text>
          </View>
          <Text style={styles.cardBody}>
            Cheche POS empowers Ethiopian businesses with a fast, reliable point-of-sale
            experience. From scanning items and managing inventory to invoicing customers and
            tracking sales, everything you need to run your shop is in one simple app — backed
            by the same trusted Cheche platform used across the country.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Ionicons name="grid-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>What We Offer</Text>
          </View>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <View
                key={feature.label}
                style={[
                  styles.featurePill,
                  {
                    borderColor: `${feature.color}30`,
                    backgroundColor: `${feature.color}12`,
                  },
                ]}
              >
                <Ionicons name={feature.icon} size={15} color={feature.color} />
                <Text style={[styles.featureLabel, { color: feature.color }]}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Ionicons name="heart-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Our Values</Text>
          </View>
          {VALUES.map((value) => (
            <View key={value.title} style={styles.valueRow}>
              <View style={[styles.valueDot, { backgroundColor: Brand.primary }]}>
                <Ionicons name={value.icon} size={13} color="#fff" />
              </View>
              <View style={styles.valueCopy}>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDesc}>{value.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.versionRow}>
          <View style={styles.versionBadge}>
            <MaterialCommunityIcons name="cellphone-check" size={13} color={Colors.textSecondary} />
            <Text style={styles.versionText}>Cheche POS · v{VERSION}</Text>
          </View>
        </View>

        <Pressable
          style={styles.ctaButton}
          onPress={() => Linking.openURL(WEBSITE_URL).catch(() => undefined)}
        >
          <LinearGradient
            colors={['#BE185D', '#9D174D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="globe-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Visit cheche.com.et</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  heroBanner: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
  },
  decoCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -40,
  },
  decoCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },
  heroLogo: {
    width: 90,
    height: 90,
    marginBottom: 14,
    borderRadius: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    paddingVertical: 16,
  },
  statGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Typography.subhead,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cardBody: {
    ...Typography.subhead,
    fontSize: 13,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  valueDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  valueCopy: { flex: 1 },
  valueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  valueDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  versionText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#BE185D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

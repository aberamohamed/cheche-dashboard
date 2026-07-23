import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import { CONTACT_METHODS, SOCIAL_LINKS } from '@/data/contactUs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactUsScreen() {
  const insets = useSafeAreaInsets();

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="Contact Us" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Ionicons name="help-circle-outline" size={16} color={Brand.primary} />
            <Text style={styles.heroBadgeText}>Support Center</Text>
          </View>
          <Text style={styles.heroText}>
            Our team is here to provide you with the best support experience.
          </Text>
        </View>

        <View style={styles.methodsCard}>
          {CONTACT_METHODS.map((method, index) => (
            <View key={method.id}>
              <Pressable style={styles.methodRow} onPress={() => openUrl(method.url)}>
                <View style={[styles.methodIconWrap, { backgroundColor: `${method.color}20` }]}>
                  <Ionicons name={method.icon} size={24} color={method.color} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodValue}>{method.value}</Text>
                </View>
                {method.actionLabel ? (
                  <View style={styles.methodActionPill}>
                    <Text style={styles.methodActionText}>{method.actionLabel}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                  </View>
                ) : null}
              </Pressable>
              {index < CONTACT_METHODS.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.socialFooter, { paddingBottom: insets.bottom || 12 }]}>
        <Text style={styles.socialTitle}>FOLLOW US ON SOCIAL MEDIA</Text>
        <View style={styles.socialCard}>
          <View style={styles.socialGrid}>
            {SOCIAL_LINKS.map((link) => (
              <Pressable key={link.id} style={styles.socialItem} onPress={() => openUrl(link.url)}>
                <Ionicons name={link.id} size={22} color={link.color} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingTop: 16 },
  socialFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  heroSection: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(236,72,153,0.14)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.primary,
    letterSpacing: 0.2,
  },
  heroText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  methodsCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  methodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 16,
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  methodValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  methodActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  methodActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  socialTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  socialCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  socialItem: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

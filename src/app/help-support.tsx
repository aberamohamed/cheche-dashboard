import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import { router } from 'expo-router';
import { Mail, MessageCircle, Phone } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const FAQ = [
  {
    q: 'How do I complete a sale?',
    a: 'Scan or search products on the Sell tab, then tap Pay to checkout.',
  },
  {
    q: 'How do I view sales history?',
    a: 'Open the History tab to browse past transactions and receipts.',
  },
  {
    q: 'What are low stock alerts?',
    a: 'Products below their minimum level appear in Dashboard alerts and the Low Stock list.',
  },
];

export default function HelpSupportScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Help & Support" onBack={() => router.back()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lead}>Need help? Reach our team or browse common questions.</Text>

        <View style={styles.contactCard}>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@cheche.et')}>
            <Mail size={20} color={Brand.primary} />
            <Text style={styles.contactText}>support@cheche.et</Text>
          </Pressable>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('tel:+251116123456')}>
            <Phone size={20} color={Brand.primary} />
            <Text style={styles.contactText}>+251 11 612 3456</Text>
          </Pressable>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('https://cheche.et')}>
            <MessageCircle size={20} color={Brand.primary} />
            <Text style={styles.contactText}>Live chat at cheche.et</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>FAQ</Text>
        {FAQ.map((item) => (
          <View key={item.q} style={styles.faqItem}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 4 },
  lead: { ...Typography.subhead, color: Colors.textSecondary, marginBottom: 12 },
  contactCard: {
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  contactText: { ...Typography.body, color: Colors.text },
  sectionLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  faqQ: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  faqA: { ...Typography.subhead, color: Colors.textSecondary },
});

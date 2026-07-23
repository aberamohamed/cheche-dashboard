import { Brand, Colors, Typography } from '@/constants/theme';
import { LockKeyhole } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface GuestRestrictedPlaceholderProps {
  title?: string;
  message?: string;
  onCompleteRegistration: () => void;
}

export function GuestRestrictedPlaceholder({
  title = 'Registration required',
  message = 'Complete your business registration to access items, checkout, and other POS features.',
  onCompleteRegistration,
}: GuestRestrictedPlaceholderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <LockKeyhole size={28} color={Brand.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Pressable style={styles.button} onPress={onCompleteRegistration}>
          <Text style={styles.buttonText}>Complete Registration</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: Colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    backgroundColor: Colors.white,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  button: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: Brand.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.headline,
    color: Colors.white,
    fontWeight: '700',
  },
});

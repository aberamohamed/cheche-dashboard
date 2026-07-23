import { Colors, Typography } from '@/constants/theme';
import { CloudOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface OfflinePlaceholderProps {
  /** Optional context line, e.g. "Invoices need an internet connection." */
  message?: string;
}

/**
 * Full-area placeholder shown on data-driven tabs (Home, Invoice, Withholding) when the
 * device is offline and their live content cannot be loaded.
 */
export function OfflinePlaceholder({ message }: OfflinePlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <CloudOff size={40} color={Colors.textSecondary} />
      </View>
      <Text style={styles.title}>You&apos;re offline</Text>
      <Text style={styles.message}>
        {message ?? 'This screen needs an internet connection. Reconnect to see the latest data.'}
      </Text>
      <Text style={styles.hint}>Cash sales still work offline from the Sell tab.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 10,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  message: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  hint: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

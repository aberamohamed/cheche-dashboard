import { Brand, Colors, Typography } from '@/constants/theme';
import { PackageOpen } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <PackageOpen size={40} color={Brand.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { ...Typography.title3, color: Colors.text, textAlign: 'center' },
  message: { ...Typography.subhead, color: Colors.textSecondary, textAlign: 'center' },
  button: { marginTop: 16, paddingHorizontal: 32 },
});

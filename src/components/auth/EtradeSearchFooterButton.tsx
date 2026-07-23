import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface EtradeSearchFooterButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function EtradeSearchFooterButton({
  onPress,
  loading = false,
  disabled = false,
}: EtradeSearchFooterButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel="Search"
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <>
          <Text style={styles.buttonText}>Search</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    ...Typography.subhead,
    color: Colors.white,
    fontWeight: '700',
  },
});

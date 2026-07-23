import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

interface OnboardingFabProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function OnboardingFab({
  title,
  onPress,
  loading = false,
  disabled = false,
  expanded = false,
  style,
}: OnboardingFabProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        expanded && styles.fabExpanded,
        (disabled || loading) && styles.fabDisabled,
        pressed && !disabled && !loading && styles.fabPressed,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.fabText}>{title}</Text>
          <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    ...Shadow.card,
  },
  fabExpanded: {
    flex: 1,
  },
  fabText: {
    ...Typography.subhead,
    color: Colors.white,
    fontWeight: '700',
  },
  fabDisabled: { opacity: 0.5 },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});

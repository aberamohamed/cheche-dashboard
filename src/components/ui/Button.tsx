import { Brand, Colors, Radius, Shadow, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = true,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'destructive' ? '#fff' : Brand.primary} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { ...Typography.headline },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: Brand.primary, ...Shadow.button },
  secondary: { backgroundColor: Brand.primaryMuted },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.dangerBg },
  destructive: { backgroundColor: Colors.danger },
});

const textStyles = StyleSheet.create({
  primary: { color: '#fff' },
  secondary: { color: Brand.primary },
  outline: { color: Colors.text },
  ghost: { color: Brand.primary },
  danger: { color: Colors.danger },
  destructive: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

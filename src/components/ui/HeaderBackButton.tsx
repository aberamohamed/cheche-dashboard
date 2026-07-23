import {
  SCREEN_HEADER_BACK_HIT_SLOP,
  SCREEN_HEADER_BACK_PRESS_RETENTION,
  SCREEN_HEADER_SIDE_SIZE,
} from '@/constants/screenHeader';
import { Brand, Colors, Radius } from '@/constants/theme';
import { ChevronLeft } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet } from 'react-native';

export type HeaderBackButtonVariant = 'light' | 'dark' | 'brand' | 'gradient';

type HeaderBackButtonProps = {
  onPress: () => void;
  variant?: HeaderBackButtonVariant;
  iconColor?: string;
  accessibilityLabel?: string;
};

export function HeaderBackButton({
  onPress,
  variant = 'light',
  iconColor,
  accessibilityLabel = 'Go back',
}: HeaderBackButtonProps) {
  const color =
    iconColor ??
    (variant === 'dark' || variant === 'gradient'
      ? Colors.white
      : variant === 'brand'
        ? Brand.primary
        : Colors.text);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={SCREEN_HEADER_BACK_HIT_SLOP}
      pressRetentionOffset={SCREEN_HEADER_BACK_PRESS_RETENTION}
      android_ripple={
        Platform.OS === 'android'
          ? {
              color:
                variant === 'dark' || variant === 'gradient'
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(0,0,0,0.08)',
              borderless: false,
              radius: SCREEN_HEADER_SIDE_SIZE / 2,
            }
          : undefined
      }
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, variantStyles[variant]]}
    >
      <ChevronLeft size={24} color={color} strokeWidth={2.5} />
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  light: {
    backgroundColor: Colors.borderLight,
  },
  dark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  gradient: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  brand: {
    backgroundColor: Brand.primaryMuted,
    borderRadius: 12,
  },
});

const styles = StyleSheet.create({
  base: {
    width: SCREEN_HEADER_SIDE_SIZE,
    height: SCREEN_HEADER_SIDE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { zIndex: 2, elevation: 2 },
      default: {},
    }),
  },
});

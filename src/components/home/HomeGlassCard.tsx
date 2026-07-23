import { Brand, Radius } from '@/constants/theme';
import { supportsLiquidGlassOnboarding } from '@/hooks/useLiquidGlassOnboarding';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export const HOME_GRADIENT_COLORS = Brand.primaryGradient;

type HomeGlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function HomeGlassCard({ children, style, contentStyle }: HomeGlassCardProps) {
  const useGlass = supportsLiquidGlassOnboarding();

  if (useGlass) {
    return (
      <LiquidGlassView style={[styles.shell, style]} effect="clear">
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LiquidGlassView>
    );
  }

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.shell, styles.androidShell, style]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.shell, styles.fallbackShell, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 36 : 48}
        tint="dark"
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      />
      <View style={styles.fallbackTint} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  fallbackShell: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  androidShell: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  fallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

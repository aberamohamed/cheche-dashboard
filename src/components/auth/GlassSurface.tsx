import { supportsLiquidGlassOnboarding } from '@/hooks/useLiquidGlassOnboarding';
import { Brand, Colors, Radius } from '@/constants/theme';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type GlassSurfaceProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
  interactive?: boolean;
};

export function GlassSurface({
  children,
  style,
  selected = false,
  interactive = false,
}: GlassSurfaceProps) {
  const useGlass = supportsLiquidGlassOnboarding();

  if (useGlass) {
    return (
      <LiquidGlassView
        style={[styles.glass, selected && styles.selected, style]}
        interactive={interactive}
        effect="clear"
      >
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <View style={[styles.fallback, selected && styles.selected, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 55 : 72}
        tint="light"
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  fallback: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  selected: {
    borderColor: Brand.primary,
    borderWidth: 1.5,
  },
});

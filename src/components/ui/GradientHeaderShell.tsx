import { Brand, Colors } from '@/constants/theme';
import { useDarkMode } from '@/hooks/useDarkMode';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HEADER_GRADIENT_COLORS = Brand.headerGradient;

type GradientHeaderShellProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GradientHeaderShell({ children, style }: GradientHeaderShellProps) {
  const darkMode = useDarkMode();

  if (!darkMode) {
    return (
      <SafeAreaView edges={['top']} style={[styles.lightSafe, style]}>
        <StatusBar style="dark" />
        {children}
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={[...HEADER_GRADIENT_COLORS]} style={[styles.gradient, style]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <StatusBar style="light" />
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    overflow: 'hidden',
  },
  safe: {
    backgroundColor: 'transparent',
  },
  lightSafe: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
});

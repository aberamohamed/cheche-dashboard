import { Colors, Typography } from '@/constants/theme';
import { Image, StyleSheet, Text, View } from 'react-native';

type LogoVariant = 'auth' | 'header';

interface LogoProps {
  variant?: LogoVariant;
}

export function Logo({ variant = 'auth' }: LogoProps) {
  if (variant === 'header') {
    return (
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.authLogo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Cheche POS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  authLogo: { width: 160, height: 48, borderRadius: 10 },
  headerLogo: { width: 100, height: 32 },
  title: { ...Typography.title2, color: Colors.text, marginTop: 4 },
});

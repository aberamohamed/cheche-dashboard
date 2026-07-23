import { AuthBrandMark } from '@/constants/authTheme';
import { Brand, Colors, Typography } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChechePosLogo = require('../../../assets/images/cheche_pos.png');

type AuthScreenShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.whiteBackground} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -40 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={AuthBrandMark} style={styles.brandMark} resizeMode="contain" accessibilityLabel="Cheche" />
            <Image
              source={ChechePosLogo}
              style={styles.chechePosLogo}
              resizeMode="contain"
              accessibilityLabel="Cheche POS"
            />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  onPress,
}: {
  text: string;
  linkText: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{text}</Text>
      <Text style={styles.footerLink} onPress={onPress}>
        {linkText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  whiteBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
    paddingTop: 40,
  },
  brandMark: {
    width: 88,
    height: 88,
    // marginBottom: 14,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  chechePosLogo: {
    width: 200,
    height: 60,
  },
  title: {
    ...Typography.title1,
    color: Colors.text,
    textAlign: 'left',
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.subhead,
    color: Brand.primary,
    textAlign: 'left',
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  footer: {
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footerLink: {
    ...Typography.subhead,
    color: Brand.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

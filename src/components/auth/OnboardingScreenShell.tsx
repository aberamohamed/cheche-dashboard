import { OnboardingStepIndicator } from '@/components/auth/OnboardingStepIndicator';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import {
  SCREEN_HEADER_BACK_HIT_SLOP,
  SCREEN_HEADER_BACK_PRESS_RETENTION,
  SCREEN_HEADER_PADDING_TOP,
  SCREEN_HEADER_SIDE_SIZE,
} from '@/constants/screenHeader';
import { supportsLiquidGlassOnboarding } from '@/hooks/useLiquidGlassOnboarding';
import { Brand, Colors, Radius, Typography } from '@/constants/theme';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_FOOTER_RESERVED_SPACE = 88;
const ANDROID_KEYBOARD_SCROLL_DELAY_MS = 80;

type OnboardingScreenShellProps = {
  step?: 1 | 2 | 3;
  totalSteps?: number;
  headerTitle: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  pinnedAboveScroll?: React.ReactNode;
  footerReservedSpace?: number;
  backgroundColor?: string;
  introVariant?: 'plain' | 'card';
  introIcon?: React.ReactNode;
  accentStepLabel?: boolean;
  backButtonVariant?: 'default' | 'brand';
  hideFooterBorder?: boolean;
  onBack: () => void;
};

function BackButton({
  onPress,
  variant = 'default',
}: {
  onPress: () => void;
  variant?: 'default' | 'brand';
}) {
  const useGlass = supportsLiquidGlassOnboarding() && variant === 'default';

  if (variant === 'brand') {
    return <HeaderBackButton onPress={onPress} variant="brand" />;
  }

  if (useGlass) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={SCREEN_HEADER_BACK_HIT_SLOP}
        pressRetentionOffset={SCREEN_HEADER_BACK_PRESS_RETENTION}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <LiquidGlassView style={styles.backGlass} interactive effect="clear">
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2.5} />
        </LiquidGlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={SCREEN_HEADER_BACK_HIT_SLOP}
      pressRetentionOffset={SCREEN_HEADER_BACK_PRESS_RETENTION}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <View style={styles.backFallback}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 60}
          tint="light"
          style={StyleSheet.absoluteFill}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        />
        <ChevronLeft size={24} color={Colors.text} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

export function OnboardingScreenShell({
  step,
  totalSteps = 3,
  headerTitle,
  title,
  subtitle,
  children,
  footer,
  pinnedAboveScroll,
  footerReservedSpace = DEFAULT_FOOTER_RESERVED_SPACE,
  backgroundColor = Colors.white,
  introVariant = 'plain',
  introIcon,
  accentStepLabel = false,
  backButtonVariant = 'default',
  hideFooterBorder = false,
  onBack,
}: OnboardingScreenShellProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [footerHeight, setFooterHeight] = useState(
    footer ? Math.max(footerReservedSpace, DEFAULT_FOOTER_RESERVED_SPACE) : 0
  );

  const scrollBottomPadding = footer
    ? footerHeight + 8
    : 24 + Math.max(insets.bottom, 16);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, ANDROID_KEYBOARD_SCROLL_DELAY_MS);
    });

    return () => {
      showSub.remove();
    };
  }, []);

  const body = (
    <View style={[styles.body, { backgroundColor }]}>
      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, { backgroundColor }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
      >
        {introVariant === 'card' ? (
          <View style={styles.introCard}>
            {introIcon ? <View style={styles.introIconWrap}>{introIcon}</View> : null}
            <View style={styles.introCardText}>
              <Text style={styles.introCardTitle}>{title}</Text>
              <Text style={styles.introCardSubtitle}>{subtitle}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.intro}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        )}
        {children}
      </ScrollView>

      {footer ? (
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && nextHeight !== footerHeight) {
              setFooterHeight(nextHeight);
            }
          }}
          style={[
            styles.footerBar,
            hideFooterBorder && styles.footerBarBorderless,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton onPress={onBack} variant={backButtonVariant} />
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {step != null ? (
        <View style={styles.progressWrap}>
          <OnboardingStepIndicator
            step={step}
            totalSteps={totalSteps}
            accentStepLabel={accentStepLabel}
          />
        </View>
      ) : null}

      {pinnedAboveScroll ? (
        <View style={styles.pinned}>{pinnedAboveScroll}</View>
      ) : null}

      {Platform.OS === 'android' ? (
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior="padding">
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  body: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: SCREEN_HEADER_PADDING_TOP,
    paddingBottom: 8,
    gap: 10,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: { width: SCREEN_HEADER_SIDE_SIZE, height: SCREEN_HEADER_SIDE_SIZE },
  backGlass: {
    width: SCREEN_HEADER_SIDE_SIZE,
    height: SCREEN_HEADER_SIDE_SIZE,
    borderRadius: SCREEN_HEADER_SIDE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backFallback: {
    width: SCREEN_HEADER_SIDE_SIZE,
    height: SCREEN_HEADER_SIDE_SIZE,
    borderRadius: SCREEN_HEADER_SIDE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  progressWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  pinned: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  intro: { gap: 8, marginBottom: 4, alignItems: 'center' },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primaryMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227, 0, 116, 0.12)',
    marginBottom: 2,
  },
  introIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(227, 0, 116, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  introCardText: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  introCardTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  introCardSubtitle: {
    ...Typography.subhead,
    color: Brand.primary,
    lineHeight: 21,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.subhead,
    color: Brand.primary,
    lineHeight: 21,
    textAlign: 'center',
  },
  footerBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  footerBarBorderless: {
    borderTopWidth: 0,
    paddingTop: 8,
  },
});

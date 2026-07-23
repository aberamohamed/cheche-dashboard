import { PinNumpadKey } from '@/components/auth/PinNumpadKey';
import { Brand, Typography } from '@/constants/theme';
import { LiquidGlassContainerView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export const PIN_LENGTH = 6;

type PinLockViewProps = {
  greeting?: string;
  title?: string;
  avatarUri?: string | null;
  isSubmitting?: boolean;
  onPinComplete: (pin: string) => void;
  onForgotPassword?: () => void;
  onSwitchUser?: () => void;
};

export function PinLockView({
  greeting = 'Welcome back',
  title = 'Enter your PIN',
  avatarUri,
  isSubmitting = false,
  onPinComplete,
  onForgotPassword,
  onSwitchUser,
}: PinLockViewProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [pin, setPin] = useState('');
  const loadingAnims = useRef(
    Array.from({ length: PIN_LENGTH }, () => new Animated.Value(0))
  ).current;

  const isCompactHeight = height < 760;
  const isVeryCompactHeight = height < 700;

  const keySize = useMemo(() => {
    if (isVeryCompactHeight) return Math.max(54, Math.min(60, width * 0.15));
    if (isCompactHeight) return Math.max(58, Math.min(66, width * 0.16));
    return Math.max(62, Math.min(72, width * 0.17));
  }, [isCompactHeight, isVeryCompactHeight, width]);

  const keyMarginVertical = useMemo(() => {
    if (isVeryCompactHeight) return 5;
    if (isCompactHeight) return 6;
    return 7;
  }, [isCompactHeight, isVeryCompactHeight]);

  const keyMarginHorizontal = useMemo(() => {
    if (isVeryCompactHeight) return 10;
    if (isCompactHeight) return 12;
    return 12;
  }, [isCompactHeight, isVeryCompactHeight]);

  const pinDotSize = useMemo(() => {
    if (isVeryCompactHeight) return 13;
    if (isCompactHeight) return 15;
    return 17;
  }, [isCompactHeight, isVeryCompactHeight]);

  const pinDotMargin = useMemo(() => {
    if (isVeryCompactHeight) return 4;
    if (isCompactHeight) return 5;
    return 6;
  }, [isCompactHeight, isVeryCompactHeight]);

  const avatarSize = useMemo(() => {
    if (isVeryCompactHeight) return 88;
    if (isCompactHeight) return 98;
    return 110;
  }, [isCompactHeight, isVeryCompactHeight]);

  const numpadMaxWidth = keySize * 3 + keyMarginHorizontal * 6 + 4;

  const bottomSpace =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, 20)
      : insets.bottom > 0
        ? insets.bottom + 20
        : 20;

  const numpadKeys = useMemo(
    () => [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'backspace'] as const,
    []
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onSwitchUser?.();
      return true;
    });
    return () => sub.remove();
  }, [onSwitchUser]);

  useEffect(() => {
    if (isSubmitting) {
      const loop = Animated.loop(
        Animated.stagger(
          100,
          loadingAnims.map((anim) =>
            Animated.sequence([
              Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ])
          )
        )
      );
      loop.start();
      return () => {
        loop.stop();
        loadingAnims.forEach((anim) => anim.setValue(0));
      };
    }
    loadingAnims.forEach((anim) => anim.setValue(0));
    return undefined;
  }, [isSubmitting, loadingAnims]);

  useEffect(() => {
    if (pin.length === PIN_LENGTH && !isSubmitting) {
      onPinComplete(pin);
    }
  }, [pin, isSubmitting, onPinComplete]);

  const handleNumberPress = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH || isSubmitting) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin((prev) => prev + digit);
    },
    [isSubmitting, pin.length]
  );

  const handleBackspace = useCallback(() => {
    if (isSubmitting || pin.length === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin((prev) => prev.slice(0, -1));
  }, [isSubmitting, pin.length]);

  const handleKeyPress = (item: (typeof numpadKeys)[number]) => {
    if (isSubmitting || item === '') return;
    if (typeof item === 'number') handleNumberPress(String(item));
    else if (item === 'backspace') handleBackspace();
  };

  const useLiquidGlassNumpad = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

  const renderNumpadKey = (item: (typeof numpadKeys)[number], index: number) => (
    <PinNumpadKey
      key={item === '' ? `empty-${index}` : String(item)}
      item={item}
      isSubmitting={isSubmitting}
      keySize={keySize}
      keyMarginHorizontal={keyMarginHorizontal}
      keyMarginVertical={keyMarginVertical}
      onPress={() => handleKeyPress(item)}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          {onSwitchUser ? (
            <Pressable onPress={onSwitchUser} style={styles.switchUserButtonSquare}>
              <View style={styles.switchUserButtonInnerSquare}>
                <Ionicons name="swap-horizontal" size={18} color={Brand.primary} />
              </View>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <View style={styles.container}>
          <View style={styles.topSection}>
            <Text style={[styles.greetingText, { fontSize: isVeryCompactHeight ? 13 : isCompactHeight ? 15 : 17 }]}>
              {greeting}
            </Text>

            <LinearGradient
              colors={[Brand.primary, '#9D174D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.avatarRing,
                {
                  width: avatarSize + 5,
                  height: avatarSize + 5,
                  borderRadius: (avatarSize + 10) / 2,
                },
              ]}
            >
              <View
                style={[
                  styles.avatarFrame,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  },
                ]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={avatarSize * 0.42} color={Brand.primary} />
                  </View>
                )}
              </View>
            </LinearGradient>

            <Text style={[styles.pinHeading, { fontSize: isVeryCompactHeight ? 15 : 17 }]}>{title}</Text>

            <View style={styles.pinDigitsRow}>
              {Array.from({ length: PIN_LENGTH }, (_, index) => {
                const isFilled = pin.length > index;
                const loadingScale = loadingAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.4],
                });
                const loadingOpacity = loadingAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.pinDigitContainer,
                      {
                        width: pinDotSize,
                        height: pinDotSize,
                        borderRadius: pinDotSize / 2,
                        marginHorizontal: Math.min(pinDotMargin, 6),
                        borderColor: isSubmitting
                          ? 'transparent'
                          : isFilled
                            ? Brand.primary
                            : 'rgba(0,0,0,0.2)',
                        borderWidth: isSubmitting ? 0 : 2,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        opacity: isSubmitting ? loadingOpacity : 1,
                      },
                    ]}
                  >
                    {isFilled && !isSubmitting ? (
                      <View
                        style={[
                          styles.pinDot,
                          {
                            backgroundColor: Brand.primary,
                            borderRadius: pinDotSize / 2,
                          },
                        ]}
                      />
                    ) : null}
                    {isSubmitting ? (
                      <Animated.View
                        style={[
                          styles.pinDot,
                          styles.loadingPinDot,
                          {
                            backgroundColor: Brand.primary,
                            borderRadius: pinDotSize / 2,
                            transform: [{ scale: loadingScale }],
                          },
                        ]}
                      />
                    ) : null}
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <View style={[styles.bottomSection, { paddingBottom: bottomSpace }]}>
            <View style={[styles.numpadContainer, { maxWidth: numpadMaxWidth }]}>
              {useLiquidGlassNumpad ? (
                <LiquidGlassContainerView
                  style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                  {numpadKeys.map(renderNumpadKey)}
                </LiquidGlassContainerView>
              ) : (
                numpadKeys.map(renderNumpadKey)
              )}
            </View>

            {onForgotPassword ? (
              <Pressable onPress={onForgotPassword} style={styles.forgotPinContainer}>
                <Text style={styles.forgotPinText}>Forgot Password?</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    minHeight: 44,
  },
  headerSpacer: { width: 30 },
  switchUserButtonSquare: {
    width: 30,
    height: 30,
    borderRadius: 24,
    backgroundColor: '#F7F8FB',
    borderWidth: 1.2,
    borderColor: 'rgba(220, 226, 236, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#B6C5D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
    }),
  },
  switchUserButtonInnerSquare: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
  },
  greetingText: {
    color: '#B7A7B4',
    fontWeight: '400',
    marginBottom: 10,
    textAlign: 'center',
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    marginBottom: 0,
  },
  avatarFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHeading: {
    color: '#121212',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  pinDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDigitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pinDot: {
    width: '100%',
    height: '100%',
  },
  loadingPinDot: {
    backgroundColor: Brand.primary,
  },
  numpadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 4,
  },
  forgotPinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  forgotPinText: {
    ...Typography.subhead,
    fontSize: 14,
    fontWeight: '400',
    color: Brand.primary,
  },
});

import { PromoSlider } from '@/components/auth/PromoSlider';
import { Brand, Typography } from '@/constants/theme';
import {
  GETTING_STARTED_METHODS,
  GETTING_STARTED_SLIDES,
  type GettingStartedMethod,
} from '@/data/gettingStarted';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { ChevronLeft, ChevronRight, PenLine } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ETRADE_LOGO = require('@/assets/images/eTrade.png');

function MethodIcon({ method }: { method: GettingStartedMethod }) {
  if (method.icon === 'etrade') {
    return <Image source={ETRADE_LOGO} style={styles.etradeLogo} resizeMode="contain" />;
  }
  return <PenLine size={22} color={Brand.primary} />;
}

export default function GettingStartedScreen() {
  const insets = useSafeAreaInsets();
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = GETTING_STARTED_SLIDES;
  const isLastSlide = activeSlide === slides.length - 1;
  const bottomInset = Math.max(insets.bottom, 12);

  const sheetBlurIntensity = Platform.OS === 'ios' ? 90 : 85;
  const rowBlurIntensity = Platform.OS === 'ios' ? 55 : 60;
  const androidSheetBlurMethod = Platform.OS === 'android' ? ('dimezisBlurView' as const) : undefined;

  const handleNext = () => {
    if (activeSlide < slides.length - 1) setActiveSlide(activeSlide + 1);
  };

  const handleBack = () => {
    if (activeSlide > 0) setActiveSlide(activeSlide - 1);
  };

  const handleMethodPress = (method: GettingStartedMethod) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (method.action === 'navigate' && method.target) {
      if (method.id === 'etrade') {
        router.push({
          pathname: '/(auth)/register-plan',
          params: { source: 'etrade' },
        });
        return;
      }
      router.push(method.target as Href);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.backgroundLayer} pointerEvents="none">
        <PromoSlider
          slides={slides}
          fullScreen
          activeSlideIndex={activeSlide}
          onSlideChange={setActiveSlide}
        />
        <LinearGradient
          colors={
            isLastSlide
              ? ['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.48)', 'rgba(0,0,0,0.78)']
              : ['transparent', 'rgba(0,0,0,0.13)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']
          }
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {!isLastSlide ? (
        <Animated.View entering={FadeIn.delay(500)} style={[styles.topBar, { top: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => setActiveSlide(slides.length - 1)} style={styles.skipButton}>
            <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <View style={styles.mainOverlay} pointerEvents="box-none">
        {isLastSlide ? (
          <Animated.View
            entering={FadeInUp.duration(600)}
            exiting={FadeOut.duration(400)}
            style={[styles.blurPanelContainer, styles.lastSlidePanelContainer]}
            pointerEvents="box-none"
          >
            <BlurView
              intensity={sheetBlurIntensity}
              tint="dark"
              experimentalBlurMethod={androidSheetBlurMethod}
              style={styles.blurPanel}
              pointerEvents="box-none"
            >
              <View style={styles.panelContent}>
                <View style={[styles.dragHandle, styles.lastSlideDragHandle]} />

                <Animated.View entering={FadeInDown.duration(420)} style={styles.sheetHeader}>
                  <Text style={[styles.titleText, styles.lastSlideTitleShadow]}>Get Started</Text>
                  <Text style={[styles.subtitle, styles.lastSlideSubtitleShadow]}>
                    Set up your Cheche POS business account
                  </Text>
                </Animated.View>

                <View style={styles.methodList}>
                  {GETTING_STARTED_METHODS.map((method, index) => {
                    const isPrimary = index === 0;
                    return (
                      <Animated.View
                        key={method.id}
                        entering={FadeInUp.delay(140 + index * 75).duration(480)}
                        style={styles.methodCardWrap}
                      >
                        <Pressable
                          onPress={() => handleMethodPress(method)}
                          accessibilityRole="button"
                          accessibilityLabel={method.label}
                          style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
                        >
                          <View
                            style={[
                              isPrimary ? styles.methodCardPrimaryShell : styles.methodCardSecondaryShell,
                              isPrimary && { borderColor: Brand.primary },
                            ]}
                          >
                            <BlurView
                              intensity={rowBlurIntensity}
                              tint="dark"
                              experimentalBlurMethod={androidSheetBlurMethod}
                              style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.methodCardRow}>
                              <View
                                style={[
                                  isPrimary
                                    ? styles.methodIconCirclePrimary
                                    : [styles.methodIconCircleSecondary, { backgroundColor: `${Brand.primary}2E` }],
                                  method.icon === 'etrade' && styles.methodIconCircleEtrade,
                                ]}
                              >
                                <MethodIcon method={method} />
                              </View>
                              <View style={styles.methodTextBlock}>
                                <Text style={isPrimary ? styles.methodTitlePrimary : styles.methodTitleSecondary}>
                                  {method.label}
                                </Text>
                                <Text
                                  style={isPrimary ? styles.methodHintPrimary : styles.methodHintSecondary}
                                  numberOfLines={2}
                                >
                                  {method.hint}
                                </Text>
                              </View>
                              <ChevronRight
                                size={isPrimary ? 22 : 20}
                                color={isPrimary ? 'rgba(255,255,255,0.9)' : 'rgba(226,232,240,0.55)'}
                              />
                            </View>
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>

                <Animated.View
                  entering={FadeIn.delay(380)}
                  style={[styles.loginFooter, { paddingBottom: bottomInset }]}
                >
                  <View style={styles.loginLinkContainer}>
                    <Text style={[styles.loginText, styles.lastSlideFooterShadow]}>
                      Already have an account?{' '}
                    </Text>
                    <Text
                      style={[styles.loginLink, styles.lastSlideFooterShadow]}
                      onPress={() => router.replace('/(auth)/login')}
                    >
                      Log in
                    </Text>
                  </View>
                </Animated.View>
              </View>
            </BlurView>
          </Animated.View>
        ) : (
          <View style={styles.floatingContentContainer} pointerEvents="box-none">
            <View style={styles.floatingTextWrapper} pointerEvents="none">
              <Animated.View key={`title-${activeSlide}`} entering={FadeInUp} exiting={FadeOut}>
                <Text style={styles.floatingTitle}>{slides[activeSlide].title}</Text>
              </Animated.View>
              <Animated.View key={`desc-${activeSlide}`} entering={FadeInUp.delay(100)} exiting={FadeOut}>
                <Text style={styles.floatingSubtitle}>{slides[activeSlide].description}</Text>
              </Animated.View>
            </View>

            <View style={[styles.navRowWithDots, { paddingBottom: bottomInset }]}>
              <View style={styles.navButtonWrapper}>
                {activeSlide > 0 ? (
                  <TouchableOpacity onPress={handleBack} style={styles.glassFab}>
                    <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                    <ChevronLeft size={28} color="#fff" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.paginationRowFloating}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === activeSlide ? Brand.primary : 'rgba(255,255,255,0.3)',
                        width: i === activeSlide ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.navButtonWrapper}>
                <TouchableOpacity onPress={handleNext} style={styles.glassFab}>
                  <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                  <ChevronRight size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  mainOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    justifyContent: 'flex-end',
  },
  topBar: { position: 'absolute', right: 24, zIndex: 10 },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipText: { color: '#fff', ...Typography.subhead, fontWeight: '700' },
  floatingContentContainer: { paddingHorizontal: 24, width: '100%' },
  floatingTextWrapper: { alignItems: 'center', marginBottom: 24 },
  floatingTitle: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 32,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  floatingSubtitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  paginationRowFloating: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navRowWithDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  navButtonWrapper: { width: 56, height: 56 },
  glassFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurPanelContainer: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  blurPanel: { width: '100%' },
  panelContent: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' },
  sheetHeader: { width: '100%', alignItems: 'center', marginBottom: 6 },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 20,
  },
  titleText: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 30,
    letterSpacing: -0.6,
    color: '#f8fafc',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.92,
    marginTop: 8,
    marginBottom: 20,
    maxWidth: 340,
    paddingHorizontal: 8,
    fontWeight: '600',
    color: 'rgba(248, 250, 252, 0.72)',
  },
  methodList: { width: '100%', gap: 12 },
  methodCardWrap: { width: '100%' },
  methodCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 78,
    width: '100%',
  },
  methodCardPrimaryShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 0.5,
    width: '100%',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  methodCardSecondaryShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    width: '100%',
  },
  methodIconCirclePrimary: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconCircleEtrade: {
    backgroundColor: '#fff',
    padding: 4,
  },
  etradeLogo: {
    width: 40,
    height: 28,
  },
  methodIconCircleSecondary: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextBlock: { flex: 1, minWidth: 0, marginRight: 4 },
  methodTitlePrimary: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  methodHintPrimary: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  methodTitleSecondary: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.15,
  },
  methodHintSecondary: {
    color: 'rgba(226, 232, 240, 0.62)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  loginFooter: { marginTop: 22, width: '100%', alignItems: 'center', paddingTop: 4 },
  loginText: { fontWeight: '500', color: 'rgba(226, 232, 240, 0.55)', fontSize: 14 },
  loginLink: { color: Brand.primary, fontWeight: '700', fontSize: 15 },
  loginLinkContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
  lastSlideTitleShadow: {
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  lastSlideSubtitleShadow: {
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  lastSlideFooterShadow: {
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  lastSlidePanelContainer: {
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -14 },
    elevation: 24,
  },
  lastSlideDragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
});

import { GuestRestrictedPlaceholder } from '@/components/auth/GuestRestrictedPlaceholder';
import { DashboardAnalyticsContent } from '@/components/dashboard/DashboardAnalyticsContent';
import { OfflinePlaceholder } from '@/components/ui/OfflinePlaceholder';
import { HOME_GRADIENT_COLORS } from '@/components/home/HomeGlassCard';
import { HomeHeroCard } from '@/components/home/HomeHeroCard';
import { HomeOverlayHeader } from '@/components/home/HomeOverlayHeader';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useGuestRegistrationGate } from '@/hooks/useGuestRegistrationGate';
import { useLowStockProducts } from '@/hooks/useProducts';
import { useTabScreenPaddingBottom } from '@/hooks/useTabScreenPaddingBottom';
import { useAuthStore } from '@/store/authStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useSettingsStore } from '@/store/settingsStore';
import { hasSeenGuestHomePrompt, markGuestHomePromptSeen } from '@/utils/guestSession';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Brand, Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const language = useSettingsStore((s) => s.language);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const user = useAuthStore((s) => s.user);
  const business = useAuthStore((s) => s.business);
  const userId = user?.id;
  const tabPaddingBottom = useTabScreenPaddingBottom();
  const darkMode = useDarkMode();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const { data: lowStock = [] } = useLowStockProducts();
  const [filterOpen, setFilterOpen] = useState(false);
  const {
    isGuest,
    showPrompt,
    modal: guestRegistrationModal,
    navigateToRegistration,
  } = useGuestRegistrationGate();

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useFocusEffect(
    useCallback(() => {
      if (!userId || !isGuest) return;
      let active = true;

      void (async () => {
        const seen = await hasSeenGuestHomePrompt(userId);
        if (!active || seen) return;
        showPrompt();
        await markGuestHomePromptSeen(userId);
      })();

      return () => {
        active = false;
      };
    }, [isGuest, showPrompt, userId])
  );

  const homeHeader = (
    <>
      <HomeHeroCard
        glass={darkMode}
        fullName={user?.fullName ?? 'User'}
        email={user?.email}
        phone={user?.phone}
        profilePhoto={user?.profilePhoto}
        businessName={business?.name}
      />
      <HomeOverlayHeader
        glass={darkMode}
        language={language}
        onLanguageSelect={setLanguage}
        lowStockCount={lowStock.length}
        onNotificationPress={() => router.push('/low-stock-alerts' as Href)}
      />
    </>
  );

  const screenBody = (
    <>
      {guestRegistrationModal}

      {darkMode ? (
        <View style={styles.headerContainer}>{homeHeader}</View>
      ) : (
        <LinearGradient
          colors={[...Brand.homeHeaderGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.35 }}
          style={styles.headerContainer}
        >
          {homeHeader}
        </LinearGradient>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {!isOnline ? (
          <View style={styles.guestAnalyticsWrap}>
            <OfflinePlaceholder message="Your dashboard needs an internet connection to load." />
          </View>
        ) : isGuest ? (
          <View style={styles.guestAnalyticsWrap}>
            <GuestRestrictedPlaceholder onCompleteRegistration={navigateToRegistration} />
          </View>
        ) : (
          <DashboardAnalyticsContent
            compact
            glass={darkMode}
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
          />
        )}
      </ScrollView>
    </>
  );

  if (darkMode) {
    return (
      <LinearGradient colors={[...HOME_GRADIENT_COLORS]} style={styles.screen}>
        <StatusBar style="light" />
        {screenBody}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.screen, styles.screenLight]}>
      <StatusBar style="light" />
      {screenBody}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenLight: {
    backgroundColor: Colors.white,
  },
  headerContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 10,
    gap: 14,
  },
  guestAnalyticsWrap: {
    minHeight: 280,
    paddingHorizontal: 20,
  },
});

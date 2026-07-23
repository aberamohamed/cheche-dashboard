import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard';
import { ProfileMenuItem, type ProfileMenuTileColors } from '@/components/profile/ProfileMenuItem';
import { LanguagePickerModal } from '@/components/settings/LanguagePickerModal';
import { Button } from '@/components/ui/Button';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { Brand, Colors, Typography } from '@/constants/theme';
import { getLanguageLabel } from '@/data/languages';
import { getMoreStrings } from '@/i18n/more';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useLowStockProducts } from '@/hooks/useProducts';
import { useTabScreenPaddingBottom } from '@/hooks/useTabScreenPaddingBottom';
import { useAuthStore } from '@/store/authStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useOfflineProductsStore } from '@/store/offlineProductsStore';
import { usePendingSalesStore } from '@/store/pendingSalesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { appAlert } from '@/utils/alert';
import { getFreshGpsDate } from '@/utils/gpsTime';
import { format } from 'date-fns';
import { waitForModalTransition, withLoading, withLoadingAfterDismiss } from '@/utils/withLoading';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

type MenuAction = 'language';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: Href;
  action?: MenuAction;
  colors: ProfileMenuTileColors;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const MENU_TILE_COLORS = {
  businessProfile: { bg: '#FFF7ED', border: '#FDBA74', icon: '#C2410C' },
  items: { bg: '#EFF6FF', border: '#BFDBFE', icon: '#1D4ED8' },
  stockReport: { bg: '#F0FDF4', border: '#BBF7D0', icon: '#15803D' },
  customers: { bg: '#ECFDF5', border: '#A7F3D0', icon: '#047857' },
  orders: { bg: '#FDF2F8', border: '#FBCFE8', icon: '#BE185D' },
  invoices: { bg: '#EFF6FF', border: '#BFDBFE', icon: '#1D4ED8' },
  receipts: { bg: '#FFF7ED', border: '#FED7AA', icon: '#C2410C' },
  returns: { bg: '#FFF1F2', border: '#FECDD3', icon: '#E11D48' },
  withholding: { bg: '#ECFDF5', border: '#A7F3D0', icon: '#047857' },
  coupons: { bg: '#FDF2F8', border: '#FBCFE8', icon: '#BE185D' },
  giftCards: { bg: '#F5F3FF', border: '#DDD6FE', icon: '#5B21B6' },
  promotions: { bg: '#FFF7ED', border: '#FED7AA', icon: '#C2410C' },
  permissions: { bg: '#EFF6FF', border: '#BFDBFE', icon: '#1D4ED8' },
  changePassword: { bg: '#F3F4F6', border: '#E5E7EB', icon: '#374151' },
  language: { bg: '#ECFEFF', border: '#A5F3FC', icon: '#0E7490' },
  darkMode: { bg: '#F5F3FF', border: '#DDD6FE', icon: '#5B21B6' },
  about: { bg: '#EEF2FF', border: '#C7D2FE', icon: '#4338CA' },
  contact: { bg: '#ECFDF5', border: '#A7F3D0', icon: '#047857' },
  bluetoothPrinter: { bg: '#EFF6FF', border: '#93C5FD', icon: '#1E40AF' },
} as const satisfies Record<string, ProfileMenuTileColors>;

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Business',
    items: [
      {
        icon: 'business-outline',
        label: 'Business Profile',
        route: '/business-profile' as Href,
        colors: MENU_TILE_COLORS.businessProfile,
      },
      {
        icon: 'cube-outline',
        label: 'Manage Inventory',
        route: '/products' as Href,
        colors: MENU_TILE_COLORS.items,
      },
      {
        icon: 'bar-chart-outline',
        label: 'Stock Report',
        route: '/stock-report' as Href,
        colors: MENU_TILE_COLORS.stockReport,
      },
      {
        icon: 'people-outline',
        label: 'Customers',
        route: '/customers' as Href,
        colors: MENU_TILE_COLORS.customers,
      },
    ],
  },
  {
    title: 'Purchase',
    items: [
      {
        icon: 'bag-handle-outline',
        label: 'Purchase Orders',
        route: '/orders' as Href,
        colors: MENU_TILE_COLORS.orders,
      },
      {
        icon: 'document-text-outline',
        label: 'Purchase Invoices',
        route: '/purchase-invoices' as Href,
        colors: MENU_TILE_COLORS.invoices,
      },
      {
        icon: 'receipt-outline',
        label: 'Purchase Receipts',
        route: '/purchase-receipts' as Href,
        colors: MENU_TILE_COLORS.receipts,
      },
      {
        icon: 'refresh-outline',
        label: 'Purchase Returns',
        route: '/purchase-returns' as Href,
        colors: MENU_TILE_COLORS.returns,
      },
      {
        icon: 'shield-checkmark-outline',
        label: 'Purchase Withholding',
        route: '/withholding-all' as Href,
        colors: MENU_TILE_COLORS.withholding,
      },
    ],
  },
  {
    title: 'Promotions',
    items: [
      {
        icon: 'pricetag-outline',
        label: 'Coupons',
        route: '/coupons' as Href,
        colors: MENU_TILE_COLORS.coupons,
      },
      {
        icon: 'layers-outline',
        label: 'Promotions',
        route: '/promotions' as Href,
        colors: MENU_TILE_COLORS.promotions,
      },
      {
        icon: 'gift-outline',
        label: 'Gift Cards',
        route: '/gift-cards' as Href,
        colors: MENU_TILE_COLORS.giftCards,
      },
    ],
  },
  {
    title: 'Security',
    items: [
      {
        icon: 'shield-outline',
        label: 'Permissions',
        route: '/permissions' as Href,
        colors: MENU_TILE_COLORS.permissions,
      },
      {
        icon: 'key-outline',
        label: 'Change Password',
        route: '/change-password' as Href,
        colors: MENU_TILE_COLORS.changePassword,
      },
    ],
  },
  {
    title: 'General',
    items: [
      {
        icon: 'bluetooth-outline',
        label: 'Bluetooth Printer',
        route: '/bluetooth-printer' as Href,
        colors: MENU_TILE_COLORS.bluetoothPrinter,
      },
      // {
      //   icon: 'globe-outline',
      //   label: 'Language',
      //   action: 'language',
      //   colors: MENU_TILE_COLORS.language,
      // },
      {
        icon: 'information-circle-outline',
        label: 'About Us',
        route: '/about' as Href,
        colors: MENU_TILE_COLORS.about,
      },
      {
        icon: 'chatbubble-ellipses-outline',
        label: 'Contact Us',
        route: '/contact-us' as Href,
        colors: MENU_TILE_COLORS.contact,
      },
    ],
  },
];

function resolveAvatarUri(profilePhoto?: string): string | null {
  if (!profilePhoto) return null;
  if (/^https?:\/\//i.test(profilePhoto)) return profilePhoto;
  return null;
}

export default function MoreScreen() {
  const { user, logout } = useAuthStore();
  const { data: lowStock = [] } = useLowStockProducts();
  const tabPaddingBottom = useTabScreenPaddingBottom();
  const language = useSettingsStore((s) => s.language);
  const strings = getMoreStrings(language);
  const darkMode = useDarkMode();
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const offlineModeEnabled = useSettingsStore((s) => s.offlineModeEnabled);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const unsyncedCount = usePendingSalesStore((s) => s.unsyncedCount);
  const refreshUnsyncedCount = usePendingSalesStore((s) => s.refreshCount);
  const offlineItemCount = useOfflineProductsStore((s) => s.ids.length);
  const refreshOfflineProducts = useOfflineProductsStore((s) => s.refresh);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    hydrateSettings();
    void refreshUnsyncedCount();
    void refreshOfflineProducts();
  }, [hydrateSettings, refreshUnsyncedCount, refreshOfflineProducts]);

  const handleLogout = () => {
    appAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void withLoadingAfterDismiss(async () => {
            await logout();
            router.replace('/(auth)/login');
            await waitForModalTransition();
          }, 'Logging out...');
        },
      },
    ], { variant: 'warning' });
  };

  // Enabling Work Offline requires: (1) an active connection, so the offline
  // catalog/taxes/cash method can be cached, and (2) a device clock that matches
  // fresh GPS satellite time, since offline receipts are stamped with GPS time.
  const handleOfflineModeToggle = async (value: boolean) => {
    if (!value) {
      appAlert(
        'Turn Off Offline Mode?',
        'You will no longer be able to complete cash sales without an internet connection. ' +
          'Any sales already queued will still sync automatically when online.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Turn Off',
            style: 'destructive',
            onPress: () => void updateSetting('offlineModeEnabled', false),
          },
        ],
        { variant: 'warning' }
      );
      return;
    }

    if (!isOnline) {
      appAlert(
        'Internet Connection Required',
        'Work Offline can only be turned on while you are connected to the internet. ' +
          'Connect to Wi-Fi or mobile data first so the app can prepare your offline catalog, then try again.',
        undefined,
        { variant: 'error' }
      );
      return;
    }

    let gpsDate: Date | null = null;
    await withLoading(async () => {
      gpsDate = await getFreshGpsDate();
    }, 'Checking GPS time...');
    const deviceDate = new Date();

    if (!gpsDate) {
      await waitForModalTransition();
      appAlert(
        'GPS Time Unavailable',
        'We could not get a GPS time fix to verify your device clock. ' +
          'Offline sales are timestamped with GPS time, so this check is required. ' +
          'Make sure Location Services are enabled and location permission is granted, then try again (moving near a window or outdoors helps).',
        undefined,
        { variant: 'error' }
      );
      return;
    }

    const TIME_FORMAT = 'MMM d, yyyy h:mm:ss a';
    const diffMs = Math.abs(deviceDate.getTime() - (gpsDate as Date).getTime());
    const MAX_CLOCK_DRIFT_MS = 2 * 60 * 1000;
    if (diffMs > MAX_CLOCK_DRIFT_MS) {
      const diffMinutes = Math.round(diffMs / 60000);
      await waitForModalTransition();
      appAlert(
        'Device Time Incorrect',
        `Your device clock does not match the satellite time (off by about ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}).\n\n` +
          `Device time: ${format(deviceDate, TIME_FORMAT)}\n` +
          `GPS time: ${format(gpsDate as Date, TIME_FORMAT)}\n\n` +
          'Offline sales are stamped with satellite time, so your device clock must be accurate. ' +
          'Open your device Settings > Date & Time, enable "Set Automatically" (or adjust it to match the satellite time above), then try again.',
        undefined,
        { variant: 'error' }
      );
      return;
    }

    await waitForModalTransition();
    appAlert(
      'Enable Offline Mode?',
      '1. Only CASH sales can be completed while disconnected.\n' +
        '2. Only items in your offline catalog (More > Manage Offline Items) will be available on Sell.\n' +
        `3. Your device clock must match the satellite time (checked at ${format(gpsDate as Date, TIME_FORMAT)}).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: () => void updateSetting('offlineModeEnabled', true),
        },
      ],
      { variant: 'info' }
    );
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.action === 'language') {
      setLanguageOpen(true);
      return;
    }
    if (item.route) {
      router.push(item.route);
    }
  };

  const lowStockCount = lowStock.length;
  const avatarUri = useMemo(() => resolveAvatarUri(user?.profilePhoto), [user?.profilePhoto]);

  const menuSections = useMemo(() => {
    return [
      {
        title: strings.businessSection,
        items: [
          {
            icon: 'business-outline',
            label: strings.businessProfile,
            route: '/business-profile' as Href,
            colors: MENU_TILE_COLORS.businessProfile,
          },
          {
            icon: 'cube-outline',
            label: strings.manageInventory,
            route: '/products' as Href,
            colors: MENU_TILE_COLORS.items,
          },
          {
            icon: 'bar-chart-outline',
            label: strings.stockReport,
            route: '/stock-report' as Href,
            colors: MENU_TILE_COLORS.stockReport,
          },
          {
            icon: 'people-outline',
            label: strings.customers,
            route: '/customers' as Href,
            colors: MENU_TILE_COLORS.customers,
          },
        ],
      },
      {
        title: strings.purchaseSection,
        items: [
          {
            icon: 'bag-handle-outline',
            label: strings.purchaseOrders,
            route: '/orders' as Href,
            colors: MENU_TILE_COLORS.orders,
          },
          {
            icon: 'document-text-outline',
            label: strings.purchaseInvoices,
            route: '/purchase-invoices' as Href,
            colors: MENU_TILE_COLORS.invoices,
          },
          {
            icon: 'receipt-outline',
            label: strings.purchaseReceipts,
            route: '/purchase-receipts' as Href,
            colors: MENU_TILE_COLORS.receipts,
          },
          {
            icon: 'refresh-outline',
            label: strings.purchaseReturns,
            route: '/purchase-returns' as Href,
            colors: MENU_TILE_COLORS.returns,
          },
          {
            icon: 'shield-checkmark-outline',
            label: strings.purchaseWithholding,
            route: '/withholding-all' as Href,
            colors: MENU_TILE_COLORS.withholding,
          },
        ],
      },
      {
        title: strings.promotionsSection,
        items: [
          {
            icon: 'pricetag-outline',
            label: strings.coupons,
            route: '/coupons' as Href,
            colors: MENU_TILE_COLORS.coupons,
          },
          {
            icon: 'layers-outline',
            label: strings.promotions,
            route: '/promotions' as Href,
            colors: MENU_TILE_COLORS.promotions,
          },
          {
            icon: 'gift-outline',
            label: strings.giftCards,
            route: '/gift-cards' as Href,
            colors: MENU_TILE_COLORS.giftCards,
          },
        ],
      },
      {
        title: strings.securitySection,
        items: [
          {
            icon: 'shield-outline',
            label: strings.permissions,
            route: '/permissions' as Href,
            colors: MENU_TILE_COLORS.permissions,
          },
          {
            icon: 'key-outline',
            label: strings.changeLanguage,
            route: '/change-password' as Href,
            colors: MENU_TILE_COLORS.changePassword,
          },
        ],
      },
      {
        title: strings.generalSection,
        items: [
          {
            icon: 'bluetooth-outline',
            label: strings.bluetoothPrinter,
            route: '/bluetooth-printer' as Href,
            colors: MENU_TILE_COLORS.bluetoothPrinter,
          },
          {
            icon: 'information-circle-outline',
            label: strings.aboutUs,
            route: '/about' as Href,
            colors: MENU_TILE_COLORS.about,
          },
          {
            icon: 'chatbubble-ellipses-outline',
            label: strings.contactUs,
            route: '/contact-us' as Href,
            colors: MENU_TILE_COLORS.contact,
          },
        ],
      },
    ];
  }, [strings]);

  return (
    <View style={styles.screen}>
      <TabScreenHeader
        title={strings.title}
        subtitle={strings.subtitle}
        right={
          <Pressable
            style={[styles.bellBtn, !darkMode && styles.bellBtnLight]}
            hitSlop={8}
            onPress={() => router.push('/low-stock-alerts' as Href)}
          >
            <Bell size={20} color={darkMode ? '#FFFFFF' : Brand.primary} />
            {lowStockCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {lowStockCount > 99 ? '99+' : lowStockCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeroCard
          name={user?.fullName ?? 'User'}
          email={user?.email}
          phone={user?.phone}
          avatarUri={avatarUri}
          onPress={() => router.push('/business-profile' as Href)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OFFLINE & SYNC</Text>
          <View style={styles.sectionCard}>
            <View style={[styles.settingRow, styles.rowBorder]}>
              <View style={[styles.settingIconChip, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                <Ionicons name="cloud-offline-outline" size={15} color="#C2410C" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>{strings.workOffline}</Text>
                <Text style={styles.settingHint}>{strings.completeOfflineSales}</Text>
              </View>
              <Switch
                value={offlineModeEnabled}
                onValueChange={(value) => void handleOfflineModeToggle(value)}
                trackColor={{ false: Colors.border, true: Brand.primary }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.border}
              />
            </View>

            <Pressable
              style={[styles.settingRow, styles.rowBorder]}
              onPress={() => router.push('/manage-offline-items' as Href)}
            >
              <View style={[styles.settingIconChip, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="download-outline" size={15} color="#15803D" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>{strings.manageOfflineItems}</Text>
                <Text style={styles.settingHint}>{strings.chooseOfflineItems}</Text>
              </View>
              {offlineItemCount > 0 ? (
                <View style={styles.countBadgeNeutral}>
                  <Text style={styles.countBadgeNeutralText}>{offlineItemCount}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={13} color="#666666" />
            </Pressable>

            <Pressable
              style={[styles.settingRow, styles.rowBorder]}
              onPress={() => router.push('/unsynced-sales' as Href)}
            >
              <View style={[styles.settingIconChip, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                <Ionicons name="receipt-outline" size={15} color="#E11D48" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>{strings.unsyncedSales}</Text>
                <Text style={styles.settingHint}>{isOnline ? 'Online' : 'Offline — sales are being queued'}</Text>
              </View>
              {unsyncedCount > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{unsyncedCount > 99 ? '99+' : unsyncedCount}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={13} color="#666666" />
            </Pressable>

            <Pressable style={styles.settingRow} onPress={() => router.push('/offline-sales-report' as Href)}>
              <View style={[styles.settingIconChip, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <Ionicons name="bar-chart-outline" size={15} color="#4338CA" />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>{strings.offlineSalesReport}</Text>
                <Text style={styles.settingHint}>{strings.offlineReportHint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color="#666666" />
            </Pressable>
          </View>
        </View>

        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {/* {section.title === 'General' ? (
                <View style={[styles.darkModeRow, styles.rowBorder]}>
                  <View
                    style={[
                      styles.darkModeIconChip,
                      {
                        backgroundColor: MENU_TILE_COLORS.darkMode.bg,
                        borderColor: MENU_TILE_COLORS.darkMode.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="moon-outline"
                      size={15}
                      color={MENU_TILE_COLORS.darkMode.icon}
                    />
                  </View>
                  <Text style={styles.darkModeLabel}>Dark Mode</Text>
                  <Switch
                    value={darkMode ?? false}
                    onValueChange={(value) => void updateSetting('darkMode', value)}
                    trackColor={{ false: Colors.border, true: Brand.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.border}
                  />
                </View>
              ) : null} */}
              {section.items.map((item, index) => {
                const label =
                  item.action === 'language'
                    ? `${item.label} · ${getLanguageLabel(language)}`
                    : item.label;

                return (
                  <ProfileMenuItem
                    key={item.label}
                    icon={item.icon}
                    label={label}
                    colors={item.colors}
                    onPress={() => handleMenuPress(item)}
                    isLast={index === section.items.length - 1}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.versionRow}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionLabel}>Cheche POS · v1.0.0</Text>
          </View>
        </View>

        <View style={styles.logoutWrap}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="primary"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>

      <LanguagePickerModal
        visible={languageOpen}
        selectedId={language}
        onClose={() => setLanguageOpen(false)}
        onSelect={setLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scrollView: { flex: 1, backgroundColor: Colors.white },
  scroll: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnLight: {
    backgroundColor: Brand.primaryMuted,
    borderColor: 'transparent',
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  darkModeIconChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkModeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  settingIconChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextWrap: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  settingHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  countBadgeNeutral: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeNeutralText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.primary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#d6d6d6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: { elevation: 0 },
    }),
  },
  versionRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  versionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  logoutWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
  },
});

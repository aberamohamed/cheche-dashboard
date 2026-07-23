import { StandardTabBarButton } from '@/components/tabs/StandardTabBarButton';
import { WithholdingTabIcon } from '@/components/tabs/WithholdingTabIcon';
import { Brand, Colors, Typography } from '@/constants/theme';
import { getHomeStrings } from '@/i18n/home';
import { getInvoiceStrings } from '@/i18n/invoice';
import { getWithholdingStrings } from '@/i18n/withholding';
import { getMoreStrings } from '@/i18n/more';
import { getSellStrings } from '@/i18n/sell';
import { useTabBarInsets } from '@/hooks/useTabBarInsets';
import { useSettingsStore } from '@/store/settingsStore';
import { Tabs } from 'expo-router';
import { Ellipsis, Home, Receipt, ShoppingCart } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';

export function StandardTabLayout() {
  const { height, paddingTop, paddingBottom } = useTabBarInsets();
  const language = useSettingsStore((s) => s.language);
  const homeStrings = getHomeStrings(language);
  const invoiceStrings = getInvoiceStrings(language);
  const witholdingStrings = getWithholdingStrings(language);
  const moreStrings = getMoreStrings(language);
  const sellTabTitle = getSellStrings(language).tabTitle;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        freezeOnBlur: true,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: [styles.tabBar, { height, paddingTop, paddingBottom }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => <StandardTabBarButton {...props} />,
        sceneStyle: { backgroundColor: Colors.white },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: homeStrings.tabTitle,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: sellTabTitle,
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="invoice"
        options={{
          title: invoiceStrings.tabTitle,
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="withholding"
        options={{
          title: witholdingStrings.tabTitle,
          tabBarIcon: ({ color, size }) => <WithholdingTabIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: moreStrings.tabTitle,
          tabBarIcon: ({ color, size }) => <Ellipsis size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderLight,
    borderTopWidth: 0.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  tabLabel: { ...Typography.caption2, fontWeight: '500', marginTop: 2 },
});

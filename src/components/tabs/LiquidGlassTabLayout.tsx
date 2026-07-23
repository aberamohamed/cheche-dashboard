import { Brand } from '@/constants/theme';
import { getHomeStrings } from '@/i18n/home';
import { getInvoiceStrings } from '@/i18n/invoice';
import { getWithholdingStrings } from '@/i18n/withholding';
import { getMoreStrings } from '@/i18n/more';
import { getSellStrings } from '@/i18n/sell';
import { useSettingsStore } from '@/store/settingsStore';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

interface LiquidGlassTabLayoutProps {
  hideTabBar?: boolean;
}

export function LiquidGlassTabLayout({ hideTabBar = false }: LiquidGlassTabLayoutProps) {
  const language = useSettingsStore((s) => s.language);
  const homeStrings = getHomeStrings(language);
  const invoiceStrings = getInvoiceStrings(language);
  const witholdingStrings = getWithholdingStrings(language);
  const moreStrings = getMoreStrings(language);
  const sellTabTitle = getSellStrings(language).tabTitle;
  const tintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ dark: Brand.primary, light: Brand.primary })
      : Brand.primary;

  return (
    <NativeTabs tintColor={tintColor} minimizeBehavior="onScrollDown" hidden={hideTabBar}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
        />
        <NativeTabs.Trigger.Label>{homeStrings.tabTitle}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sell">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'cart', selected: 'cart.fill' }}
          md={{ default: 'shopping_cart', selected: 'shopping_cart' }}
        />
        <NativeTabs.Trigger.Label>{sellTabTitle}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="invoice">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md={{ default: 'receipt_long', selected: 'receipt_long' }}
        />
        <NativeTabs.Trigger.Label>{invoiceStrings.tabTitle}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="withholding">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'checkmark.shield', selected: 'checkmark.shield.fill' }}
          md={{ default: 'shield', selected: 'shield' }}
        />
        <NativeTabs.Trigger.Label>{witholdingStrings.tabTitle}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'ellipsis', selected: 'ellipsis' }}
          md={{ default: 'more_horiz', selected: 'more_horiz' }}
        />
        <NativeTabs.Trigger.Label>{moreStrings.tabTitle}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

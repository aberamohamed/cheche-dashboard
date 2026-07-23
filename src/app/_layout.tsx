import '@/global.css';
import { AlertHost } from '@/components/ui/AlertModal';
import { LoadingModalHost } from '@/components/ui/LoadingModal';
import { ToastHost } from '@/components/ui/Toast';
import { ThermalReceiptBitmapCaptureHost } from '@/components/receipt/ThermalReceiptBitmapCaptureHost';
import { AuthSessionGuard } from '@/components/auth/AuthSessionGuard';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAuthStore } from '@/store/authStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useSettingsStore } from '@/store/settingsStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

/** Boots connectivity tracking, settings, and offline-sale syncing. Rendered inside the providers. */
function OfflineCoordinator() {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateSettings();
    const unsubscribe = useConnectivityStore.getState().init();
    return unsubscribe;
  }, [hydrateSettings]);

  useOfflineSync();
  return null;
}

function useGlobalStatusBar() {
  useEffect(() => {
    RNStatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      RNStatusBar.setBackgroundColor('#FFFFFF');
    }
  }, []);
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useGlobalStatusBar();

  useEffect(() => {
    hydrate().finally(() => SplashScreen.hideAsync());
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <OfflineCoordinator />
        <AuthSessionGuard>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F5F7' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
          <Stack.Screen name="sell" />
          <Stack.Screen
            name="checkout"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
            <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
            <Stack.Screen name="receipt" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="receipt-preview" />
            <Stack.Screen name="thermal-receipt-preview" />
            <Stack.Screen
              name="invoice-detail"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            />
            <Stack.Screen name="low-stock-alerts" />
            <Stack.Screen name="products" />
            <Stack.Screen name="category-items" />
            <Stack.Screen name="stock-report" />
            <Stack.Screen
              name="register-withholding"
              options={{ contentStyle: { backgroundColor: '#FFFFFF' } }}
            />
            <Stack.Screen
              name="withholding-all"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            />
            <Stack.Screen name="add-item" />
            <Stack.Screen
              name="add-category"
              options={{
                presentation: 'transparentModal',
                animation: 'none',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen name="add-customer" />
            <Stack.Screen name="coupons" />
            <Stack.Screen name="gift-cards" />
            <Stack.Screen name="promotions" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
            <Stack.Screen name="create-coupon" />
            <Stack.Screen name="create-gift-card" />
            <Stack.Screen
              name="create-promotion"
              options={{ contentStyle: { backgroundColor: '#FFFFFF' } }}
            />
            <Stack.Screen name="item-prices" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
            <Stack.Screen
              name="create-item-price"
              options={{ contentStyle: { backgroundColor: '#FFFFFF' } }}
            />
            <Stack.Screen name="exchange-rates" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
            <Stack.Screen
              name="create-exchange-rate"
              options={{ contentStyle: { backgroundColor: '#FFFFFF' } }}
            />
            <Stack.Screen name="customers" />
            <Stack.Screen name="users" />
            <Stack.Screen name="permissions" />
            <Stack.Screen name="change-password" />
            <Stack.Screen name="business-profile" />
            <Stack.Screen name="unsynced-sales" />
            <Stack.Screen name="manage-offline-items" />
            <Stack.Screen name="offline-sales-report" />
            <Stack.Screen name="help-support" />
            <Stack.Screen name="about" />
            <Stack.Screen name="contact-us" />
            <Stack.Screen name="orders" />
            <Stack.Screen
              name="purchase-invoices"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            />
            <Stack.Screen
              name="purchase-receipts"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            />
            <Stack.Screen
              name="purchase-returns"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            />
          </Stack>
        </AuthSessionGuard>
        <AlertHost />
        <ToastHost />
        <LoadingModalHost />
        <ThermalReceiptBitmapCaptureHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

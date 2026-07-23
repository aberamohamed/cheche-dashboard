import { PinLockView } from '@/components/auth/PinLockView';
import { login } from '@/services/authService';
import { persistAuth, useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/utils/apiHelpers';
import { appAlert } from '@/utils/alert';
import { prefetchAppData } from '@/utils/prefetchAppData';
import { markTokenFresh } from '@/services/tokenRefresh';
import { cacheGuestUserData } from '@/utils/guestSession';
import { setCachedLoginPhone } from '@/utils/loginPhoneCache';
import { formatPhoneForApi } from '@/utils/phone';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

function resolveAvatarUri(profilePhoto?: string): string | null {
  if (!profilePhoto) return null;
  if (/^https?:\/\//i.test(profilePhoto)) return profilePhoto;
  return null;
}

export default function PinInputScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone ?? '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const user = useAuthStore((s) => s.user);

  const {
    setUser,
    setBusiness,
    setAuthenticated,
    setRememberMe,
    setIsGuest,
    setOrganizationId,
    setSessionId,
    deviceId,
  } = useAuthStore();

  const avatarUri = useMemo(() => resolveAvatarUri(user?.profilePhoto), [user?.profilePhoto]);

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (!phone) {
        appAlert('Missing Phone', 'Please enter your phone number again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ], { variant: 'warning' });
        return;
      }

      setIsSubmitting(true);
      try {
        await setCachedLoginPhone(phone);

        const result = await login(
          { phone: formatPhoneForApi(phone), password: pin },
          deviceId || (await useAuthStore.getState().initializeDeviceId())
        );
        setUser(result.user);
        setBusiness(result.business);
        setOrganizationId(result.organizationId);
        setSessionId(result.sessionId);
        setAuthenticated(true);
        setRememberMe(true);
        setIsGuest(result.isGuest);
        if (result.isGuest) {
          await cacheGuestUserData(result.user, result.business);
        }
        await persistAuth({
          user: result.user,
          business: result.business,
          token: result.token,
          refreshToken: result.refreshToken,
          organizationId: result.organizationId,
          sessionId: result.sessionId,
          rememberMe: true,
          isGuest: result.isGuest,
        });
        markTokenFresh();
        prefetchAppData();
        router.replace('/(tabs)/home');
      } catch (error) {
        setResetKey((k) => k + 1);
        appAlert('Login Failed', getApiErrorMessage(error), undefined, { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      phone,
      deviceId,
      setUser,
      setBusiness,
      setOrganizationId,
      setSessionId,
      setAuthenticated,
      setRememberMe,
      setIsGuest,
    ]
  );

  const switchUser = () => router.replace('/(auth)/login');

  const forgotPassword = () =>
    router.push({
      pathname: '/(auth)/forgot-password',
      params: phone ? { phone } : undefined,
    });

  const firstName = user?.fullName?.split(' ')[0]?.trim();
  const greeting = firstName ? `Hello, ${firstName}` : 'Welcome back';

  return (
    <PinLockView
      key={resetKey}
      greeting={greeting}
      title="Enter your PIN"
      avatarUri={avatarUri}
      isSubmitting={isSubmitting}
      onPinComplete={handlePinComplete}
      onForgotPassword={forgotPassword}
      onSwitchUser={switchUser}
    />
  );
}

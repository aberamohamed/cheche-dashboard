import { useEnsureSalesSession } from '@/hooks/useSalesSession';
import { recordActivity } from '@/services/sessionGuard';
import { maybeRefreshAuthTokens } from '@/services/tokenRefresh';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, PanResponder, View } from 'react-native';

const TOKEN_CHECK_INTERVAL_MS = 45 * 1000;

interface AuthSessionGuardProps {
  children: ReactNode;
}

export function AuthSessionGuard({ children }: AuthSessionGuardProps) {
  useEnsureSalesSession();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    recordActivity();

    const interval = setInterval(() => {
      void maybeRefreshAuthTokens();
    }, TOKEN_CHECK_INTERVAL_MS);

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        recordActivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isAuthenticated]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        if (useAuthStore.getState().isAuthenticated) {
          recordActivity();
        }
        return false;
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

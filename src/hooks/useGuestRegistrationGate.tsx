import { CompleteRegistrationModal } from '@/components/auth/CompleteRegistrationModal';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

export function useGuestRegistrationGate() {
  const isGuest = useAuthStore((state) => state.isGuest);
  const [visible, setVisible] = useState(false);

  const showPrompt = useCallback(() => {
    if (isGuest) {
      setVisible(true);
    }
  }, [isGuest]);

  const hidePrompt = useCallback(() => {
    setVisible(false);
  }, []);

  const navigateToRegistration = useCallback(() => {
    setVisible(false);
    router.push('/(auth)/register-plan');
  }, []);

  const requireRegistration = useCallback((): boolean => {
    if (!isGuest) return true;
    setVisible(true);
    return false;
  }, [isGuest]);

  const modal = useMemo(
    () => (
      <CompleteRegistrationModal
        visible={visible}
        onClose={hidePrompt}
        onComplete={navigateToRegistration}
      />
    ),
    [hidePrompt, navigateToRegistration, visible]
  );

  return {
    isGuest,
    visible,
    showPrompt,
    hidePrompt,
    requireRegistration,
    navigateToRegistration,
    modal,
  };
}

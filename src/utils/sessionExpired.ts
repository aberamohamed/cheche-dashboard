import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';

let handling = false;

export async function handleSessionExpired(): Promise<void> {
  if (handling) return;
  handling = true;

  try {
    const { isAuthenticated, logout } = useAuthStore.getState();
    if (isAuthenticated) {
      await logout({ skipRemote: true });
    }
    router.replace('/(auth)/login');
  } finally {
    setTimeout(() => {
      handling = false;
    }, 1000);
  }
}

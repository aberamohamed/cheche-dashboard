import { recordActivity } from '@/services/sessionGuard';
import { useAuthStore } from '@/store/authStore';

export function touchSessionActivity(): void {
  if (useAuthStore.getState().isAuthenticated) {
    recordActivity();
  }
}

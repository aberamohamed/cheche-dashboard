import { ensureSalesSession } from '@/services/sessionService';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export function useEnsureSalesSession() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const setSessionId = useAuthStore((s) => s.setSessionId);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    ensureSalesSession()
      .then((id) => {
        if (useAuthStore.getState().sessionId !== id) {
          setSessionId(id);
        }
      })
      .catch(() => {
        // opened again at checkout if needed
      });
  }, [isAuthenticated, token, setSessionId]);
}

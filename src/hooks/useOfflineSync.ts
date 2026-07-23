import { ensureOfflineDb } from '@/services/offline/db';
import { syncPendingSales } from '@/services/offline/syncService';
import { useAuthStore } from '@/store/authStore';
import { useConnectivityStore } from '@/store/connectivityStore';
import { useOfflineProductsStore } from '@/store/offlineProductsStore';
import { usePendingSalesStore } from '@/store/pendingSalesStore';
import { useEffect } from 'react';

/**
 * App-level offline coordinator. Mounted once near the root:
 *  - opens/migrates the offline DB and seeds the pending badge count
 *  - subscribes to connectivity, and when the device comes back online (and the
 *    user is authenticated) drains the offline sales outbox and refreshes cached
 *    offline catalog items from the live API in the background. Sync is always
 *    on — deliberately not user-configurable, to keep queued sales from being
 *    withheld from the server.
 */
export function useOfflineSync(): void {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    let cancelled = false;
    void ensureOfflineDb().then(() => {
      if (cancelled) return;
      void usePendingSalesStore.getState().refreshCount();
      void useOfflineProductsStore.getState().refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Runs on the offline→online transition and when auth changes.
    // syncPendingSales is guarded (single in-flight run, no-op when nothing is queued).
    // Offline product refresh also runs in the background after/with sales sync.
    if (isOnline && token) {
      void syncPendingSales();
    }
  }, [isOnline, token]);
}

import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface ConnectivityState {
  /** True when the device has a network connection that is (or is presumed) internet-reachable. */
  isOnline: boolean;
  /** Whether we have finished the first NetInfo read. */
  initialized: boolean;
  init: () => () => void;
  setOnline: (online: boolean) => void;
}

function resolveOnline(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  // isInternetReachable can be null while unknown — treat null as "assume reachable if connected".
  if (state.isInternetReachable === false) return false;
  return state.isConnected !== false;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: true,
  initialized: false,

  setOnline: (online) => set({ isOnline: online }),

  init: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      set({ isOnline: resolveOnline(state), initialized: true });
    });

    // Kick off an immediate fetch so we don't wait for the first change event.
    void NetInfo.fetch().then((state) => {
      set({ isOnline: resolveOnline(state), initialized: true });
    });

    return unsubscribe;
  },
}));

/** Imperative check for use outside React (services). */
export function isOnlineNow(): boolean {
  return useConnectivityStore.getState().isOnline;
}

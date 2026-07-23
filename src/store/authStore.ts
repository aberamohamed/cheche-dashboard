import { usePaymentMethodsStore } from '@/store/paymentMethodsStore';
import { usePaymentTermsStore } from '@/store/paymentTermsStore';
import { prefetchAppData } from '@/utils/prefetchAppData';
import { markTokenFresh } from '@/services/tokenRefresh';
import * as SecureStore from 'expo-secure-store';
import type { User, Business } from '@/types';
import { clearGuestUserCache } from '@/utils/guestSession';
import { resolveDeviceId } from '@/utils/deviceId';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  business: Business | null;
  token: string | null;
  refreshToken: string | null;
  organizationId: string | null;
  sessionId: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setBusiness: (business: Business | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setOrganizationId: (id: string | null) => void;
  setSessionId: (id: string | null) => void;
  setDeviceId: (id: string) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setRememberMe: (value: boolean) => void;
  setIsGuest: (value: boolean) => void;
  initializeDeviceId: () => Promise<string>;
  logout: (options?: { skipRemote?: boolean }) => Promise<void>;
  hydrate: () => Promise<void>;
}

const AUTH_KEY = 'cheche_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  business: null,
  token: null,
  refreshToken: null,
  organizationId: null,
  sessionId: null,
  deviceId: '',
  isAuthenticated: false,
  isLoading: true,
  rememberMe: false,
  isGuest: false,

  setUser: (user) => set({ user }),
  setBusiness: (business) => set({ business }),
  setToken: (token) => set({ token }),
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setOrganizationId: (organizationId) => set({ organizationId }),
  setSessionId: (sessionId) => set({ sessionId }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),
  setRememberMe: (value) => set({ rememberMe: value }),
  setIsGuest: (isGuest: boolean) => set({ isGuest }),

  initializeDeviceId: async () => {
    const existing = get().deviceId;
    if (existing) return existing;

    const deviceId = await resolveDeviceId();
    set({ deviceId });
    return deviceId;
  },

  logout: async (options?: { skipRemote?: boolean }) => {
    if (!options?.skipRemote) {
      const { logoutApi } = await import('@/services/authService');
      try {
        if (get().token) await logoutApi();
      } catch {
        // ignore
      }
    }
    await SecureStore.deleteItemAsync(AUTH_KEY);
    await clearGuestUserCache();
    usePaymentMethodsStore.getState().clear();
    usePaymentTermsStore.getState().clear();
    set({
      user: null,
      business: null,
      token: null,
      refreshToken: null,
      organizationId: null,
      sessionId: null,
      isAuthenticated: false,
      isGuest: false,
    });
  },

  hydrate: async () => {
    try {
      await get().initializeDeviceId();

      const stored = await SecureStore.getItemAsync(AUTH_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          user: data.user ?? null,
          business: data.business ?? null,
          token: data.token ?? null,
          refreshToken: data.refreshToken ?? null,
          organizationId: data.organizationId ?? null,
          sessionId: data.sessionId ?? null,
          isAuthenticated: !!data.token,
          rememberMe: data.rememberMe ?? false,
          isGuest: data.isGuest ?? false,
        });
        if (data.token) {
          markTokenFresh();
          prefetchAppData();
        }
      }
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));

export interface PersistAuthInput {
  user: User;
  business: Business | null;
  token: string;
  refreshToken?: string | null;
  organizationId?: string | null;
  sessionId?: string | null;
  rememberMe: boolean;
  isGuest?: boolean;
}

export async function persistAuth(input: PersistAuthInput): Promise<void> {
  await SecureStore.setItemAsync(
    AUTH_KEY,
    JSON.stringify({
      user: input.user,
      business: input.business,
      token: input.token,
      refreshToken: input.refreshToken ?? null,
      organizationId: input.organizationId ?? null,
      sessionId: input.sessionId ?? null,
      rememberMe: input.rememberMe,
      isGuest: input.isGuest ?? false,
    })
  );
}

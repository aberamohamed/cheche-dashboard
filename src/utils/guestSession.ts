import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Business, User } from '@/types';

const GUEST_USER_CACHE_KEY = 'cheche_guest_user_cache';
const GUEST_HOME_PROMPT_PREFIX = 'cheche_guest_home_prompt_seen_';

export interface GuestUserCache {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  organizationName: string;
  isGuest: true;
  cachedAt: string;
}

export function resolveIsGuestUser(
  business: Business | null,
  organizationName?: string | null
): boolean {
  const candidates = [
    business?.name,
    organizationName,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return candidates.some((value) => value === 'guest' || value.startsWith('guest '));
}

export async function cacheGuestUserData(
  user: User,
  business: Business | null,
  organizationName?: string | null
): Promise<void> {
  const payload: GuestUserCache = {
    userId: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    organizationName: organizationName ?? business?.name ?? 'Guest',
    isGuest: true,
    cachedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(GUEST_USER_CACHE_KEY, JSON.stringify(payload));
}

export async function getCachedGuestUserData(): Promise<GuestUserCache | null> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestUserCache;
  } catch {
    return null;
  }
}

export async function clearGuestUserCache(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_USER_CACHE_KEY);
}

function homePromptKey(userId: string): string {
  return `${GUEST_HOME_PROMPT_PREFIX}${userId}`;
}

export async function hasSeenGuestHomePrompt(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(homePromptKey(userId));
  return value === 'true';
}

export async function markGuestHomePromptSeen(userId: string): Promise<void> {
  await AsyncStorage.setItem(homePromptKey(userId), 'true');
}

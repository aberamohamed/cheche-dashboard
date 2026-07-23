import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny write-through cache for small reference datasets (payment methods, taxes) so
 * they remain available for offline checkout across app restarts.
 */
export async function readOfflineCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`offline_cache:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeOfflineCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`offline_cache:${key}`, JSON.stringify(value));
  } catch {
    // best-effort; ignore write failures
  }
}

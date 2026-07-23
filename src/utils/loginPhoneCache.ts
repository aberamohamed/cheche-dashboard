import AsyncStorage from '@react-native-async-storage/async-storage';
import { stripToLocalPhone } from '@/utils/phone';

const CACHE_KEY = 'cheche_login_phone';

export async function getCachedLoginPhone(): Promise<string> {
  try {
    const value = await AsyncStorage.getItem(CACHE_KEY);
    return value ? stripToLocalPhone(value) : '';
  } catch {
    return '';
  }
}

export async function setCachedLoginPhone(localPhone: string): Promise<void> {
  try {
    const local = stripToLocalPhone(localPhone);
    if (local) {
      await AsyncStorage.setItem(CACHE_KEY, local);
    }
  } catch {
    // ignore
  }
}

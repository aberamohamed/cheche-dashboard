import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'cheche_device_id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function readConfigOverride(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.deviceId;
  if (typeof fromExtra === 'string') {
    const trimmed = fromExtra.trim();
    if (trimmed && isValidDeviceUuid(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Stable POS device identifier for x-device-id and sales session APIs.
 * Generated once per install and stored in SecureStore (UUID v4).
 */
export async function resolveDeviceId(): Promise<string> {
  const override = readConfigOverride();
  if (override) return override;

  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored && isValidDeviceUuid(stored)) {
    return stored;
  }

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}

export function getDeviceInfo() {
  return {
    platform: 'mobile',
    os: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    model: Device.modelName ?? undefined,
    brand: Device.brand ?? undefined,
  };
}

import * as Device from 'expo-device';
import { Platform } from 'react-native';

/** iOS 26+ supports liquid glass native tabs */
export function supportsLiquidGlassTabs(): boolean {
  if (Platform.OS !== 'ios') return false;
  const version = parseFloat(Device.osVersion ?? '0');
  return version >= 26;
}

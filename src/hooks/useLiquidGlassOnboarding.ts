import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function supportsLiquidGlassOnboarding(): boolean {
  if (Platform.OS !== 'ios') return false;
  const version = parseFloat(Device.osVersion ?? '0');
  return version >= 26 && isLiquidGlassSupported;
}

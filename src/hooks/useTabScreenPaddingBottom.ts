import { supportsLiquidGlassTabs } from '@/hooks/useLiquidGlassTabs';
import { getTabBarContentPaddingBottom } from '@/hooks/useTabBarInsets';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom inset for tab bar — apply as paddingBottom on ScrollView/FlatList contentContainerStyle. */
export function useTabScreenPaddingBottom(): number {
  const insets = useSafeAreaInsets();

  if (supportsLiquidGlassTabs()) {
    return insets.bottom + 49 + 8;
  }

  return getTabBarContentPaddingBottom(Platform.OS, insets.bottom);
}

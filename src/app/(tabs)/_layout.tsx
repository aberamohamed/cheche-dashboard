import { LiquidGlassTabLayout } from '@/components/tabs/LiquidGlassTabLayout';
import { StandardTabLayout } from '@/components/tabs/StandardTabLayout';
import { supportsLiquidGlassTabs } from '@/hooks/useLiquidGlassTabs';
import { useSegments } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'home',
};

function TabLayoutContent() {
  const segments = useSegments();
  const hideTabBar = segments[segments.length - 1] === 'sell';

  if (supportsLiquidGlassTabs()) {
    return <LiquidGlassTabLayout hideTabBar={hideTabBar} />;
  }
  return <StandardTabLayout />;
}

export default function TabLayout() {
  return <TabLayoutContent />;
}

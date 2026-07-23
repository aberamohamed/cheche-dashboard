import { Redirect, useIsFocused } from 'expo-router';

export default function DashboardScreen() {
  const isFocused = useIsFocused();

  if (!isFocused) {
    return null;
  }

  return <Redirect href="/(tabs)/home" />;
}

import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/** Entry route: wait for auth hydrate, then go to home or login (no branded splash delay). */
export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current || pathname !== '/') return;

    hasRedirected.current = true;
    router.replace(isAuthenticated ? '/(tabs)/home' : '/(auth)/login');
  }, [isLoading, isAuthenticated, pathname]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Brand.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

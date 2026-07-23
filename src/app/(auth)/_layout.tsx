import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Colors.white },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="pin-input" />
      <Stack.Screen name="getting-started" options={{ animation: 'fade' }} />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="register-etrade" />
      <Stack.Screen name="register-plan" />
      <Stack.Screen name="register-business" />
      <Stack.Screen name="register-owner" />
    </Stack>
  );
}

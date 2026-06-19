import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/store/auth-store';

export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
    </Stack>
  );
}

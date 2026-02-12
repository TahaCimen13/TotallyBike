import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/auth';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: true, title: 'QR Tara', headerStyle: { backgroundColor: '#111' }, headerTintColor: '#fff' }} />
      </Stack>
    </AuthProvider>
  );
}

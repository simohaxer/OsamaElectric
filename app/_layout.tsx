import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { I18nManager, Platform } from 'react-native';

// Force RTL for Arabic support
if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="asset-details" 
          options={{
            headerShown: true,
            title: 'تفاصيل الأصل',
            headerStyle: { backgroundColor: '#1E3A8A' },
            headerTintColor: '#FFFFFF',
          }}
        />
      </Stack>
    </AppProvider>
  );
}

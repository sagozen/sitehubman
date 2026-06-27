import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { ThemeStatusBar } from '@/src/components/ThemeStatusBar';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { GuestGateProvider } from '@/src/providers/GuestGateProvider';
import { PreferencesProvider } from '@/src/providers/PreferencesProvider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (

    <ErrorBoundary>

    <AuthProvider>

      <PreferencesProvider>

        <GuestGateProvider>

          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          >

            <Stack.Screen name="index" />

            <Stack.Screen name="auth/login" />

            <Stack.Screen name="auth/register" />

            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="sales" />

            <Stack.Screen name="admin" />

            <Stack.Screen name="account" />

            <Stack.Screen name="customer" />

            <Stack.Screen name="new-order" />

            <Stack.Screen name="order-detail/[orderId]" />

            <Stack.Screen name="order-receipt/[orderId]" options={{ headerShown: false }} />

            <Stack.Screen name="payment/[intentId]" options={{ headerShown: false }} />

            <Stack.Screen name="activate-card" options={{ headerShown: true, title: 'Activate Card' }} />

            <Stack.Screen name="edit-bio" options={{ headerShown: true, title: 'Edit Bio Page' }} />

            <Stack.Screen name="theme-picker" options={{ headerShown: false }} />

            <Stack.Screen name="language-picker" options={{ headerShown: false }} />

            <Stack.Screen name="public/[slug]" options={{ headerShown: true, title: 'Public Bio Page' }} />

            <Stack.Screen name="c/[cardId]" options={{ headerShown: true, title: 'Profile' }} />

            <Stack.Screen name="p/[slug]" options={{ headerShown: true, title: 'Profile' }} />

            <Stack.Screen name="scan" options={{ headerShown: false }} />

            <Stack.Screen name="nfc-demo" options={{ headerShown: false }} />

            <Stack.Screen name="qr-generator" options={{ headerShown: false }} />

            <Stack.Screen name="studio" options={{ headerShown: false }} />

            <Stack.Screen name="icon-preview" options={{ headerShown: false }} />

            <Stack.Screen name="guest-analytics" options={{ headerShown: false }} />

            <Stack.Screen name="guest-design" options={{ headerShown: false }} />

            <Stack.Screen name="guest-checkout" options={{ headerShown: false }} />

            <Stack.Screen name="card-preview/[cardId]" options={{ headerShown: false }} />

            <Stack.Screen name="checkout/[cardId]" options={{ headerShown: false }} />

            <Stack.Screen name="guest-track-order" options={{ headerShown: false }} />

            <Stack.Screen name="guest-post-login-choice" options={{ headerShown: false }} />

            <Stack.Screen name="+not-found" />

          </Stack>

          <ThemeStatusBar />

        </GuestGateProvider>

      </PreferencesProvider>

    </AuthProvider>

    </ErrorBoundary>

  );

}

export default RootLayout;

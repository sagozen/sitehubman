import { useEffect } from 'react';
import useCachedResources from '@/src/hooks/useCachedResources';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { View, Text } from 'react-native';

// Suppress verbose development-only logs to keep console clean
const originalLog = console.log;
const originalWarn = console.warn;
const originalInfo = console.info;

const noisePhrases = [
  'Download the React DevTools',
  'Running application "main"',
  'Development-level warnings',
  'Performance optimizations',
  '[Reanimated] Reduced motion',
  'useNativeDriver',
  'Analytics initialized',
  'shadow*',
  'boxShadow',
];

const isNoise = (args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  return noisePhrases.some((phrase) => message.includes(phrase));
};

console.log = (...args: unknown[]) => {
  if (isNoise(args)) return;
  originalLog(...args);
};

console.info = (...args: unknown[]) => {
  if (isNoise(args)) return;
  originalInfo(...args);
};

console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (isNoise(args) || message.includes('"shadow*" style props') || message.includes('useNativeDriver')) return;
  originalWarn(...args);
};

// Globally strip all shadow properties to satisfy "no need shadow for this app"
import { StyleSheet } from 'react-native';
const originalCreate = StyleSheet.create;
const stripShadows = (style: any): any => {
  if (!style || typeof style !== 'object') return style;
  if (Array.isArray(style)) {
    return style.map(stripShadows);
  }
  const newStyle: any = {};
  for (const key in style) {
    if (Object.prototype.hasOwnProperty.call(style, key)) {
      if (
        key === 'shadowColor' ||
        key === 'shadowOffset' ||
        key === 'shadowOpacity' ||
        key === 'shadowRadius' ||
        key === 'elevation' ||
        key === 'boxShadow'
      ) {
        continue;
      }
      if (typeof style[key] === 'object' && style[key] !== null) {
        newStyle[key] = stripShadows(style[key]);
      } else {
        newStyle[key] = style[key];
      }
    }
  }
  return newStyle;
};
StyleSheet.create = (styles: any) => {
  return originalCreate(stripShadows(styles));
};

import { ThemeStatusBar } from '@/src/components/ThemeStatusBar';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { GuestGateProvider } from '@/src/providers/GuestGateProvider';
import { PreferencesProvider } from '@/src/providers/PreferencesProvider';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { analytics } from '@/src/utils/analytics';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const isReady = useCachedResources();

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    analytics.initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#FFF' }}>App is loading resources...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
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
                <Stack.Screen name="(auth)/login" />
                <Stack.Screen name="(auth)/register" />
                <Stack.Screen name="cards" />
                <Stack.Screen name="orders" />
                <Stack.Screen name="payments" />
                <Stack.Screen name="production" />
                <Stack.Screen name="u/[slug]" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/register" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signin" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="register" />
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}

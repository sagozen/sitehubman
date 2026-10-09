import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import useCachedResources from '@/src/hooks/useCachedResources';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { SeoHead } from '@/src/components/SeoHead';
import { ThemeStatusBar } from '@/src/components/ThemeStatusBar';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { GuestGateProvider } from '@/src/providers/GuestGateProvider';
import { PreferencesProvider } from '@/src/providers/PreferencesProvider';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { ToastProvider } from '@/src/providers/ToastProvider';
import { analytics } from '@/src/utils/analytics';
import { setupGlobalUnhandledErrorListeners } from '@/src/services/errorLoggingService';
import { HomeSkeleton } from '@/src/components/HomeSkeleton';
import { NetConnectionBanner } from '@/src/components/NetConnectionBanner';
import { useNotificationRouting } from '@/src/hooks/useNotificationRouting';

// ── Suppress noisy dev logs ───────────────────────────────────────────────────
const originalLog = console.log;
const originalWarn = console.warn;
const originalInfo = console.info;

const NOISE = [
  'Download the React DevTools',
  'Running application "main"',
  '[Reanimated] Reduced motion',
  'useNativeDriver',
  'Analytics initialized',
  '"shadow*" style props',
  'boxShadow',
];

const isNoise = (args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  return NOISE.some((p) => msg.includes(p));
};

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: !__DEV__,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'production',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

console.log = (...a: unknown[]) => {
  if (!isNoise(a)) originalLog(...a);
};
console.info = (...a: unknown[]) => {
  if (!isNoise(a)) originalInfo(...a);
};
console.warn = (...a: unknown[]) => {
  if (!isNoise(a)) originalWarn(...a);
};
// ─────────────────────────────────────────────────────────────────────────────

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useNotificationRouting();
  const isReady = useCachedResources();

  // Hide splash once resources are ready, with a safety timeout for native iOS launch
  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isReady]);

  useEffect(() => {
    // Safety fallback: ensure splash screen is dismissed even if a network or resource load is slow
    const splashTimeout = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 3500);
    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    setupGlobalUnhandledErrorListeners();
    analytics.initialize();
  }, []);

  if (!isReady) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <SeoHead
        title="AVIO – Smart NFC Digital Business Cards"
        description="Create premium NFC digital business cards. Share your profile via tap, QR, or link. Track every scan in real time. CONNECT · IDENTIFY · EMPOWER."
        type="website"
      />
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <PreferencesProvider>
                <GuestGateProvider>
                  <NetConnectionBanner />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
                      gestureEnabled: true,
                      gestureDirection: 'horizontal',
                      fullScreenGestureEnabled: Platform.OS === 'ios',
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(auth)/login" />
                    <Stack.Screen name="(auth)/register" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="cards" />
                    <Stack.Screen name="orders" />
                    <Stack.Screen name="payments" />
                    <Stack.Screen name="production" />
                    <Stack.Screen name="sales" />
                    <Stack.Screen name="admin" />
                    <Stack.Screen name="account" />
                    <Stack.Screen name="customer" />
                    <Stack.Screen
                      name="u/[slug]"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="new-order" />
                    <Stack.Screen name="order-detail/[orderId]" />
                    <Stack.Screen
                      name="order-receipt/[orderId]"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="activate-card"
                      options={{ headerShown: true, title: 'Activate Card' }}
                    />
                    <Stack.Screen
                      name="edit-bio"
                      options={{ headerShown: true, title: 'Edit Bio Page' }}
                    />
                    <Stack.Screen
                      name="theme-picker"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="language-picker"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="public/[slug]"
                      options={{ headerShown: true, title: 'Public Profile' }}
                    />
                    <Stack.Screen
                      name="scan"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="nfc-demo"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="qr-generator"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="studio"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="contact-sales"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="guest-analytics"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="guest-design"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="guest-checkout"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="card-preview/[cardId]"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="guest-track-order"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="guest-post-login-choice"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <ThemeStatusBar />
                </GuestGateProvider>
              </PreferencesProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </>
  );
}

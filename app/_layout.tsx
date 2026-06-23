import { useEffect, useState } from 'react';
import { InteractionManager, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MarketingSceneImage } from '@/src/components/MarketingSceneImage';

import { Stack } from 'expo-router';

import { checkAndApplyEasUpdate } from '@/src/utils/easUpdates';
import { preloadBrandAssets } from '@/src/services/preloadBrandAssets';
import { refreshProductCatalog } from '@/src/services/productCatalogService';

import { useFonts } from 'expo-font';

import {

  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,

} from '@expo-google-fonts/inter';

import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { ThemeStatusBar } from '@/src/components/ThemeStatusBar';

import { AuthProvider } from '@/src/providers/AuthProvider';

import { GuestGateProvider } from '@/src/providers/GuestGateProvider';

import { PreferencesProvider } from '@/src/providers/PreferencesProvider';



SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: 'https://placeholder@o0.ingest.sentry.io/0', // Replace with real DSN post-pilot
  debug: false,
});

const SPLASH_FAILSAFE_MS = 3000;

const FONT_FAILSAFE_MS = 5000;



function RootLayout() {
  const { width, height } = useWindowDimensions();

  const [fontsLoaded, fontError] = useFonts({

    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,

  });

  const [fontTimedOut, setFontTimedOut] = useState(false);



  useEffect(() => {

    const timer = setTimeout(() => {

      void SplashScreen.hideAsync();

    }, SPLASH_FAILSAFE_MS);

    return () => clearTimeout(timer);

  }, []);



  useEffect(() => {

    if (fontsLoaded || fontError) {

      void SplashScreen.hideAsync();

    }

  }, [fontsLoaded, fontError]);



  useEffect(() => {

    const timer = setTimeout(() => setFontTimedOut(true), FONT_FAILSAFE_MS);

    return () => clearTimeout(timer);

  }, []);



  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void checkAndApplyEasUpdate();
      void preloadBrandAssets();
      void refreshProductCatalog();
    });
    return () => task.cancel();
  }, []);



  const uiReady = fontsLoaded || fontError || fontTimedOut;

  if (!uiReady) {
    return (
      <View style={launchStyles.root}>
        <MarketingSceneImage
          sceneId="splash"
          width={width}
          height={height}
          preferBundled
          lazy={false}
          contentFit="cover"
        />
      </View>
    );
  }



  return (

    <ErrorBoundary>

    <AuthProvider>

      <PreferencesProvider>

        <GuestGateProvider>

          <Stack screenOptions={{ headerShown: false }}>

            <Stack.Screen name="index" />

            <Stack.Screen name="auth/login" />

            <Stack.Screen name="auth/register" />

            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="sales" />

            <Stack.Screen name="printer" />

            <Stack.Screen name="qa" />

            <Stack.Screen name="shipping" />

            <Stack.Screen name="admin" />

            <Stack.Screen name="account" />

            <Stack.Screen name="new-order" />

            <Stack.Screen name="order-detail/[orderId]" />

            <Stack.Screen name="order-receipt/[orderId]" options={{ headerShown: false }} />

            <Stack.Screen name="payment/[intentId]" options={{ headerShown: false }} />

            <Stack.Screen name="production-label/[orderId]" options={{ headerShown: false }} />

            <Stack.Screen name="activate-card" options={{ headerShown: true, title: 'Activate Card' }} />

            <Stack.Screen name="edit-bio" options={{ headerShown: true, title: 'Edit Bio Page' }} />

            <Stack.Screen name="theme-picker" options={{ headerShown: false }} />

            <Stack.Screen name="language-picker" options={{ headerShown: false }} />

            <Stack.Screen name="public/[slug]" options={{ headerShown: true, title: 'Public Bio Page' }} />

            <Stack.Screen name="c/[cardId]" options={{ headerShown: true, title: 'Profile' }} />

            <Stack.Screen name="p/[slug]" options={{ headerShown: true, title: 'Profile' }} />

            <Stack.Screen name="scan" options={{ headerShown: false }} />

            <Stack.Screen name="nfc-demo" options={{ headerShown: false }} />

            <Stack.Screen name="guest-analytics" options={{ headerShown: false }} />

            <Stack.Screen name="guest-design" options={{ headerShown: false }} />

            <Stack.Screen name="guest-checkout" options={{ headerShown: false }} />

            <Stack.Screen name="card-preview/[cardId]" options={{ headerShown: false }} />

            <Stack.Screen name="checkout/[cardId]" options={{ headerShown: false }} />

            <Stack.Screen name="guest-track-order" options={{ headerShown: false }} />

            <Stack.Screen name="guest-post-login-choice" options={{ headerShown: false }} />

            <Stack.Screen name="print-job/[orderId]" options={{ headerShown: false }} />
            <Stack.Screen name="printer-settings" options={{ headerShown: false }} />

            <Stack.Screen name="+not-found" />

          </Stack>

          <ThemeStatusBar />

        </GuestGateProvider>

      </PreferencesProvider>

    </AuthProvider>

    </ErrorBoundary>

  );

}

const launchStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default Sentry.wrap(RootLayout);

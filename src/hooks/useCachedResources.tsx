import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { prefetchCloudinaryUrls } from '@/src/services/cloudinaryUrlCache';

const customFonts = {
  'SF-Pro-Display-Bold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
  'SF-Pro-Display-Medium': require('../../assets/fonts/SF-Pro-Display-Medium.otf'),
  'SF-Pro-Display-Regular': require('../../assets/fonts/SF-Pro-Display-Regular.otf'),
  'SF-Pro-Display-Semibold': require('../../assets/fonts/SF-Pro-Display-Semibold.otf'),
};

export default function useCachedResources(): boolean {
  // 1. Load fonts. We use a try-catch approach via the hook's behavior.
  const [fontsLoaded, fontError] = useFonts(customFonts);
  const [isReady, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        // We don't await SplashScreen here to avoid hanging the logic.
        // Instead, we just tell the app we are ready to go.
        
        // Trigger pre-fetching in the background WITHOUT 'await'
        // so it doesn't block the 'setReady(true)' call.
        triggerBackgroundTasks();

      } catch (e) {
        console.error('Error during resource caching', e);
      } finally {
        setReady(true);
      }
    }

    // Helper to run heavy tasks without blocking the main thread
    async function triggerBackgroundTasks() {
      try {
        const routes = [
          'cards',
          'orders',
          'payments',
          'production',
          'customer',
          'admin',
        ];
        for (const r of routes) {
          router.prefetch(`/${r}` as any);
        }

        // Cloudinary prefetch (if needed)
        // await prefetchCloudinaryUrls([], 800); 
      } catch (err) {
        console.warn('Background prefetch failed, but app is still running.', err);
      }
    }

    // If fonts are loaded OR if there was an error loading fonts, we proceed.
    if (fontsLoaded || fontError) {
      prepare();
    }
  }, [fontsLoaded, fontError, router]);

  // The app is ready as soon as fonts are loaded (or failed) and the prepare function runs.
  return fontsLoaded || !!fontError && isReady;
}

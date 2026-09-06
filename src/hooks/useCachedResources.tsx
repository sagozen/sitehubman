import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { prefetchCloudinaryUrls } from '@/src/services/cloudinaryUrlCache';

const customFonts: Record<string, any> = {
  'SF-Pro-Display-Bold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
  'SF-Pro-Display-Medium': require('../../assets/fonts/SF-Pro-Display-Medium.otf'),
  'SF-Pro-Display-Regular': require('../../assets/fonts/SF-Pro-Display-Regular.otf'),
  'SF-Pro-Display-Semibold': require('../../assets/fonts/SF-Pro-Display-Semibold.otf'),
  'Inter_900Black': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
  'Inter_800ExtraBold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
  'Inter_700Bold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
  'Inter_600SemiBold': require('../../assets/fonts/SF-Pro-Display-Semibold.otf'),
  'Inter_500Medium': require('../../assets/fonts/SF-Pro-Display-Medium.otf'),
  'Inter_400Regular': require('../../assets/fonts/SF-Pro-Display-Regular.otf'),
};

export default function useCachedResources(): boolean {
  // On web, skip native OTF binary font decoding to avoid OTS parsing issues
  const [fontsLoaded, fontError] = useFonts(Platform.OS === 'web' ? {} : customFonts);
  const [isReady, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        triggerBackgroundTasks();
      } catch (e) {
        console.error('Error during resource caching', e);
      } finally {
        setReady(true);
      }
    }

    function triggerBackgroundTasks() {
      setTimeout(() => {
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
        } catch {
          // Silent catch for initial render prefetch
        }
      }, 1000);
    }

    if (fontsLoaded || fontError) {
      prepare();
    }
  }, [fontsLoaded, fontError, router]);

  // Fix: operator precedence — both conditions must be true before app renders
  return (fontsLoaded || !!fontError) && isReady;
}

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';



export default function useCachedResources(): boolean {
  const [isReady, setReady] = useState(false);
  const router = useRouter();

  const resourcesLoaded = true;

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

    if (resourcesLoaded) {
      prepare();
    }
  }, [resourcesLoaded, router]);

  // Fix: operator precedence — both conditions must be true before app renders
  return resourcesLoaded && isReady;
}

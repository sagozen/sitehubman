import { useEffect } from 'react';
// Firebase messaging is conditionally required inline to prevent Web bundler crashes
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function initializeAndroidNotificationChannels() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('payment_alerts', {
      name: 'Payment & Order Alerts',
      description: 'Real-time alerts for incoming bank settlements and production factory queue updates.',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      showBadge: true,
    });
    console.log('[PUSH CHANNELS] Android payment_alerts channel topology successfully bound.');
  } catch (error) {
    console.warn('[PUSH CHANNELS] Channel initialization skipped or failed:', error);
  }
}

export function useNotificationRouting() {
  const router = useRouter();

  useEffect(() => {
    // Initialize native channel configuration seamlessly upon mount
    void initializeAndroidNotificationChannels();

    if (Platform.OS === 'web') return;

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
        console.log('[PUSH INTERCEPT] Notification opened from background:', data);
        const targetPath = data?.routingPath;
        if (targetPath && typeof targetPath === 'string') {
          router.replace(targetPath as any);
        }
      });

      void Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) {
            const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
            console.log('[PUSH INTERCEPT] Notification triggered cold launch:', data);
            const targetPath = data?.routingPath;
            if (targetPath && typeof targetPath === 'string') {
              setTimeout(() => {
                router.replace(targetPath as any);
              }, 800);
            }
          }
        })
        .catch((err) => {
          console.warn('[PUSH INTERCEPT] getLastNotificationResponseAsync error:', err);
        });

      return () => {
        subscription.remove();
      };
    } catch (e) {
      console.warn('[PUSH INTERCEPT] Native notification routing initialization deferred:', e);
    }
  }, [router]);
}


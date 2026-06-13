import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db } from '@/src/services/firebaseClient';

type ExpoNotificationsModule = typeof import('expo-notifications');

let notificationsModule: ExpoNotificationsModule | null = null;

async function loadModules() {
  if (Platform.OS === 'web') return { notifications: null, device: null };
  try {
    const [notifications, device] = await Promise.all([
      import('expo-notifications'),
      import('expo-device'),
    ]);
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return { notifications, device };
  } catch {
    return { notifications: null, device: null };
  }
}

export async function registerPushNotifications(userId: string): Promise<string | null> {
  if (!userId || userId === 'guest' || !auth.currentUser) return null;

  const { notifications, device } = await loadModules();
  if (!notifications || !device?.isDevice) return null;

  notificationsModule = notifications;

  const { status: existing } = await notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.projectId;
  if (!projectId) return null;

  const token = (
    await notifications.getExpoPushTokenAsync({
      projectId: String(projectId),
    })
  ).data;

  await setDoc(
    doc(db, firebaseCollections.users, userId),
    {
      expoPushToken: token,
      pushTokenUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return token;
}

/** Local alert when the signed-in user receives an in-app notification. */
export async function showLocalNotificationForUser(
  targetUserId: string,
  title: string,
  message: string
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== targetUserId) return;

  if (!notificationsModule) {
    const loaded = await loadModules();
    notificationsModule = loaded.notifications;
  }
  if (!notificationsModule) return;

  await notificationsModule.scheduleNotificationAsync({
    content: { title, body: message },
    trigger: null,
  });
}

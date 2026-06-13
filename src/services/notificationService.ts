import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { db } from '@/src/services/firebaseClient';
import { showLocalNotificationForUser } from '@/src/services/pushNotificationService';
import type { NotificationPriority } from '@/src/types/models';

export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  createdBy?: string;
};

export async function createStaffNotification(input: CreateNotificationInput): Promise<string> {
  const userId = input.userId?.trim();
  if (!userId) throw new Error('Notification userId is required.');
  const title = input.title?.trim();
  const message = input.message?.trim();
  if (!title || !message) throw new Error('Notification title and message are required.');

  const ref = await addDoc(collection(db, firebaseCollections.notifications), {
    userId,
    title,
    message,
    isRead: false,
    priority: input.priority ?? 'medium',
    actionUrl: input.actionUrl?.trim() || null,
    createdBy: input.createdBy?.trim() || null,
    createdAt: serverTimestamp(),
  });

  void showLocalNotificationForUser(userId, title, message).catch(() => undefined);

  return ref.id;
}

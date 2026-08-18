/**
 * cardViewNotificationService.ts
 *
 * When a visitor opens someone's public bio, this fires a push notification
 * to the card owner via Expo Push API — no Firebase Cloud Functions needed.
 *
 * Flow:
 *  1. Look up card owner's expoPushToken from Firestore /users/{userId}
 *  2. POST to https://exp.host/--/api/v2/push/send
 *  3. Card owner gets: "👀 Someone just tapped your card"
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { firebaseCollections } from '@/src/constants/collections';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

async function sendExpoPush(message: ExpoPushMessage): Promise<void> {
  try {
    await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch {
    // Silent fail — notification is non-critical
  }
}

/**
 * Call this when a visitor opens a public bio page.
 * Sends a push notification to the card owner.
 */
export async function notifyCardOwnerOfView(
  ownerUserId: string,
  viewerLabel?: string,
): Promise<void> {
  if (!ownerUserId || ownerUserId === 'guest') return;

  try {
    const userSnap = await getDoc(doc(db, firebaseCollections.users, ownerUserId));
    if (!userSnap.exists()) return;

    const token = userSnap.data()?.expoPushToken as string | undefined;
    if (!token || !token.startsWith('ExponentPushToken[')) return;

    await sendExpoPush({
      to: token,
      title: '👀 Someone viewed your card',
      body: viewerLabel
        ? `${viewerLabel} just opened your AVIO Smart Pass.`
        : 'Someone just tapped and opened your AVIO Smart Pass.',
      sound: 'default',
      priority: 'high',
      data: { screen: 'analytics', event: 'card_view' },
    });
  } catch {
    // Silent fail
  }
}

/**
 * Call this when a visitor saves a contact from the public bio.
 * Stronger signal = more exciting notification.
 */
export async function notifyCardOwnerOfSave(ownerUserId: string): Promise<void> {
  if (!ownerUserId || ownerUserId === 'guest') return;

  try {
    const userSnap = await getDoc(doc(db, firebaseCollections.users, ownerUserId));
    if (!userSnap.exists()) return;

    const token = userSnap.data()?.expoPushToken as string | undefined;
    if (!token || !token.startsWith('ExponentPushToken[')) return;

    await sendExpoPush({
      to: token,
      title: '🤝 New contact saved',
      body: 'Someone saved your contact from your AVIO Smart Pass!',
      sound: 'default',
      priority: 'high',
      data: { screen: 'analytics', event: 'contact_saved' },
    });
  } catch {
    // Silent fail
  }
}

/**
 * Call this when a visitor sends their contact details back via Exchange Contact.
 * High-value alert that notifies the owner of a newly captured warm lead!
 */
export async function notifyCardOwnerOfLeadCapture(
  ownerUserId: string,
  leadName: string,
  company?: string
): Promise<void> {
  if (!ownerUserId || ownerUserId === 'guest') return;

  try {
    const userSnap = await getDoc(doc(db, firebaseCollections.users, ownerUserId));
    if (!userSnap.exists()) return;

    const token = userSnap.data()?.expoPushToken as string | undefined;
    if (!token || !token.startsWith('ExponentPushToken[')) return;

    const companyPart = company?.trim() ? ` from ${company.trim()}` : '';
    await sendExpoPush({
      to: token,
      title: `⚡ New Lead: ${leadName}`,
      body: `${leadName}${companyPart} just shared their contact with you! Tap to view details.`,
      sound: 'default',
      priority: 'high',
      data: { screen: 'connections', event: 'lead_captured' },
    });
  } catch {
    // Silent fail
  }
}

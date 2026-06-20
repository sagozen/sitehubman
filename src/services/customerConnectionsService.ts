import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import type {
  ConnectionAnalytics,
  ConnectedNfcCard,
  ConnectedProfile,
  CustomerConnectionsData,
  DeviceSession,
  LoginHistoryEntry,
  NfcCardConnectionStatus,
  SocialChannel,
  SocialChannelId,
} from '@/src/features/customer/types/connections';
import { getUserProfile } from '@/src/services/authService';
import { updateBioHiddenChannels } from '@/src/services/customerTrialService';
import { db } from '@/src/services/firebaseClient';
import { getBioPage, listOrdersSimple } from '@/src/services/firestoreService';
import { getProfile } from '@/src/services/nfcProfileService';
import type { AppUser, BioPage, Order, Profile } from '@/src/types/models';

const DEVICE_SESSIONS_KEY = 'sitehub_device_sessions_v1';

async function getDeviceLabel(): Promise<string> {
  if (Platform.OS === 'web') return 'Web browser';

  try {
    const Device = await import('expo-device');
    return Device.deviceName || Device.modelName || `${Platform.OS} device`;
  } catch {
    return `${Platform.OS} device`;
  }
}

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return null;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function mapOrderCardStatus(order: Order): NfcCardConnectionStatus {
  if (order.cardStatus === 'frozen' || order.cardStatus === 'closed') return 'inactive';
  if (order.status === 'delivered') return 'active';
  if (
    order.paymentStatus === 'paid'
    || order.paymentStatus === 'paid_verified'
    || order.paymentStatus === 'paid_qr'
    || order.paymentStatus === 'cash_received'
  ) {
    return 'active';
  }
  return 'inactive';
}

function cardDedupKey(card: { cardId: string; publicSlug?: string }): string {
  return (card.publicSlug || card.cardId).trim().toLowerCase();
}

async function registerCurrentDevice(userId: string): Promise<DeviceSession[]> {
  const now = new Date().toISOString();
  const platform =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : Platform.OS === 'web' ? 'web' : 'unknown';
  const deviceName = await getDeviceLabel();
  const sessionId = `${userId}_${platform}_${deviceName}`.slice(0, 64);

  let sessions: DeviceSession[] = [];
  try {
    const raw = await AsyncStorage.getItem(DEVICE_SESSIONS_KEY);
    sessions = raw ? (JSON.parse(raw) as DeviceSession[]) : [];
  } catch {
    sessions = [];
  }

  const current: DeviceSession = {
    id: sessionId,
    label: deviceName,
    platform,
    kind: platform === 'web' ? 'browser' : 'mobile',
    lastActiveAt: now,
    isCurrent: true,
  };

  const others = sessions
    .filter((s) => s.id !== sessionId)
    .map((s) => ({ ...s, isCurrent: false }))
    .slice(0, 8);

  const next = [current, ...others];
  await AsyncStorage.setItem(DEVICE_SESSIONS_KEY, JSON.stringify(next));
  return next;
}

export async function removeDeviceSession(sessionId: string): Promise<DeviceSession[]> {
  try {
    const raw = await AsyncStorage.getItem(DEVICE_SESSIONS_KEY);
    const sessions: DeviceSession[] = raw ? JSON.parse(raw) : [];
    const next = sessions.filter((s) => s.id !== sessionId || s.isCurrent);
    await AsyncStorage.setItem(DEVICE_SESSIONS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/** Reuses `cards`, `orders`, and `nfc_cards` — deduped by card code / slug. */
async function fetchUserCards(userId: string): Promise<ConnectedNfcCard[]> {
  const [cardSnap, orderList, nfcSnap] = await Promise.all([
    getDocs(query(collection(db, firebaseCollections.cards), where('userId', '==', userId), limit(20))).catch(() => null),
    listOrdersSimple('customer', userId).catch(() => [] as Order[]),
    getDocs(query(collection(db, firebaseCollections.nfcCards), where('ownerUserId', '==', userId), limit(20))).catch(() => null),
  ]);

  const cards: ConnectedNfcCard[] = [];
  const seen = new Set<string>();

  const pushCard = (entry: ConnectedNfcCard) => {
    const key = cardDedupKey(entry);
    if (seen.has(key)) return;
    seen.add(key);
    cards.push(entry);
  };

  cardSnap?.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const profile = (data.profile && typeof data.profile === 'object' ? data.profile : {}) as Record<string, unknown>;
    pushCard({
      id: docSnap.id,
      cardId: docSnap.id,
      name: String(profile.fullName ?? data.publicSlug ?? 'NFC Card'),
      status: data.status === 'ordered' || data.status === 'published' ? 'active' : 'inactive',
      lastTapAt: toIso(data.lastTapAt) ?? toIso(data.updatedAt),
      publicSlug: typeof data.publicSlug === 'string' ? data.publicSlug : undefined,
    });
  });

  orderList
    .filter((order) => order.fulfillment === 'physical' || order.productType !== 'ecard')
    .forEach((order) => {
      const safeOrderId = typeof order.id === 'string' ? order.id : '';
      pushCard({
        id: safeOrderId || String(order.cardCode ?? `order_${Date.now()}`),
        cardId: order.cardCode || safeOrderId.slice(0, 8).toUpperCase() || 'UNKNOWN',
        name: order.customerName || 'Physical NFC Card',
        status: mapOrderCardStatus(order),
        lastTapAt: order.updatedAt ?? order.createdAt,
        publicSlug: order.cardCode || undefined,
        orderId: safeOrderId || undefined,
      });
    });

  nfcSnap?.docs.forEach((docSnap) => {
    const data = docSnap.data();
    pushCard({
      id: docSnap.id,
      cardId: String(data.cardCode ?? data.cardId ?? docSnap.id),
      name: `NFC · ${String(data.cardCode ?? docSnap.id).slice(0, 8)}`,
      status: data.status === 'disabled' ? 'inactive' : data.verificationStatus === 'verified' ? 'active' : 'inactive',
      lastTapAt: toIso(data.updatedAt) ?? toIso(data.writtenAt),
      orderId: typeof data.orderId === 'string' ? data.orderId : undefined,
      publicSlug: typeof data.cardCode === 'string' ? data.cardCode : undefined,
    });
  });

  return cards;
}

/** Reuses `tap_events` + `bio_pages` aggregate counters. */
async function fetchTapAnalytics(userId: string, bio: BioPage | null): Promise<ConnectionAnalytics> {
  const bioViews = bio?.views ?? 0;
  const bioTaps = bio?.taps ?? 0;

  let tapEvents: { source?: string; createdAt?: string; device?: string }[] = [];
  try {
    const snap = await getDocs(
      query(
        collection(db, firebaseCollections.tapEvents),
        where('profileId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100),
      ),
    );
    tapEvents = snap.docs.map((d) => d.data());
  } catch {
    // Missing composite index — fall back to bio counters.
  }

  const nfcTaps = tapEvents.filter((e) => e.source === 'interaction' || e.source === 'nfc_card').length || bioTaps;
  const qrScans = tapEvents.filter((e) => e.source === 'slug').length;
  const views = tapEvents.filter((e) => e.source === 'view').length || bioViews;
  const devices = new Set(tapEvents.map((e) => e.device).filter(Boolean));

  const lastActivityAt =
    tapEvents[0]?.createdAt
      ? toIso(tapEvents[0].createdAt)
      : bioTaps > 0 || bioViews > 0
        ? new Date().toISOString()
        : null;

  return {
    totalNfcTaps: nfcTaps,
    totalQrScans: qrScans,
    totalProfileViews: views,
    uniqueVisitors: devices.size || (views > 0 ? Math.max(1, Math.floor(views * 0.6)) : 0),
    lastActivityAt,
  };
}

function linkFromCustomLinks(links: { label: string; url: string }[], pattern: RegExp): string {
  return links.find((l) => pattern.test(l.label) || pattern.test(l.url))?.url ?? '';
}

/** Reuses `users`, `bio_pages`, and `profiles` — toggles stored on `bio_pages.hiddenChannels`. */
function buildSocialChannels(
  user: AppUser,
  bio: BioPage | null,
  profile: Profile | null,
): SocialChannel[] {
  const hidden = new Set(bio?.hiddenChannels ?? []);
  const customLinks = bio?.customLinks ?? profile?.links ?? [];
  const website =
    linkFromCustomLinks(customLinks, /website|site|url/i)
    || (bio?.customLinks?.[0]?.url ?? '');
  const facebook = linkFromCustomLinks(customLinks, /facebook|fb/i);
  const linkedin = linkFromCustomLinks(customLinks, /linkedin/i);

  const channels: (Omit<SocialChannel, 'enabled'> & { defaultOn: boolean })[] = [
    { id: 'phone', label: 'Phone', value: user.phone ?? bio?.whatsapp ?? profile?.phone ?? '', icon: 'Phone', defaultOn: true },
    { id: 'email', label: 'Email', value: user.email ?? bio?.email ?? profile?.email ?? '', icon: 'Mail', defaultOn: true },
    { id: 'website', label: 'Website', value: website, icon: 'Link', defaultOn: Boolean(website) },
    { id: 'whatsapp', label: 'WhatsApp', value: bio?.whatsapp ?? profile?.whatsapp ?? '', icon: 'Share', defaultOn: Boolean(bio?.whatsapp ?? profile?.whatsapp) },
    { id: 'facebook', label: 'Facebook', value: facebook, icon: 'Users', defaultOn: Boolean(facebook) },
    { id: 'instagram', label: 'Instagram', value: bio?.instagram ?? profile?.instagram ?? '', icon: 'ExternalLink', defaultOn: Boolean(bio?.instagram ?? profile?.instagram) },
    { id: 'linkedin', label: 'LinkedIn', value: linkedin, icon: 'Link', defaultOn: Boolean(linkedin) },
    { id: 'telegram', label: 'Telegram', value: bio?.telegram ?? profile?.telegram ?? '', icon: 'Share', defaultOn: Boolean(bio?.telegram ?? profile?.telegram) },
  ];

  return channels.map((ch) => ({
    id: ch.id,
    label: ch.label,
    value: ch.value,
    icon: ch.icon,
    enabled: hidden.has(ch.id) ? false : ch.defaultOn && Boolean(ch.value.trim()),
  }));
}

/** Reuses `bio_pages` + `profiles` mirror — no synthetic duplicates. */
function buildProfiles(bio: BioPage | null, profile: Profile | null, orders: Order[]): ConnectedProfile[] {
  const slug = bio?.slug ?? bio?.publicSlug ?? profile?.publicSlug ?? null;
  const published = bio?.status === 'active' || bio?.status === 'trial' || profile?.isPublished === true;
  const views = bio?.views ?? profile?.views ?? 0;
  const companyName = orders.find((o) => o.company?.trim())?.company?.trim();

  const rows: ConnectedProfile[] = [
    {
      id: 'personal',
      type: 'personal',
      title: 'Personal Profile',
      subtitle: bio?.displayName ? `${bio.displayName} · tap-to-open` : 'Your public NFC identity',
      slug,
      isPublished: published,
      views,
    },
  ];

  if (companyName || bio?.tagline) {
    rows.push({
      id: 'business',
      type: 'business',
      title: 'Business Profile',
      subtitle: companyName || bio?.tagline || 'Professional links on your card',
      slug,
      isPublished: published,
      views,
    });
  }

  rows.push({
    id: 'team',
    type: 'team',
    title: 'Team Profile',
    subtitle: 'Shared brand page — contact sales to enable',
    slug: null,
    isPublished: false,
    views: 0,
  });

  return rows;
}

function buildDeviceSessions(localSessions: DeviceSession[]): DeviceSession[] {
  return localSessions;
}

function buildLoginHistory(
  user: AppUser,
  firestoreUser: AppUser | null,
  deviceLabel: string,
): LoginHistoryEntry[] {
  const at = firestoreUser?.lastLoginAt || user.lastLoginAt || user.updatedAt || user.createdAt;
  return [
    {
      id: 'current',
      device: `${Platform.OS} · ${deviceLabel}`,
      location: user.branch || firestoreUser?.branch || 'Cambodia',
      at,
      success: true,
    },
  ];
}

export async function saveChannelToggle(
  userId: string,
  channelId: SocialChannelId,
  enabled: boolean,
  currentHidden: SocialChannelId[],
): Promise<SocialChannelId[]> {
  const hidden = new Set(currentHidden);
  if (enabled) {
    hidden.delete(channelId);
  } else {
    hidden.add(channelId);
  }
  const next = [...hidden];
  await updateBioHiddenChannels(userId, next);
  return next;
}

export async function getCustomerConnectionsData(user: AppUser): Promise<CustomerConnectionsData> {
  const [bio, profile, firestoreUser, localDevices, cards, orders, deviceLabel] = await Promise.all([
    getBioPage(user.id),
    getProfile(user.id),
    getUserProfile(user.id).catch(() => null),
    registerCurrentDevice(user.id),
    fetchUserCards(user.id),
    listOrdersSimple('customer', user.id).catch(() => [] as Order[]),
    getDeviceLabel(),
  ]);

  const analytics = await fetchTapAnalytics(user.id, bio);
  const hiddenChannels = (bio?.hiddenChannels ?? []) as SocialChannelId[];

  return {
    cards,
    profiles: buildProfiles(bio, profile, orders),
    socialChannels: buildSocialChannels(user, bio, profile),
    devices: buildDeviceSessions(localDevices),
    analytics,
    loginHistory: buildLoginHistory(user, firestoreUser, deviceLabel),
    trialEndsAt: firestoreUser?.trialEndsAt ?? user.trialEndsAt ?? null,
    hiddenChannels,
  };
}

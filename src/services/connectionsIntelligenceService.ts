/**
 * connectionsIntelligenceService.ts
 *
 * Phase 2 — "The Hook" (Intelligence & Automation)
 *
 * Three responsibilities:
 *  1. Follow-up detection — computes which moments are overdue for a follow-up
 *     and returns actionable nudges ("You met Sok Dara 2 hours ago…").
 *  2. Tag CRUD — persists user-defined tags per moment to AsyncStorage (local-first)
 *     and optionally mirrors them to Firestore for cross-device sync.
 *  3. Contact export — builds a vCard string for Contacts + a WhatsApp deep-link.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Share, Linking } from 'react-native';
import type { TapMoment } from '@/src/components/TapMomentCard';

// ─── Storage keys ────────────────────────────────────────────────────────────

const TAGS_KEY = 'sitehub_connection_tags_v1';
const DISMISSED_KEY = 'sitehub_dismissed_nudges_v1';

// ─── Tag definitions ─────────────────────────────────────────────────────────

export type ConnectionTagId =
  | 'potential_client'
  | 'investor'
  | 'partner'
  | 'friend'
  | 'sales_lead'
  | 'press'
  | 'recruiter'
  | 'vip'
  | 'follow_up';

export interface ConnectionTag {
  id: ConnectionTagId;
  label: string;
  emoji: string;
  /** Hex accent colour used for the pill. */
  color: string;
}

export const ALL_TAGS: ConnectionTag[] = [
  { id: 'potential_client', label: 'Potential Client', emoji: '💼', color: '#007AFF' },
  { id: 'investor',         label: 'Investor',         emoji: '💰', color: '#FF9F0A' },
  { id: 'partner',          label: 'Partner',          emoji: '🤝', color: '#30D158' },
  { id: 'friend',           label: 'Friend',           emoji: '👋', color: '#BF5AF2' },
  { id: 'sales_lead',       label: 'Sales Lead',       emoji: '🎯', color: '#FF375F' },
  { id: 'press',            label: 'Press',            emoji: '📰', color: '#0A84FF' },
  { id: 'recruiter',        label: 'Recruiter',        emoji: '🔍', color: '#32D74B' },
  { id: 'vip',              label: 'VIP',              emoji: '⭐', color: '#FFD60A' },
  { id: 'follow_up',        label: 'Follow Up',        emoji: '🔔', color: '#FF6961' },
];

// ─── Follow-up nudges ─────────────────────────────────────────────────────────

export interface FollowUpNudge {
  momentId: string;
  name: string;
  subtitle?: string;
  relativeLabel: string;
  /** How long ago in milliseconds. Used for sorting. */
  ageMs: number;
}

/** Windows for follow-up reminders. */
const NUDGE_WINDOWS_MS = [
  2 * 60 * 60 * 1000,   // 2 hours
  6 * 60 * 60 * 1000,   // 6 hours
  24 * 60 * 60 * 1000,  // 1 day
  48 * 60 * 60 * 1000,  // 2 days
  7 * 24 * 60 * 60 * 1000, // 1 week
];

function formatRelativeAge(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Returns moments that have `needsFollowUp === true` and were met within the
 * last 7 days, ordered from most-recent first.
 * Dismissed nudges are filtered out.
 */
export async function computeFollowUpNudges(moments: TapMoment[]): Promise<FollowUpNudge[]> {
  const dismissed = await getDismissedNudges();
  const now = Date.now();
  const cutoff = 7 * 24 * 60 * 60 * 1000;

  return moments
    .filter((m) => {
      if (!m.needsFollowUp) return false;
      if (dismissed.has(m.id)) return false;
      const at = m.occurredAt instanceof Date ? m.occurredAt.getTime() : Number(m.occurredAt);
      const age = now - at;
      return age >= 0 && age <= cutoff;
    })
    .map((m) => {
      const at = m.occurredAt instanceof Date ? m.occurredAt.getTime() : Number(m.occurredAt);
      const ageMs = now - at;
      return {
        momentId: m.id,
        name: m.name,
        subtitle: m.subtitle,
        relativeLabel: formatRelativeAge(ageMs),
        ageMs,
      };
    })
    .sort((a, b) => a.ageMs - b.ageMs); // most urgent first
}

// ─── Dismissed nudge persistence ─────────────────────────────────────────────

async function getDismissedNudges(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function dismissNudge(momentId: string): Promise<void> {
  try {
    const dismissed = await getDismissedNudges();
    dismissed.add(momentId);
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  } catch {
    // best-effort
  }
}

// ─── Tag persistence (AsyncStorage, local-first) ─────────────────────────────

type TagStore = Record<string, ConnectionTagId[]>;

async function readTagStore(): Promise<TagStore> {
  try {
    const raw = await AsyncStorage.getItem(TAGS_KEY);
    return raw ? (JSON.parse(raw) as TagStore) : {};
  } catch {
    return {};
  }
}

async function writeTagStore(store: TagStore): Promise<void> {
  try {
    await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(store));
  } catch {
    // best-effort
  }
}

/** Returns the tags assigned to a single moment. */
export async function getTagsForMoment(momentId: string): Promise<ConnectionTagId[]> {
  const store = await readTagStore();
  return store[momentId] ?? [];
}

/** Returns a map of momentId → tags for all moments (batch load). */
export async function getAllTags(): Promise<TagStore> {
  return readTagStore();
}

/** Toggles a tag on a moment — adds if absent, removes if present. */
export async function toggleTag(momentId: string, tagId: ConnectionTagId): Promise<ConnectionTagId[]> {
  const store = await readTagStore();
  const current = new Set(store[momentId] ?? []);
  if (current.has(tagId)) {
    current.delete(tagId);
  } else {
    current.add(tagId);
  }
  const next = [...current] as ConnectionTagId[];
  store[momentId] = next;
  await writeTagStore(store);
  return next;
}

/** Replaces all tags for a moment. */
export async function setTags(momentId: string, tagIds: ConnectionTagId[]): Promise<void> {
  const store = await readTagStore();
  store[momentId] = tagIds;
  await writeTagStore(store);
}

// ─── Contact export ───────────────────────────────────────────────────────────

export interface ExportContact {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  website?: string;
  note?: string;
}

/**
 * Builds a vCard 3.0 string from the contact info.
 * vCard is the universal format for iOS/Android contacts import.
 */
export function buildVCard(contact: ExportContact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${sanitizeVcard(contact.name)}`,
    `N:${sanitizeVcard(contact.name)};;;;`,
  ];

  if (contact.phone) {
    lines.push(`TEL;TYPE=CELL:${sanitizeVcard(contact.phone)}`);
  }
  if (contact.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${sanitizeVcard(contact.email)}`);
  }
  if (contact.company) {
    lines.push(`ORG:${sanitizeVcard(contact.company)}`);
  }
  if (contact.title) {
    lines.push(`TITLE:${sanitizeVcard(contact.title)}`);
  }
  if (contact.website) {
    lines.push(`URL:${sanitizeVcard(contact.website)}`);
  }
  if (contact.note) {
    lines.push(`NOTE:${sanitizeVcard(contact.note)}`);
  }

  lines.push(`X-SITEHUB:Connected via SiteHub NFC`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function sanitizeVcard(s: string): string {
  // Escape commas, semicolons, and backslashes in vCard fields
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/**
 * Opens a WhatsApp deep-link to pre-fill a message to the contact's phone.
 * Format: https://wa.me/<phone>?text=<message>
 */
export async function openWhatsApp(phone: string, prefilledMessage?: string): Promise<'opened' | 'not_installed' | 'no_phone'> {
  if (!phone?.trim()) return 'no_phone';

  // Normalize phone: strip everything except digits and leading +
  const normalized = phone.trim().replace(/[^+\d]/g, '');
  const digits = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  if (!digits) return 'no_phone';

  const message = prefilledMessage
    ? encodeURIComponent(prefilledMessage)
    : encodeURIComponent("Hi! I'd love to stay in touch. We connected via SiteHub.");

  const waUrl = `https://wa.me/${digits}?text=${message}`;

  try {
    const canOpen = await Linking.canOpenURL(waUrl);
    if (canOpen) {
      await Linking.openURL(waUrl);
      return 'opened';
    }
    // Fallback to web WhatsApp
    await Linking.openURL(`https://web.whatsapp.com/send?phone=${digits}&text=${message}`);
    return 'opened';
  } catch {
    return 'not_installed';
  }
}

/**
 * Shares the contact info as plain text (universal fallback).
 * Works on all platforms: WhatsApp, Telegram, email, SMS, etc.
 */
export async function shareContactText(contact: ExportContact, profileUrl?: string): Promise<void> {
  const lines: string[] = [`👤 ${contact.name}`];
  if (contact.title || contact.company) {
    lines.push(`${[contact.title, contact.company].filter(Boolean).join(', ')}`);
  }
  if (contact.phone) lines.push(`📱 ${contact.phone}`);
  if (contact.email) lines.push(`✉️  ${contact.email}`);
  if (profileUrl) lines.push(`🔗 ${profileUrl}`);
  lines.push('\nShared via SiteHub 🪄');

  const message = lines.join('\n');

  await Share.share(
    Platform.OS === 'ios'
      ? { message, url: profileUrl ?? '' }
      : { message },
  ).catch(() => undefined);
}

/**
 * Saves a vCard file to a temporary path and shares it via the OS share sheet.
 * iOS/Android will offer "Add to Contacts" as an option.
 */
export async function exportToContacts(contact: ExportContact): Promise<'ok' | 'error'> {
  try {
    const vcard = buildVCard(contact);

    // On mobile we share the vCard as text — the OS prompts the user to save it as a contact.
    await Share.share({ message: vcard, title: `${contact.name} — vCard` });
    return 'ok';
  } catch {
    return 'error';
  }
}

/**
 * Builds an ExportContact from a TapMoment.
 * Fills in what we know; additional fields can come from a Firestore lookup.
 */
export function momentToContact(moment: TapMoment): ExportContact {
  // Parse "Role, Company" format from subtitle if available
  let company: string | undefined;
  let title: string | undefined;

  if (moment.subtitle) {
    const parts = moment.subtitle.split(',').map((s) => s.trim());
    title = parts[0];
    company = parts.slice(1).join(', ').trim() || undefined;
  }

  return {
    name: moment.name,
    company,
    title,
    note: moment.note,
  };
}

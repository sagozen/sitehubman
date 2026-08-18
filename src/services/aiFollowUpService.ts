/**
 * aiFollowUpService.ts
 *
 * AI 1-Tap Follow-Up Writer & Icebreaker Engine.
 * Generates tailored executive follow-up messages across 3 distinct tones:
 *  1. Casual Coffee Catch-up
 *  2. Executive Partnership
 *  3. Quick WhatsApp/Telegram Ping
 */
import { Linking, Platform } from 'react-native';

export type FollowUpTone = 'coffee' | 'partnership' | 'quick';

export interface FollowUpOption {
  tone: FollowUpTone;
  title: string;
  emoji: string;
  subject: string;
  message: string;
}

export function generateAiFollowUps(input: {
  recipientName: string;
  senderName?: string;
  company?: string;
  note?: string;
  eventName?: string;
}): FollowUpOption[] {
  const firstName = input.recipientName.trim().split(' ')[0] || 'there';
  const myName = input.senderName?.trim() || 'me';
  const companyMention = input.company?.trim() ? ` at ${input.company.trim()}` : '';
  const noteContext = input.note?.trim() ? ` regarding ${input.note.trim()}` : '';

  return [
    {
      tone: 'coffee',
      title: 'Casual Coffee Chat',
      emoji: '☕',
      subject: `Great connecting with you, ${firstName}!`,
      message: `Hey ${firstName}, great meeting you${companyMention}! Really enjoyed our conversation${noteContext}. Would love to grab a coffee sometime next week to catch up properly. Let me know when suits! — ${myName}`,
    },
    {
      tone: 'partnership',
      title: 'Executive Collaboration',
      emoji: '💼',
      subject: `Following up from our conversation — ${myName}`,
      message: `Hi ${firstName},\n\nIt was a pleasure speaking with you${companyMention}. I wanted to follow up on our discussion${noteContext} and explore how we might collaborate together. Let's schedule a brief 15-minute call this week.\n\nBest regards,\n${myName}`,
    },
    {
      tone: 'quick',
      title: 'Quick Ping',
      emoji: '⚡',
      subject: `Connecting — ${myName}`,
      message: `Hey ${firstName}! Saved your contact via AVIO. Great connecting${companyMention} — let's stay in touch!`,
    },
  ];
}

export function openWhatsAppFollowUp(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(text)}`;
  return Linking.openURL(url).catch(() => undefined);
}

export function openEmailFollowUp(email: string, subject: string, body: string) {
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return Linking.openURL(url).catch(() => undefined);
}

export function openTelegramFollowUp(handle: string, text: string) {
  const cleanHandle = handle.replace('@', '');
  const url = `https://t.me/${cleanHandle}?text=${encodeURIComponent(text)}`;
  return Linking.openURL(url).catch(() => undefined);
}

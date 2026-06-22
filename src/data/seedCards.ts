/**
 * Seed cards used by the Customer profile carousel.
 *
 * Mirrors the demo customer from `scripts/seed-demo-data.mjs` and adds
 * two additional identities so the carousel shows multiple cards plus
 * the "+ Add card" skeleton.
 *
 * The card set intentionally spans roles (personal / work / creator /
 * community) so users see the value of stacking identities instead of
 * juggling them in chat threads.
 *
 * Replace with a Firestore query on `cards` collection once available.
 */

import type { CarouselCard } from '@/src/components/CardStackCarousel';

export interface SeedCardRole {
  /** Short, kebab-case label shown in copy. */
  id: 'personal' | 'work' | 'creator' | 'community';
  /** Display label. */
  label: string;
}

export const SEED_CARDS: CarouselCard[] = [
  {
    id: 'card-primary',
    role: 'personal',
    fullName: 'Pisey Roath',
    title: 'Marketing Lead · Smart Axiata',
    phone: '+855 12 555 101',
    email: 'pisey@sitehub.app',
    website: 'sitehub.app/pisey',
    profileUrl: 'https://sitehub.app/pisey',
    cardId: 'BC-NFC_4F8A',
    isPrimary: true,
  },
  {
    id: 'card-business',
    role: 'work',
    fullName: 'Pisey Roath',
    title: 'Founder · Mekong Labs',
    phone: '+855 12 555 101',
    email: 'hi@mekonglabs.io',
    website: 'mekonglabs.io',
    profileUrl: 'https://mekonglabs.io/pisey',
    cardId: 'BC-NFC_7C2D',
  },
  {
    id: 'card-creator',
    role: 'creator',
    fullName: 'P Roath',
    title: 'Indie Maker / Newsletter',
    phone: '+855 12 555 101',
    email: 'p@indie.kh',
    website: 'indie.kh',
    profileUrl: 'https://indie.kh/p',
    cardId: 'BC-NFC_9B11',
  },
  {
    id: 'card-community',
    role: 'community',
    fullName: 'Pisey Roath',
    title: 'Mentor · Kirirom Tech',
    phone: '+855 12 555 101',
    email: 'mentor@kirirom.tech',
    website: 'kirirom.tech/pisey',
    profileUrl: 'https://kirirom.tech/pisey',
    cardId: 'BC-NFC_2E5F',
  },
];

/** Subset of card roles surfaced in copy (e.g. onboarding nudges). */
export const SEED_CARD_ROLES: SeedCardRole[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'creator', label: 'Creator' },
  { id: 'community', label: 'Community' },
];

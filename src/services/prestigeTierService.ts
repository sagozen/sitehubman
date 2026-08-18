/**
 * prestigeTierService.ts
 *
 * Executive Prestige Tier Engine for AVIO Smart Pass.
 *
 * Tiers:
 *  - Tier 1: Slate Obsidian (0 - 4 connections)
 *  - Tier 2: Brushed Titanium (5 - 24 connections)
 *  - Tier 3: 24K Heritage Gold (25+ connections)
 */

export type PrestigeTierId = 'slate' | 'titanium' | 'gold';

export interface PrestigeTier {
  id: PrestigeTierId;
  name: string;
  badge: string;
  color: string;
  bgGradient: [string, string];
  minConnections: number;
  perks: string[];
}

export const PRESTIGE_TIERS: Record<PrestigeTierId, PrestigeTier> = {
  slate: {
    id: 'slate',
    name: 'Slate Obsidian',
    badge: '⚫',
    color: '#8E8E93',
    bgGradient: ['#1C1C1E', '#121214'],
    minConnections: 0,
    perks: ['Unlimited NFC Taps', 'Digital Apple Wallet Pass', 'Basic Tap Analytics'],
  },
  titanium: {
    id: 'titanium',
    name: 'Brushed Titanium',
    badge: '🪙',
    color: '#E5E5EA',
    bgGradient: ['#2C2C2E', '#1C1C1E'],
    minConnections: 5,
    perks: ['AI Follow-Up Generator', 'Priority Tap Radar', 'Custom Vanity Slug'],
  },
  gold: {
    id: 'gold',
    name: '24K Heritage Gold',
    badge: '👑',
    color: '#FFD60A',
    bgGradient: ['#3A2E0E', '#1C1604'],
    minConnections: 25,
    perks: ['VIP Concierge Support', 'Laser-Engraved Metal Card Access', 'Team CRM Sync'],
  },
};

export interface UserPrestigeStats {
  currentTier: PrestigeTier;
  nextTier: PrestigeTier | null;
  connectionsCount: number;
  connectionsToNextTier: number;
  progressPercent: number;
}

export function computeUserPrestige(connectionsCount: number = 0): UserPrestigeStats {
  const count = Math.max(0, connectionsCount);

  if (count >= 25) {
    return {
      currentTier: PRESTIGE_TIERS.gold,
      nextTier: null,
      connectionsCount: count,
      connectionsToNextTier: 0,
      progressPercent: 100,
    };
  }

  if (count >= 5) {
    const range = 25 - 5;
    const current = count - 5;
    const progress = Math.min(100, Math.round((current / range) * 100));
    return {
      currentTier: PRESTIGE_TIERS.titanium,
      nextTier: PRESTIGE_TIERS.gold,
      connectionsCount: count,
      connectionsToNextTier: 25 - count,
      progressPercent: progress,
    };
  }

  const range = 5;
  const progress = Math.min(100, Math.round((count / range) * 100));
  return {
    currentTier: PRESTIGE_TIERS.slate,
    nextTier: PRESTIGE_TIERS.titanium,
    connectionsCount: count,
    connectionsToNextTier: 5 - count,
    progressPercent: progress,
  };
}

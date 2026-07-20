import type { TapMoment, TapMomentSource } from '@/src/components/TapMomentCard';

/**
 * Seed tap moments used by the Connections timeline.
 *
 * Mirrors the style of the Firebase demo seed (Cambodian tech/business scene)
 * so the timeline feels like real activity from real people, not placeholder
 * lorem-ipsum.
 *
 * Replace this module's export with a Firestore query once the per-event
 * `tap_events` collection is available - the shape is identical.
 *
 * The dataset intentionally spans multiple roles (customers, sales reps,
 * partners, printers) so the timeline never looks like a single person's
 * activity bubble.
 */

export type MomentRole = 'customer' | 'sales' | 'partner' | 'printer' | 'press' | 'investor';

interface SeedSpec {
  id: string;
  name: string;
  role?: string;
  /** Account role that helps the UI bucket the moment for analytics. */
  momentRole?: MomentRole;
  slug: string;
  source: TapMomentSource;
  hoursAgo: number;
  needsFollowUp?: boolean;
  note?: string;
  /** True for moments that came from the user's own outbound sharing. */
  outbound?: boolean;
}

const SEED_SPECS: SeedSpec[] = [
  // ── Today ────────────────────────────────────────────────────────────────
  { id: 'sm-01', name: 'Sok Dara',        role: 'Founder, Mekong Labs',          slug: 'sok-dara',     source: 'nfc',   hoursAgo: 0.4, needsFollowUp: true,  momentRole: 'partner',  note: 'Wants a Series A intro to Sequoia SEA' },
  { id: 'sm-02', name: 'Chan Thea',       role: 'Sales lead, Wing',              slug: 'chan-thea',    source: 'qr',    hoursAgo: 1.2, momentRole: 'sales' },
  { id: 'sm-03', name: 'Bopha Chen',      role: 'Designer, Phnom Penh',          slug: 'bopha',        source: 'nfc',   hoursAgo: 2.5, momentRole: 'customer', outbound: true, note: 'Discussed brand refresh + metal card' },
  { id: 'sm-04', name: 'Rithy Mean',      role: 'Indie maker',                   slug: 'rithy',        source: 'share', hoursAgo: 3.6, momentRole: 'customer' },
  { id: 'sm-05', name: 'Vanna Ly',        role: 'PM at Kirirom Institute',       slug: 'vanna',        source: 'view',  hoursAgo: 5.1 },
  { id: 'sm-06', name: 'Pisey Roath',     role: 'Marketing, Smart Axiata',       slug: 'pisey-r',      source: 'qr',    hoursAgo: 6.8, momentRole: 'sales', outbound: true },
  { id: 'sm-07', name: 'Theara Mok',      role: 'Engineer, ANZ Royal',           slug: 'theara',       source: 'view',  hoursAgo: 8.7 },
  { id: 'sm-08', name: 'Visal Sao',       role: 'Partner, Nexus Ventures',       slug: 'visal',        source: 'nfc',   hoursAgo: 10.2, needsFollowUp: true, momentRole: 'partner', note: 'Looking at our portfolio deck' },

  // ── Yesterday ────────────────────────────────────────────────────────────
  { id: 'sm-09', name: 'Lina Soth',       role: 'Investor, Mekong Capital',      slug: 'lina-soth',    source: 'nfc',   hoursAgo: 24, needsFollowUp: true, momentRole: 'investor', note: 'Asked about your SaaS pricing' },
  { id: 'sm-10', name: 'Rathanak Phal',   role: 'Brand lead, Sastra',            slug: 'rathanak',     source: 'qr',    hoursAgo: 27, momentRole: 'sales' },
  { id: 'sm-11', name: 'Maly Sun',        role: 'Founder, Pleng',                slug: 'maly',         source: 'view',  hoursAgo: 30, momentRole: 'partner' },
  { id: 'sm-12', name: 'Sreylin Pich',    role: 'Tour ops, Bayon Tours',         slug: 'sreylin',      source: 'nfc',   hoursAgo: 33, momentRole: 'customer' },
  { id: 'sm-13', name: 'Pisach Heng',     role: 'Photographer',                  slug: 'pisach',       source: 'link',  hoursAgo: 36, momentRole: 'press' },
  { id: 'sm-14', name: 'Kanha Em',        role: 'Studio director',               slug: 'kanha',        source: 'qr',    hoursAgo: 40, momentRole: 'customer', outbound: true },

  // ── This week (2-7 days) ─────────────────────────────────────────────────
  { id: 'sm-15', name: 'Sothea Ros',      role: 'BD, Cellcard',                  slug: 'sothea-r',     source: 'nfc',   hoursAgo: 48, momentRole: 'sales' },
  { id: 'sm-16', name: 'Chenda Lay',      role: 'Recruiter, Newton',             slug: 'chenda',       source: 'qr',    hoursAgo: 62, needsFollowUp: true, note: 'Send CV by Friday' },
  { id: 'sm-17', name: 'Tola Pich',       role: 'Co-founder, HUSK',              slug: 'tola',         source: 'view',  hoursAgo: 78, momentRole: 'partner' },
  { id: 'sm-18', name: 'Kunthea Yim',     role: 'Lecturer, RUPP',                slug: 'kunthea',      source: 'share', hoursAgo: 96, momentRole: 'press' },
  { id: 'sm-19', name: 'Borey Heng',      role: 'Logistics, J&T',                slug: 'borey',        source: 'nfc',   hoursAgo: 108, momentRole: 'customer' },
  { id: 'sm-20', name: 'Sokhom Noun',     role: 'Coach, Sabay',                  slug: 'sokhom',       source: 'view',  hoursAgo: 138, momentRole: 'press' },
  { id: 'sm-21', name: 'Pav Vuthy',       role: 'Editor, Khmer Times',           slug: 'pav',          source: 'qr',    hoursAgo: 156, momentRole: 'press' },
  { id: 'sm-22', name: 'Sela Mok',        role: 'Sales agent, Smart',            slug: 'sela',         source: 'nfc',   hoursAgo: 168, momentRole: 'sales', outbound: true },

  // ── Last 30 days ─────────────────────────────────────────────────────────
  { id: 'sm-23', name: 'Sophy Chea',      role: 'Consultant, Deloitte',          slug: 'sophy',        source: 'nfc',   hoursAgo: 9 * 24, momentRole: 'customer' },
  { id: 'sm-24', name: 'Rith Panha',      role: 'Architect, CKHA',               slug: 'rith-panha',   source: 'qr',    hoursAgo: 12 * 24, momentRole: 'customer' },
  { id: 'sm-25', name: 'Mina Tan',        role: 'Singer-songwriter',             slug: 'mina',         source: 'view',  hoursAgo: 16 * 24, momentRole: 'press' },
  { id: 'sm-26', name: 'Dara Pich',       role: 'Crypto, Riddle',                slug: 'dara-pich',    source: 'nfc',   hoursAgo: 21 * 24, momentRole: 'partner' },
  { id: 'sm-27', name: 'Veasna Chhum',    role: 'Pilot, Lanmei Airlines',        slug: 'veasna',       source: 'share', hoursAgo: 26 * 24, momentRole: 'customer' },
  { id: 'sm-28', name: 'Bunnarith Phal',  role: 'Sales manager, ABA',            slug: 'bunna',        source: 'nfc',   hoursAgo: 28 * 24, momentRole: 'sales' },

  // ── Older ────────────────────────────────────────────────────────────────
  { id: 'sm-29', name: 'Kimlay Hong',     role: 'Recruiter, Pathmazing',         slug: 'kimlay',       source: 'view',  hoursAgo: 35 * 24 },
  { id: 'sm-30', name: 'Panha Sok',       role: 'Founder, KohPich',              slug: 'panha',        source: 'qr',    hoursAgo: 42 * 24, momentRole: 'partner' },
  { id: 'sm-31', name: 'Malyka Chea',     role: 'Marketing, Prince Bank',        slug: 'malyka',       source: 'nfc',   hoursAgo: 51 * 24, momentRole: 'sales' },
  { id: 'sm-32', name: 'Sokunthea Lay',   role: 'Tour guide, Angkor',            slug: 'sokunthea',    source: 'view',  hoursAgo: 64 * 24 },
  { id: 'sm-33', name: 'Rithya Chan',     role: 'Co-founder, Bokor',             slug: 'rithya',       source: 'link',  hoursAgo: 78 * 24, momentRole: 'partner' },
  { id: 'sm-34', name: 'Pisey Keo',       role: 'Customer',                      slug: 'pisey-keo',    source: 'nfc',   hoursAgo: 92 * 24, momentRole: 'customer' },
  { id: 'sm-35', name: 'Dany Tep',        role: 'Partner, ORB',                  slug: 'dany',         source: 'qr',    hoursAgo: 110 * 24, momentRole: 'partner' },
  { id: 'sm-36', name: 'Sokha Eng',       role: 'Customer',                      slug: 'sokha',        source: 'view',  hoursAgo: 130 * 24, momentRole: 'customer' },
];

function toMoment(spec: SeedSpec): TapMoment {
  return {
    id: spec.id,
    name: spec.name,
    subtitle: spec.role,
    initial: spec.name[0],
    source: spec.source,
    occurredAt: new Date(Date.now() - spec.hoursAgo * 60 * 60 * 1000),
    needsFollowUp: spec.needsFollowUp,
    note: spec.note,
  };
}

/** All seed moments sorted newest first - pre-sorted once at module load. */
export const SEED_MOMENTS: TapMoment[] = SEED_SPECS.map(toMoment).sort(
  (a, b) => toMs(b.occurredAt) - toMs(a.occurredAt),
);

/**
 * Pre-formatted relative-time string for each moment.
 * Computed once at module load instead of on every render.
 */
export const SEED_MOMENT_LABELS: Record<string, string> = SEED_SPECS.reduce(
  (acc, spec) => {
    const occurred = new Date(Date.now() - spec.hoursAgo * 60 * 60 * 1000);
    acc[`seed-${spec.id}`] = formatRelativeMs(occurred.getTime());
    return acc;
  },
  {} as Record<string, string>,
);

function formatRelativeMs(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(ms).toLocaleDateString();
}

/** Slug-to-name lookup so detail views can fetch the public slug URL. */
export function getSeedSlugForMoment(id: string): string | null {
  const spec = SEED_SPECS.find((s) => s.id === id);
  return spec ? spec.slug : null;
}

/** Build a full slug URL for a seed moment. Returns null if not a seed moment. */
export function getSeedSlugUrl(id: string, host: string): string | null {
  const slug = getSeedSlugForMoment(id);
  if (!slug) return null;
  const trimmedHost = host.replace(/\/+$/, '');
  return `${trimmedHost}/${slug}`;
}

/** Aggregate counts derived from the seed so analytics stays in sync. */
export function buildSeedAnalytics() {
  const bySource: Record<TapMomentSource, number> = {
    nfc: 0,
    qr: 0,
    view: 0,
    share: 0,
    link: 0,
  };
  for (const spec of SEED_SPECS) {
    bySource[spec.source] += 1;
  }
  const uniqueIds = new Set(SEED_SPECS.map((s) => s.id));
  return {
    totalNfcTaps: bySource.nfc,
    totalQrScans: bySource.qr,
    totalProfileViews: bySource.view + bySource.share + bySource.link,
    uniqueVisitors: uniqueIds.size,
    lastActivityAt: new Date(Date.now() - 0.4 * 60 * 60 * 1000).toISOString(),
  };
}

function toMs(input: Date | number | string): number {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') return input;
  return new Date(input).getTime();
}

export { SEED_SPECS };

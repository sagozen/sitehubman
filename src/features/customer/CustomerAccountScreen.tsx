/**
 * CustomerAccountScreen — Card-first home.
 * Quiet profile header, hero card, single share CTA, and an IconFlowHub
 * action row that mirrors the guest home page (no boxed grid).
 * Activity feed falls back to seed moments so first-time customers
 * see real-looking content instead of an empty state.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { IconFlowHub } from '@/src/components/IconFlowHub';
import { appRoutes } from '@/src/constants/navigation';
import { firebaseCollections } from '@/src/constants/collections';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useNotifications } from '@/src/hooks/useNotifications';
import { db } from '@/src/services/firebaseClient';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { SEED_MOMENTS } from '@/src/data/seedMoments';
import { CUSTOMER_FLOWS, type CustomerFlowDefinition } from '@/src/constants/customerFlows';
import type { TapEvent } from '@/src/types/models';

const BRAND = '#2596BE';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const MUTED2 = '#6E6E73';
const SURFACE = '#FFFFFF';
const BG = '#F5F5F7';
const HAIRLINE = 'rgba(60,60,67,0.14)';

// ─── Customer action flows (mirrors guest home's IconFlowHub feel) ────────────
const PRIMARY_FLOWS: CustomerFlowDefinition[] = [
  CUSTOMER_FLOWS.order,        // My card
  CUSTOMER_FLOWS.connections,  // Network
  CUSTOMER_FLOWS.profile,      // Edit bio
  CUSTOMER_FLOWS.track,        // Track
];

// ─── Greeting ─────────────────────────────────────────────────────────────────
function greeting(name?: string | null) {
  const h = new Date().getHours();
  const t = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${t}${name ? `, ${name.trim().split(/\s+/)[0]}` : ''}`;
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function tapMeta(source?: string): { label: string; color: string } {
  if (source === 'nfc_card') return { label: 'NFC tap',      color: BRAND };
  if (source === 'slug')     return { label: 'QR / link',    color: '#7C3AED' };
  if (source === 'interaction') return { label: 'Link tap',  color: '#059669' };
  return                          { label: 'Profile view',   color: '#0284C7' };
}

function deviceLabel(d?: string) {
  if (d === 'ios') return 'iPhone';
  if (d === 'android') return 'Android';
  if (d === 'web') return 'Web';
  return d || 'Unknown';
}

/** Cheap memoized label lookup so each row doesn't re-string-compare on every render. */
const DEVICE_LABEL_CACHE = new Map<string, string>();
function cachedDeviceLabel(d?: string) {
  const key = d ?? '';
  const cached = DEVICE_LABEL_CACHE.get(key);
  if (cached !== undefined) return cached;
  const next = deviceLabel(d);
  DEVICE_LABEL_CACHE.set(key, next);
  return next;
}

// ─── Activity row ─────────────────────────────────────────────────────────────
const ActivityRow = memo(function ActivityRow({ event, last }: { event: TapEvent & { id: string }; last?: boolean }) {
  const meta = useMemo(() => tapMeta(event.source), [event.source]);
  return (
    <View style={[ar.row, last && ar.last]}>
      <View style={ar.copy}>
        <View style={ar.labelRow}>
          <AppText style={ar.label}>{meta.label}</AppText>
          <View style={[ar.dot, { backgroundColor: meta.color }]} />
        </View>
        <AppText style={ar.sub}>{cachedDeviceLabel(event.device)}</AppText>
      </View>
      <AppText style={ar.time}>{relativeTime(event.createdAt)}</AppText>
    </View>
  );
});
const ar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  last: { borderBottomWidth: 0 },
  copy: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: INK2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  sub: { fontSize: 11, fontWeight: '500', color: MUTED },
  time: { fontSize: 11, fontWeight: '600', color: MUTED },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export function CustomerAccountScreen() {
  const { width: sw } = useWindowDimensions();
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const { unreadCount } = useNotifications();
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [tapEvents, setTapEvents] = useState<(TapEvent & { id: string })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Card data — bio first, then cloud card, then auth user
  const heroName  = bioPage?.displayName?.trim() || cloudCard?.profile.fullName?.trim() || user?.displayName?.trim() || '';
  const heroTitle = bioPage?.tagline?.trim()      || cloudCard?.profile.role?.trim()     || '';
  const heroPhone = bioPage?.whatsapp?.trim()     || cloudCard?.profile.phone?.trim()    || user?.phone?.trim() || '';
  const heroEmail = bioPage?.email?.trim()        || cloudCard?.profile.email?.trim()    || user?.email?.trim() || '';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : cloudCard?.publicProfileUrl || undefined;
  const initial = (user?.displayName?.trim() || 'U')[0].toUpperCase();

  // Card dimensions — full width, real aspect ratio (no compact)
  const cardPad = 24;
  const cardWidth = sw - cardPad * 2;
  const cardHeight = cardWidth / 1.586;

  // Memoize the top-8 slice so the activity feed doesn't repaint the whole
  // list when only an unrelated state changes (e.g. lastSignal, heroName).
  const activityPreview = useMemo(
    () => tapEvents.slice(0, 8),
    [tapEvents],
  );

  const totalSignals = tapEvents.length;
  const nfcSignals = useMemo(
    () => tapEvents.filter((event) => event.source === 'nfc_card').length,
    [tapEvents],
  );
  const profileSignals = useMemo(
    () => tapEvents.filter((event) => event.source !== 'nfc_card').length,
    [tapEvents],
  );

  /**
   * When Firebase hasn't received any real tap events yet (first session,
   * brand-new account, or this is the seed customer), surface the seed
   * moments so the home page never looks empty. Once real data lands we
   * seamlessly swap over.
   */
  const hasRealActivity = tapEvents.length > 0;
  const seedActivityRows = useMemo(
    () =>
      SEED_MOMENTS.slice(0, 8).map((moment) => ({
        id: `seed-${moment.id}`,
        source: moment.source === 'nfc' ? 'nfc_card' : moment.source === 'qr' ? 'slug' : 'view',
        device: 'ios' as const,
        createdAt: moment.occurredAt instanceof Date
          ? moment.occurredAt.toISOString()
          : new Date(moment.occurredAt).toISOString(),
      })),
    [],
  );
  const displayedActivity = hasRealActivity ? activityPreview : seedActivityRows;
  const cardLabel = profileUrl ? 'Live' : (cloudCard?.profile.fullName ? 'Active' : 'Draft');

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      loadCustomerCloudCard(user.id).then(setCloudCard).catch(() => null),
      getDocs(
        query(
          collection(db, firebaseCollections.tapEvents),
          where('profileId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(15),
        ),
      ).then((snap) => {
        setTapEvents(snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '' } as TapEvent & { id: string };
        }));
      }).catch(() => null),
    ]);
  }, [user?.id]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleShare() {
    if (!profileUrl) { Alert.alert('No profile yet', 'Edit your bio and save a public slug first.'); return; }
    await Share.share({ message: `My NFC profile: ${profileUrl}`, url: profileUrl });
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <IosScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#FFFFFF" />}
        >

          {/* ── QUIET PROFILE HEADER ── */}
          <View style={s.profileHeader}>
            <Pressable
              onPress={() => router.push('/edit-bio')}
              style={({ pressed }) => [s.profileAvatar, pressed && s.pressed]}
              accessibilityLabel="Edit profile"
            >
              <AppText style={s.profileAvatarT}>{initial}</AppText>
            </Pressable>
            <View style={s.profileCopy}>
              <AppText style={s.greeting}>{greeting(user?.displayName)}</AppText>
              <AppText style={s.profileName} numberOfLines={1}>
                {heroName || user?.displayName || 'Your Name'}
              </AppText>
              <AppText style={s.profileMeta} numberOfLines={1}>
                {heroTitle || 'NFC card identity'}
                {profileUrl ? `  ·  /${profileUrl.split('/').pop()}` : '  ·  No public link yet'}
              </AppText>
            </View>
            <View style={s.headerActions}>
              <Pressable
                onPress={() => router.push('/(tabs)/notifications')}
                style={({ pressed }) => [s.headerIcon, pressed && s.pressed]}
                accessibilityLabel="Notifications"
              >
                <AppIcon name="Bell" size={18} color={INK2} />
                {unreadCount > 0 ? <View style={s.unreadDot} /> : null}
              </Pressable>
            </View>
          </View>

          {/* ── HERO CARD ── */}
          <View style={[s.cardStage, { width: cardWidth }]}>
            <View style={[s.cardWrap, { width: cardWidth, height: cardHeight }]}>
              <FlippableNfcCard
                fullName={heroName  || undefined}
                title={heroTitle    || undefined}
                phone={heroPhone    || undefined}
                email={heroEmail    || undefined}
                profileUrl={profileUrl}
                cardId={cloudCard?.cardId}
                width={cardWidth}
                height={cardHeight}
              />
            </View>
          </View>

          {/* ── PRIMARY SHARE + CREATE NEW CARD (paired) ── */}
          <View style={s.dualCtaRow}>
            <Pressable
              onPress={() => void handleShare()}
              style={({ pressed }) => [s.shareButton, s.shareButtonHalf, pressed && s.pressed]}
              accessibilityLabel="Share card"
            >
              <AppIcon name="Share" size={17} color="#FFFFFF" />
              <AppText style={s.shareButtonT}>Share</AppText>
            </Pressable>
            <Pressable
              onPress={() => router.push(appRoutes.guestDesign as Href)}
              style={({ pressed }) => [s.createCardButton, pressed && s.pressed]}
              accessibilityLabel="Create a new card"
            >
              <AppIcon name="PlusSimple" size={17} color={BRAND} />
              <AppText style={s.createCardButtonT}>New card</AppText>
            </Pressable>
          </View>

          {/* ── QUIET STATS STRIP (replaces the giant snapshot panel) ── */}
          <View style={s.statsStrip}>
            <View style={s.statItem}>
              <AppText style={s.statNumber}>{totalSignals || seedActivityRows.length}</AppText>
              <AppText style={s.statLabel}>Signals</AppText>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <AppText style={s.statNumber}>{nfcSignals}</AppText>
              <AppText style={s.statLabel}>NFC</AppText>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <AppText style={s.statNumber}>{profileSignals || seedActivityRows.length}</AppText>
              <AppText style={s.statLabel}>Profile</AppText>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <AppText style={[s.statNumber, s.statState]}>{cardLabel}</AppText>
              <AppText style={s.statLabel}>Status</AppText>
            </View>
          </View>

          {/* ── ICON FLOW HUB (matches guest home design) ── */}
          <IconFlowHub
            title="Quick actions"
            subtitle="Card · network · bio · track"
            primaryFlows={PRIMARY_FLOWS}
            metricFlows={[]}
            metrics={{}}
            onLaunch={(id) => {
              const flow = PRIMARY_FLOWS.find((f) => f.id === id);
              if (flow) router.push(flow.route);
            }}
            textColor={INK}
            mutedColor={MUTED2}
          />

          {/* ── ACTIVITY FEED (real data + seed fallback) ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View>
                <AppText style={s.sectionTitle}>Recent activity</AppText>
                <AppText style={s.sectionSub}>
                  {hasRealActivity ? 'Live from your card' : 'Preview · real signals show up here'}
                </AppText>
              </View>
              <Pressable onPress={() => router.push(appRoutes.customerConnections as Href)}>
                <AppText style={s.viewAll}>All</AppText>
              </Pressable>
            </View>

            <View style={s.feedCard}>
              {displayedActivity.length === 0 ? (
                <View style={s.emptyFeed}>
                  <AppIcon name="Nfc" size={28} color="#D1D5DB" />
                  <AppText style={s.emptyTitle}>No activity yet</AppText>
                  <AppText style={s.emptySub}>Hand someone your card — taps appear here instantly.</AppText>
                </View>
              ) : (
                displayedActivity.map((e, i) => (
                  <ActivityRow key={e.id} event={e as TapEvent & { id: string }} last={i === displayedActivity.length - 1} />
                ))
              )}
            </View>
          </View>

          {/* ── NFC DEMO ── */}
          <Pressable
            onPress={() => router.push(appRoutes.nfcDemo as Href)}
            style={({ pressed }) => [s.demoLink, pressed && s.pressed]}
          >
            <AppIcon name="Nfc" size={14} color={MUTED} />
            <AppText style={s.demoLinkT}>Try NFC demo</AppText>
            <AppIcon name="ChevronRight" size={12} color={MUTED} />
          </Pressable>

        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 120, gap: 16 },

  // Profile header — quiet, smaller, lighter
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  profileAvatarT: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  profileCopy: { flex: 1, minWidth: 0, gap: 1 },
  greeting: { fontSize: 12, fontWeight: '700', color: MUTED, letterSpacing: 0.1 },
  profileName: { fontSize: 19, lineHeight: 23, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  profileMeta: { fontSize: 12, fontWeight: '600', color: MUTED },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FF3B30' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  // Card stage
  cardStage: { alignSelf: 'center', paddingTop: 8, paddingBottom: 4 },
  cardWrap: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
  },

  // Share + new card (paired)
  dualCtaRow: { flexDirection: 'row', gap: 10 },
  shareButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: INK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonHalf: { flex: 1 },
  shareButtonT: { fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.1 },
  createCardButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createCardButtonT: { fontSize: 15, fontWeight: '900', color: BRAND, letterSpacing: 0.1 },

  // Quiet stats strip (single row, hairline dividers, no panel)
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 18, lineHeight: 22, fontWeight: '900', color: INK, letterSpacing: -0.2 },
  statState: { fontSize: 14, fontWeight: '900', color: BRAND },
  statLabel: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.6, textTransform: 'uppercase' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: 'rgba(0,0,0,0.08)' },

  // Section heads
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  sectionSub: { fontSize: 11, fontWeight: '500', color: MUTED, marginTop: 2 },
  viewAll: { fontSize: 12, fontWeight: '700', color: BRAND },

  feedCard: { backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: HAIRLINE },
  emptyFeed: { padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: INK2 },
  emptySub: { fontSize: 11, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 16 },

  demoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  demoLinkT: { fontSize: 11, fontWeight: '600', color: MUTED },
});

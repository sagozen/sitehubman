/**
 * CustomerAccountScreen — Card-first home.
 * 70% of the screen above the fold is the NFC card.
 * Actions are a compact icon row, not competing cards.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
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
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { appRoutes } from '@/src/constants/navigation';
import { firebaseCollections } from '@/src/constants/collections';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useNotifications } from '@/src/hooks/useNotifications';
import { db } from '@/src/services/firebaseClient';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import type { TapEvent } from '@/src/types/models';

const BRAND = '#2596BE';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const SURFACE = '#FFFFFF';
const BG = '#F5F5F7';

// ─── Icon action strip ────────────────────────────────────────────────────────
const ACTIONS: { icon: AppIconName; label: string; color: string; route: Href }[] = [
  { icon: 'CreditCard', label: 'Card', color: INK, route: appRoutes.guestDesign as Href },
  { icon: 'Users', label: 'Network', color: INK, route: appRoutes.customerConnections as Href },
  { icon: 'BarChart', label: 'Insights', color: INK, route: appRoutes.guestAnalytics as Href },
  { icon: 'Sparkles', label: 'Studio', color: BRAND, route: appRoutes.studio as Href },
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

function tapMeta(source?: string): { label: string; icon: AppIconName; color: string } {
  if (source === 'nfc_card') return { label: 'NFC tap',      icon: 'Nfc',          color: BRAND };
  if (source === 'slug')     return { label: 'QR / link',    icon: 'QrCode',       color: '#7C3AED' };
  if (source === 'interaction') return { label: 'Link tap',  icon: 'ExternalLink', color: '#059669' };
  return                          { label: 'Profile view',   icon: 'Eye',          color: '#0284C7' };
}

function deviceLabel(d?: string) {
  if (d === 'ios') return 'iPhone';
  if (d === 'android') return 'Android';
  if (d === 'web') return 'Web';
  return d || 'Unknown';
}

// ─── Activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ event, last }: { event: TapEvent & { id: string }; last?: boolean }) {
  const meta = tapMeta(event.source);
  return (
    <View style={[ar.row, last && ar.last]}>
      <View style={[ar.icon, { backgroundColor: `${meta.color}16` }]}>
        <AppIcon name={meta.icon} size={15} color={meta.color} />
      </View>
      <View style={ar.copy}>
        <AppText style={ar.label}>{meta.label}</AppText>
        <AppText style={ar.sub}>{deviceLabel(event.device)}</AppText>
      </View>
      <AppText style={ar.time}>{relativeTime(event.createdAt)}</AppText>
    </View>
  );
}
const ar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  last: { borderBottomWidth: 0 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 13, fontWeight: '700', color: INK2 },
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
  const totalSignals = tapEvents.length;
  const nfcSignals = tapEvents.filter((event) => event.source === 'nfc_card').length;
  const profileSignals = tapEvents.filter((event) => event.source !== 'nfc_card').length;
  const lastSignal = relativeTime(tapEvents[0]?.createdAt) || (profileUrl ? 'Ready now' : 'Publish profile');
  const cardState = profileUrl ? 'Live' : 'Draft';

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

          {/* ── PROFILE HEADER ── */}
          <View style={s.profileHeader}>
            <Pressable onPress={() => router.push('/edit-bio')} style={({ pressed }) => [s.profileAvatar, pressed && s.pressed]}>
              <AppText style={s.profileAvatarT}>{initial}</AppText>
            </Pressable>
            <View style={s.profileCopy}>
              <AppText style={s.greeting}>{greeting(user?.displayName)}</AppText>
              <View style={s.profileNameRow}>
                <AppText style={s.profileName} numberOfLines={1}>
                  {heroName || user?.displayName || 'Your Name'}
                </AppText>
                <AppIcon name="BadgeCheck" size={18} color={BRAND} />
              </View>
              <AppText style={s.profileMeta} numberOfLines={1}>
                {[heroTitle || 'Digital identity', cloudCard?.profile.company || 'NFC Global'].filter(Boolean).join(' / ')}
              </AppText>
            </View>
            <View style={s.headerActions}>
              <Pressable onPress={() => router.push('/(tabs)/notifications')} style={({ pressed }) => [s.headerIcon, pressed && s.pressed]}>
                <AppIcon name="Bell" size={19} color={INK} />
                {unreadCount > 0 ? <View style={s.unreadDot} /> : null}
              </Pressable>
              <Pressable onPress={() => router.push(appRoutes.studio as Href)} style={({ pressed }) => [s.headerIcon, pressed && s.pressed]}>
                <AppIcon name="Sparkles" size={20} color={BRAND} />
              </Pressable>
            </View>
          </View>

          {/* ── CARD STACK ── */}
          <View style={[s.cardStage, { width: cardWidth }]}>
            <View style={s.cardShadowBack} />
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

          {/* ── PRIMARY SHARE ── */}
          <Pressable onPress={() => void handleShare()} style={({ pressed }) => [s.shareButton, pressed && s.pressed]}>
            <AppIcon name="Share" size={19} color="#FFFFFF" />
            <AppText style={s.shareButtonT}>Share card</AppText>
          </Pressable>

          {/* ── HIHELLO / TAPLA ACTION ROW ── */}
          <View style={s.utilityRow}>
            {ACTIONS.map((a, i) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.route)}
                style={({ pressed }) => [s.utilityBtn, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <AppIcon name={a.icon} size={22} color={a.color} />
                <AppText style={s.utilityLabel}>{a.label}</AppText>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [s.snapshotPanel, pressed && s.pressed]}
          >
            <View style={s.snapshotTop}>
              <View>
                <AppText style={s.snapshotKicker}>Today</AppText>
                <AppText style={s.snapshotTitle}>Identity snapshot</AppText>
              </View>
              <AppText style={s.snapshotLive}>{cardState}</AppText>
            </View>
            <View style={s.snapshotStats}>
              <View>
                <AppText style={s.snapshotNumber}>{totalSignals}</AppText>
                <AppText style={s.snapshotLabel}>signals</AppText>
              </View>
              <View>
                <AppText style={s.snapshotNumber}>{nfcSignals}</AppText>
                <AppText style={s.snapshotLabel}>NFC</AppText>
              </View>
              <View>
                <AppText style={s.snapshotNumber}>{profileSignals}</AppText>
                <AppText style={s.snapshotLabel}>profile</AppText>
              </View>
            </View>
            <AppText style={s.snapshotFoot}>Last signal · {lastSignal}</AppText>
          </Pressable>

          {/* ── ACTIVITY FEED ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View>
                <AppText style={s.sectionTitle}>Recent Activity</AppText>
                <AppText style={s.sectionSub}>People viewing, saving, and tapping</AppText>
              </View>
              <Pressable onPress={() => router.push(appRoutes.customerConnections as Href)}>
                <AppText style={s.viewAll}>All</AppText>
              </Pressable>
            </View>

            <View style={s.feedCard}>
              {tapEvents.length === 0 ? (
                <View style={s.emptyFeed}>
                  <AppIcon name="Nfc" size={32} color="#D1D5DB" />
                  <AppText style={s.emptyTitle}>No activity yet</AppText>
                  <AppText style={s.emptySub}>Hand someone your card — taps appear here instantly.</AppText>
                </View>
              ) : (
                tapEvents.slice(0, 8).map((e, i) => (
                  <ActivityRow key={e.id} event={e} last={i === Math.min(tapEvents.length, 8) - 1} />
                ))
              )}
            </View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHead}>
              <View>
                <AppText style={s.sectionTitle}>Your Products</AppText>
                <AppText style={s.sectionSub}>Card, profile, and share identity</AppText>
              </View>
            </View>
            <View style={s.productList}>
              {[
                ['Physical NFC card', cloudCard?.status === 'active' ? 'Active' : 'Design or order', appRoutes.guestDesign],
                ['Digital profile', profileUrl ? 'Published' : 'Needs setup', '/edit-bio'],
                ['QR identity', profileUrl ? 'Ready to share' : 'Publish first', appRoutes.qrGenerator],
              ].map(([label, meta, route], index) => (
                <Pressable
                  key={label}
                  onPress={() => router.push(route as Href)}
                  style={({ pressed }) => [s.productRow, index === 2 && s.productRowLast, pressed && s.pressed]}
                >
                  <View>
                    <AppText style={s.productTitle}>{label}</AppText>
                    <AppText style={s.productMeta}>{meta}</AppText>
                  </View>
                  <AppIcon name="ChevronRight" size={16} color={MUTED} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── NFC DEMO ── */}
          <Pressable onPress={() => router.push(appRoutes.nfcDemo as Href)} style={({ pressed }) => [s.demoLink, pressed && s.pressed]}>
            <AppIcon name="Nfc" size={15} color={MUTED} />
            <AppText style={s.demoLinkT}>Try NFC demo</AppText>
            <AppIcon name="ChevronRight" size={13} color={MUTED} />
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
  content: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 120, gap: 20 },

  // Profile header
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  profileAvatarT: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  profileCopy: { flex: 1, minWidth: 0, gap: 2 },
  greeting: { fontSize: 12, fontWeight: '800', color: MUTED },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  profileName: { flexShrink: 1, fontSize: 23, lineHeight: 27, fontWeight: '900', color: INK, letterSpacing: 0 },
  profileMeta: { fontSize: 12, fontWeight: '700', color: MUTED },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  // Card stack
  cardStage: { alignSelf: 'center', paddingTop: 14, paddingBottom: 4 },
  cardShadowBack: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 0,
    height: 34,
    borderRadius: 22,
    backgroundColor: '#D8D8DD',
    opacity: 0.7,
  },
  cardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 10,
  },

  // Share and utilities
  shareButton: { height: 58, borderRadius: 29, backgroundColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  shareButtonT: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  utilityRow: { flexDirection: 'row', gap: 10 },
  utilityBtn: { flex: 1, minHeight: 76, borderRadius: 24, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', gap: 7 },
  utilityLabel: { fontSize: 11, fontWeight: '900', color: INK2, textAlign: 'center' },

  snapshotPanel: { borderRadius: 24, backgroundColor: SURFACE, padding: 22, gap: 18 },
  snapshotTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  snapshotKicker: { fontSize: 12, fontWeight: '800', color: BRAND },
  snapshotTitle: { fontSize: 20, fontWeight: '900', color: INK, marginTop: 2 },
  snapshotLive: { fontSize: 12, fontWeight: '900', color: BRAND },
  snapshotStats: { flexDirection: 'row', justifyContent: 'space-between' },
  snapshotNumber: { fontSize: 34, lineHeight: 38, fontWeight: '900', color: INK },
  snapshotLabel: { fontSize: 12, fontWeight: '800', color: MUTED },
  snapshotFoot: { fontSize: 12, fontWeight: '800', color: MUTED },

  // Below-the-fold content
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  sectionSub: { fontSize: 11, fontWeight: '500', color: MUTED, marginTop: 2 },
  viewAll: { fontSize: 13, fontWeight: '700', color: BRAND },

  feedCard: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  emptyFeed: { padding: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: INK2 },
  emptySub: { fontSize: 12, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 18 },

  productList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  productRow: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  productRowLast: { borderBottomWidth: 0 },
  productTitle: { fontSize: 16, fontWeight: '900', color: INK },
  productMeta: { fontSize: 12, fontWeight: '700', color: MUTED, marginTop: 3 },

  demoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  demoLinkT: { fontSize: 12, fontWeight: '500', color: MUTED },
});

import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { FlowIcon } from '@/src/components/FlowIcon';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { firebaseCollections } from '@/src/constants/collections';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { db } from '@/src/services/firebaseClient';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import type { TapEvent } from '@/src/types/models';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const BRAND_DARK = '#1A7FAA';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const SURFACE = '#FFFFFF';
const BG = '#F5F5F7';

// ─── Quick actions ────────────────────────────────────────────────────────────
const ACTIONS: {
  icon: AppIconName;
  realIcon: FlowRealIconId;
  label: string;
  sub: string;
  color: string;
  route: Href;
}[] = [
  { icon: 'Share',    realIcon: 'share',       label: 'Share Card',   sub: 'QR profile link', color: BRAND,     route: appRoutes.qrGenerator as Href },
  { icon: 'ScanLine', realIcon: 'nfc',         label: 'Scan NFC',     sub: 'Test a tap',      color: '#0284C7', route: appRoutes.scan as Href },
  { icon: 'Users',    realIcon: 'connections', label: 'Leads',        sub: 'Viewers & taps',  color: '#7C3AED', route: appRoutes.customerConnections as Href },
  { icon: 'PenLine',  realIcon: 'profile',     label: 'Edit Profile', sub: 'Bio page',        color: '#059669', route: '/edit-bio' as Href },
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

// ─── Source label + icon ──────────────────────────────────────────────────────
function tapMeta(source?: string): { label: string; icon: AppIconName; color: string } {
  if (source === 'nfc_card') return { label: 'NFC tap',    icon: 'Nfc',      color: BRAND };
  if (source === 'slug')     return { label: 'QR / link',  icon: 'QrCode',   color: '#7C3AED' };
  if (source === 'interaction') return { label: 'Link tap', icon: 'ExternalLink', color: '#059669' };
  return                            { label: 'Profile view', icon: 'Eye',    color: '#0284C7' };
}

// ─── Device label ─────────────────────────────────────────────────────────────
function deviceLabel(d?: string): string {
  if (!d) return 'Unknown';
  if (d === 'ios') return 'iPhone';
  if (d === 'android') return 'Android';
  if (d === 'web') return 'Web browser';
  return d;
}

type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  time: string;
  icon: AppIconName;
  color: string;
};

function buildActivityItems(
  events: (TapEvent & { id: string })[],
  profileName: string,
  bioViews?: number,
  bioTaps?: number,
): ActivityItem[] {
  const realEvents = events.slice(0, 10).map((event) => {
    const meta = tapMeta(event.source);
    const device = deviceLabel(event.device);
    const actor =
      event.source === 'nfc_card'
        ? 'NFC card tap'
        : event.source === 'slug'
          ? 'QR profile visitor'
          : event.source === 'interaction'
            ? 'Bio link visitor'
            : 'Profile visitor';

    return {
      id: event.id,
      actor,
      action: `${meta.label} opened ${profileName || 'your bio'}`,
      detail: `${device} viewed your public profile`,
      time: relativeTime(event.createdAt) || 'Recently',
      icon: meta.icon,
      color: meta.color,
    };
  });

  if (realEvents.length > 0) return realEvents;

  const fallback: ActivityItem[] = [];
  if ((bioViews ?? 0) > 0) {
    fallback.push({
      id: 'views-summary',
      actor: 'Profile visitors',
      action: `People viewed ${profileName || 'your bio'}`,
      detail: `${bioViews} total bio views recorded`,
      time: 'Recently',
      icon: 'Eye',
      color: '#0284C7',
    });
  }
  if ((bioTaps ?? 0) > 0) {
    fallback.push({
      id: 'taps-summary',
      actor: 'NFC activity',
      action: 'Your NFC card sent people to your bio',
      detail: `${bioTaps} total NFC or QR opens recorded`,
      time: 'Recently',
      icon: 'Nfc',
      color: BRAND,
    });
  }
  return fallback;
}

// ─── Activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ item, last }: { item: ActivityItem; last?: boolean }) {
  const initial = item.actor.trim()[0]?.toUpperCase() ?? 'V';
  return (
    <View style={[ar.row, last && ar.rowLast]}>
      <View style={[ar.avatar, { backgroundColor: `${item.color}18` }]}>
        <AppText style={[ar.avatarT, { color: item.color }]}>{initial}</AppText>
        <View style={[ar.badge, { backgroundColor: item.color }]}>
          <AppIcon name={item.icon} size={10} color="#FFFFFF" />
        </View>
      </View>
      <View style={ar.copy}>
        <AppText style={ar.label}>
          <AppText style={ar.actor}>{item.actor}</AppText>
          {' '}
          {item.action}
        </AppText>
        <AppText style={ar.sub}>{item.detail}</AppText>
      </View>
      <AppText style={ar.time}>{item.time}</AppText>
    </View>
  );
}

const ar = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarT: { fontSize: 15, fontWeight: '900', fontFamily: 'Inter_900Black' },
  badge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SURFACE,
  },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 13, fontWeight: '500', color: INK2, lineHeight: 18 },
  actor: { fontSize: 13, fontWeight: '800', color: INK, fontFamily: 'Inter_800ExtraBold' },
  sub: { fontSize: 11, fontWeight: '500', color: MUTED },
  time: { fontSize: 11, fontWeight: '600', color: MUTED },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export function CustomerAccountScreen() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [tapEvents, setTapEvents] = useState<(TapEvent & { id: string })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const heroName  = bioPage?.displayName?.trim() || cloudCard?.profile.fullName?.trim() || user?.displayName?.trim() || '';
  const heroTitle = bioPage?.tagline?.trim()      || cloudCard?.profile.role?.trim()     || '';
  const heroPhone = bioPage?.whatsapp?.trim()     || cloudCard?.profile.phone?.trim()    || user?.phone?.trim() || '';
  const heroEmail = bioPage?.email?.trim()        || cloudCard?.profile.email?.trim()    || user?.email?.trim() || '';
  const initial   = (user?.displayName?.trim() || 'U')[0].toUpperCase();

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      loadCustomerCloudCard(user.id).then(setCloudCard).catch(() => null),
      getDocs(
        query(
          collection(db, firebaseCollections.tapEvents),
          where('profileId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(20),
        ),
      ).then((snap) => {
        const events = snap.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '';
          return { id: d.id, ...data, createdAt } as TapEvent & { id: string };
        });
        setTapEvents(events);
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
    const url = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : cloudCard?.publicProfileUrl || '';
    if (!url) { Alert.alert('No profile yet', 'Edit your bio and save a public slug first.'); return; }
    await Share.share({ message: `My NFC profile: ${url}`, url });
  }

  const activityItems = buildActivityItems(tapEvents, heroName, bioPage?.views, bioPage?.taps);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <IosScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={BRAND} />}
        >

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View style={s.hLeft}>
              <AppText style={s.greeting}>{greeting(user?.displayName)}</AppText>
              <AppText style={s.greetSub}>Your card is working for you.</AppText>
            </View>
            <View style={s.hRight}>
              <Pressable
                onPress={() => router.push(appRoutes.customerConnections as Href)}
                style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
              >
                <AppIcon name="Bell" size={20} color={INK2} />
                {tapEvents.length > 0 ? <View style={s.notifDot} /> : null}
              </Pressable>
              <Pressable
                onPress={() => router.push('/edit-bio')}
                style={({ pressed }) => [s.avatar, pressed && s.pressed]}
              >
                <AppText style={s.avatarT}>{initial}</AppText>
              </Pressable>
            </View>
          </View>

          {/* ── NFC CARD ── */}
          <View style={s.cardWrap}>
            <NfcGlobalCardFace
              compact
              fullName={heroName  || undefined}
              title={heroTitle    || undefined}
              phone={heroPhone    || undefined}
              email={heroEmail    || undefined}
            />
          </View>

          {/* ── SHARE ── */}
          <Pressable onPress={() => void handleShare()} style={({ pressed }) => [s.shareLine, pressed && s.pressed]}>
            <AppIcon name="Share" size={15} color={BRAND} />
            <AppText style={s.shareLineT}>Share card by QR or link</AppText>
          </Pressable>

          {/* ── QUICK ACTIONS ── */}
          <View style={s.actionsGrid}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.route)}
                style={({ pressed }) => [s.actionCard, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[`${a.color}20`, `${a.color}08`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.actionTop}>
                  <FlowIcon
                    realIcon={a.realIcon}
                    fallbackIcon={a.icon}
                    tint={a.color}
                    size={46}
                    glow
                  />
                  <View style={[s.actionArrow, { backgroundColor: `${a.color}18` }]}>
                    <AppIcon name="ChevronRight" size={14} color={a.color} />
                  </View>
                </View>
                <AppText style={s.actionLabel}>{a.label}</AppText>
                <AppText style={s.actionSub}>{a.sub}</AppText>
              </Pressable>
            ))}
          </View>

          {/* ── BIO LINK ACTIVITY ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View>
                <AppText style={s.sectionTitle}>Tap Activity</AppText>
                <AppText style={s.sectionSub}>Card views, QR scans, and NFC taps</AppText>
              </View>
              <Pressable onPress={() => router.push(appRoutes.customerConnections as Href)}>
                <View style={s.viewAllRow}>
                  <AppText style={s.viewAll}>View</AppText>
                  <AppIcon name="ChevronRight" size={13} color={BRAND} />
                </View>
              </Pressable>
            </View>

            <View style={s.feedCard}>
              {activityItems.length === 0 ? (
                <View style={s.emptyFeed}>
                  <AppIcon name="Nfc" size={36} color="#D1D5DB" />
                  <AppText style={s.emptyTitle}>No activity yet</AppText>
                  <AppText style={s.emptySub}>
                    When someone taps your NFC card or scans your QR code, it appears here.
                  </AppText>
                </View>
              ) : (
                activityItems.map((item, i) => (
                  <ActivityRow key={item.id} item={item} last={i === activityItems.length - 1} />
                ))
              )}
            </View>
          </View>

          {/* ── HOW IT WORKS ── */}
          <View style={s.howCard}>
            <LinearGradient
              colors={[BRAND_DARK, BRAND]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.howRow}>
              <View style={s.howStep}>
                <AppIcon name="CreditCard" size={22} color="#FFFFFF" />
                <AppText style={s.howStepT}>Tap card</AppText>
                <AppText style={s.howStepS}>NFC chip sends URL</AppText>
              </View>
              <AppIcon name="ChevronRight" size={16} color="rgba(255,255,255,0.5)" />
              <View style={s.howStep}>
                <AppIcon name="Eye" size={22} color="#FFFFFF" />
                <AppText style={s.howStepT}>Bio opens</AppText>
                <AppText style={s.howStepS}>Your public profile</AppText>
              </View>
              <AppIcon name="ChevronRight" size={16} color="rgba(255,255,255,0.5)" />
              <View style={s.howStep}>
                <AppIcon name="BarChart" size={22} color="#FFFFFF" />
                <AppText style={s.howStepT}>You see it</AppText>
                <AppText style={s.howStepS}>Live in activity</AppText>
              </View>
            </View>
          </View>

          {/* ── DEMO LINK ── */}
          <Pressable
            onPress={() => router.push(appRoutes.nfcDemo as Href)}
            style={({ pressed }) => [s.demoLink, pressed && s.pressed]}
          >
            <AppIcon name="Nfc" size={16} color={MUTED} />
            <AppText style={s.demoLinkT}>Try NFC demo on this device</AppText>
            <AppIcon name="ChevronRight" size={14} color={MUTED} />
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
  content: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 120, gap: 18 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  hLeft: { flex: 1, gap: 2 },
  greeting: { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.6, fontFamily: 'Inter_800ExtraBold' },
  greetSub: { fontSize: 13, fontWeight: '500', color: MUTED },
  hRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  notifDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: BG },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', shadowColor: INK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  avatarT: { fontSize: 17, fontWeight: '900', color: SURFACE, fontFamily: 'Inter_900Black' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  cardWrap: { alignSelf: 'center', width: '86%', borderRadius: 20, overflow: 'hidden', shadowColor: BRAND, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 24, elevation: 8 },

  shareLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 2 },
  shareLineT: { fontSize: 13, fontWeight: '700', color: BRAND, fontFamily: 'Inter_700Bold' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '48.5%',
    minHeight: 112,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  actionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionArrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '900', color: INK2, fontFamily: 'Inter_900Black' },
  actionSub: { fontSize: 11, fontWeight: '600', color: MUTED },

  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.4, fontFamily: 'Inter_800ExtraBold' },
  sectionSub: { marginTop: 3, fontSize: 12, fontWeight: '500', color: MUTED },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll: { fontSize: 13, fontWeight: '600', color: BRAND },

  feedCard: { backgroundColor: SURFACE, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 },

  emptyFeed: { padding: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: INK2, fontFamily: 'Inter_800ExtraBold' },
  emptySub: { fontSize: 13, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 18 },

  // How it works
  howCard: { borderRadius: 22, overflow: 'hidden', padding: 20, shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 8 },
  howRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  howStep: { flex: 1, alignItems: 'center', gap: 6 },
  howStepT: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  howStepS: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  demoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 },
  demoLinkT: { fontSize: 13, fontWeight: '500', color: MUTED },
});

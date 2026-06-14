import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlowIcon } from '@/src/components/FlowIcon';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useOrders } from '@/src/hooks/useOrders';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { loadGuestCardDraft } from '@/src/services/guestDraftService';
import type { Order } from '@/src/types/models';

// ─── Brand ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const BRAND_DARK = '#1A7FAA';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const SURFACE = '#FFFFFF';
const BG = '#F5F5F7';

// ─── Remote hero image (Unsplash CDN — ~40KB webp, no local asset needed) ──
// w=800&q=75&fm=webp gives ~38KB, fast, crisp on all screens
const HERO_IMG =
  'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=800&q=75&fm=webp';

// ─── Quick actions ───────────────────────────────────────────────────────────
const ACTIONS: {
  icon: AppIconName;
  realIcon: FlowRealIconId;
  label: string;
  sub: string;
  color: string;
  route?: Href;
  action?: 'share';
}[] = [
  { icon: 'CreditCard', realIcon: 'ecard', label: 'Design Card', sub: 'Build profile', color: BRAND, route: appRoutes.guestDesign as Href },
  { icon: 'QrCode', realIcon: 'preview', label: 'Preview QR', sub: 'No app needed', color: '#7C3AED', route: appRoutes.nfcDemo as Href },
  { icon: 'ScanLine', realIcon: 'nfc', label: 'Test NFC', sub: 'Tap or scan', color: '#0284C7', route: appRoutes.scan as Href },
  { icon: 'Share', realIcon: 'share', label: 'Share', sub: 'Profile link', color: '#059669', action: 'share' },
];

// ─── Order status ────────────────────────────────────────────────────────────
function orderStatus(s: string): { label: string; color: string } {
  if (['printing', 'nfc_writing', 'nfc_verification', 'qa_pending', 'ready_to_print'].includes(s))
    return { label: 'In Production', color: '#F59E0B' };
  if (['shipped', 'ready_to_ship', 'ready'].includes(s))
    return { label: 'Shipped', color: '#10B981' };
  if (s === 'delivered') return { label: 'Delivered', color: '#3B82F6' };
  return { label: 'Processing', color: BRAND };
}

function greeting(name?: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${time}${name ? `, ${name.split(' ')[0]}` : ''}`;
}

// ─── Card mini tile ──────────────────────────────────────────────────────────
const TILE_GRADIENTS = [
  ['#1A7FAA', '#2596BE', '#4DB8D8'],
  ['#18181B', '#27272A', '#3F3F46'],
  ['#1E3A8A', '#1D4ED8', '#3B82F6'],
  ['#5B21B6', '#7C3AED', '#A78BFA'],
] as const;

function CardTile({
  title,
  sub,
  idx = 0,
  status,
  isActive,
  onPress,
}: {
  title: string;
  sub: string;
  idx?: number;
  status: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const g = TILE_GRADIENTS[idx % TILE_GRADIENTS.length];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [tile.wrap, pressed && tile.pressed]}
      accessibilityRole="button"
    >
      <LinearGradient colors={[...g]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={tile.body}>
        <View style={tile.top}>
          <View style={tile.logo}><AppText style={tile.logoT}>N</AppText></View>
          <AppText style={tile.nfc}>))</AppText>
        </View>
        <View style={tile.foot}>
          <AppText style={tile.name} numberOfLines={1}>{title}</AppText>
          <AppText style={tile.company} numberOfLines={1}>{sub}</AppText>
          <View style={tile.statusRow}>
            <View style={[tile.dot, { backgroundColor: isActive ? '#34D399' : '#6B7280' }]} />
            <AppText style={tile.statusTxt}>{status}</AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const tile = StyleSheet.create({
  wrap: {
    width: 148,
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  body: { flex: 1, padding: 14, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoT: { fontSize: 14, fontWeight: '900', color: BRAND, fontFamily: 'Inter_900Black' },
  nfc: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: -2 },
  foot: { gap: 3 },
  name: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, fontFamily: 'Inter_800ExtraBold' },
  company: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.82)' },
});

// ─── Order row ────────────────────────────────────────────────────────────────
function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const st = orderStatus(order.status);
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const amt = order.amount != null ? `$${order.amount.toFixed(0)}` : '—';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [or.row, pressed && or.pressed]}>
      <View style={or.icon}>
        <AppIcon name="CreditCard" size={20} color={BRAND} />
      </View>
      <View style={or.info}>
        <AppText style={or.name} numberOfLines={1}>{order.customerName || 'NFC Card'}</AppText>
        <AppText style={or.meta}>{order.quantity ?? 1}× {order.cardDesign?.replace(/_/g, ' ')}</AppText>
      </View>
      <View style={or.right}>
        <View style={[or.badge, { backgroundColor: `${st.color}18` }]}>
          <AppText style={[or.badgeT, { color: st.color }]}>{st.label}</AppText>
        </View>
        <AppText style={or.amt}>{amt}</AppText>
        <AppText style={or.date}>{date}</AppText>
      </View>
      <AppIcon name="ChevronRight" size={15} color="#D1D5DB" />
    </Pressable>
  );
}

const or = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  pressed: { opacity: 0.7 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EBF7FC', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: INK2, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 11, fontWeight: '500', color: MUTED },
  right: { alignItems: 'flex-end', gap: 3 },
  badge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  badgeT: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  amt: { fontSize: 13, fontWeight: '800', color: INK2, fontFamily: 'Inter_800ExtraBold' },
  date: { fontSize: 10, fontWeight: '500', color: '#C7C7CC' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export function GuestHomeScreen() {
  useAppTheme();
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { orders } = useOrders(user?.role ?? 'guest', user?.id ?? '');
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    void loadGuestCardDraft().then((d) => setHasDraft(Boolean(d?.displayName?.trim())));
    if (user?.id && !isGuest) {
      void loadCustomerCloudCard(user.id).then(setCloudCard);
      void getCustomerInsights(user.id).then(setInsights).catch(() => null);
    }
  }, [user?.id, isGuest]);

  const recentOrders = useMemo(() => orders.slice(0, 2), [orders]);

  const cardProfile = cloudCard?.profile;
  const heroName = cardProfile?.fullName?.trim() || user?.displayName?.trim() || '';
  const heroTitle = cardProfile?.role?.trim() || '';
  const heroPhone = cardProfile?.phone?.trim() || '';
  const heroEmail = cardProfile?.email?.trim() || '';

  const recentCards = useMemo(() => {
    if (isGuest) return [
      { id: 'g1', title: 'Your Card', sub: 'NFC Global', idx: 0, status: 'Preview', active: false },
      { id: 'g2', title: 'Company Card', sub: 'NFC Global', idx: 1, status: 'Preview', active: false },
      { id: 'g3', title: 'Event Card', sub: 'NFC Global Event', idx: 2, status: 'Preview', active: false },
    ];
    const cards = [];
    if (cloudCard) cards.push({ id: cloudCard.cardId, title: cloudCard.profile.fullName || user?.displayName || 'My Card', sub: cloudCard.profile.company || 'NFC Global', idx: 0, status: cloudCard.status === 'active' ? 'Active' : cloudCard.status === 'ordered' ? 'Ordered' : 'Draft', active: cloudCard.status === 'active' });
    if (hasDraft && cards.length === 0) cards.push({ id: 'draft', title: user?.displayName || 'My Card', sub: 'Draft', idx: 0, status: 'Draft', active: false });
    return cards;
  }, [isGuest, cloudCard, hasDraft, user?.displayName]);

  function handleShare() {
    if (isGuest) { requireAccount(undefined, { message: 'Sign in to share your profile link.' }); return; }
    if (insights?.bioSlug) router.push(`/public/${insights.bioSlug}` as Href);
    else router.push(appRoutes.guestDesign as Href);
  }

  function handleAction(a: typeof ACTIONS[0]) {
    if (a.action === 'share') { handleShare(); return; }
    if (a.route) router.push(a.route);
  }

  const initial = (user?.displayName?.trim() || 'G')[0].toUpperCase();

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <IosScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View style={s.hLeft}>
              <AppText style={s.greeting}>{greeting(user?.displayName)}</AppText>
              <AppText style={s.greetSub}>Build a profile people can save in one tap.</AppText>
            </View>
            <View style={s.hRight}>
              <Pressable
                onPress={() => requireAccount(undefined, { message: 'Sign in for notifications.' })}
                style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
              >
                <AppIcon name="Bell" size={20} color={INK2} />
                <View style={s.notifDot} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/profile')}
                style={({ pressed }) => [s.avatar, pressed && s.pressed]}
              >
                <AppText style={s.avatarT}>{initial}</AppText>
              </Pressable>
            </View>
          </View>

          {/* ── HERO BANNER ── */}
          <Pressable
            onPress={() => router.push(appRoutes.guestDesign as Href)}
            style={({ pressed }) => [s.heroBanner, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Image
              source={{ uri: HERO_IMG }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(10,10,15,0.08)', 'rgba(10,10,15,0.72)']}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <View style={s.heroContent}>
              <View style={s.heroBadge}>
                <AppIcon name="Nfc" size={13} color={BRAND} />
                <AppText style={s.heroBadgeT}>SNAP TAP NFC</AppText>
              </View>
              <AppText style={s.heroTitle}>Meet. Tap.{'\n'}Capture the lead.</AppText>
              <AppText style={s.heroSub}>Digital profile · NFC card · QR backup</AppText>
              <View style={s.heroCta}>
                <AppText style={s.heroCtaT}>Start your digital card</AppText>
                <AppIcon name="ChevronRight" size={14} color={SURFACE} />
              </View>
            </View>
          </Pressable>

          {/* ── NFC CARD ── */}
          <View style={s.cardWrap}>
            <NfcGlobalCardFace
              fullName={heroName || undefined}
              title={heroTitle || undefined}
              phone={heroPhone || undefined}
              email={heroEmail || undefined}
            />
          </View>

          {/* Tap to share */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [s.shareLine, pressed && s.pressed]}
          >
            <AppIcon name="Share" size={15} color={BRAND} />
            <AppText style={s.shareLineT}>Share profile by QR or link</AppText>
          </Pressable>

          {/* ── QUICK ACTIONS ── */}
          <View style={s.actionsGrid}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => handleAction(a)}
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

          {/* ── RECENT CARDS ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <AppText style={s.sectionTitle}>Recent Cards</AppText>
              <Pressable
                onPress={() => isGuest ? requireAccount(undefined, { message: 'Sign in to manage your cards.' }) : router.push(appRoutes.guestDesign as Href)}
                accessibilityRole="button"
              >
                <View style={s.viewAllRow}>
                  <AppText style={s.viewAll}>View All</AppText>
                  <AppIcon name="ChevronRight" size={13} color={BRAND} />
                </View>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.cardScroll}
              decelerationRate="fast"
              snapToInterval={160}
            >
              {recentCards.map((c) => (
                <CardTile
                  key={c.id}
                  title={c.title}
                  sub={c.sub}
                  idx={c.idx}
                  status={c.status}
                  isActive={c.active}
                  onPress={() => isGuest ? requireAccount(undefined, { message: 'Sign in to edit your card.' }) : router.push(appRoutes.guestDesign as Href)}
                />
              ))}
              {/* Add tile */}
              <Pressable
                onPress={() => router.push(appRoutes.guestDesign as Href)}
                style={({ pressed }) => [s.addTile, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="New card"
              >
                <AppIcon name="Plus" size={28} color={BRAND} />
                <AppText style={s.addTileT}>New</AppText>
              </Pressable>
            </ScrollView>
          </View>

          {/* ── STATS ROW (customers only) ── */}
          {!isGuest && insights ? (
            <View style={s.statsRow}>
              {[
                { label: 'Orders', value: String(insights.totalOrders), icon: 'ClipboardList' as const, color: BRAND },
                { label: 'Active', value: String(insights.activeOrders), icon: 'Clock' as const, color: '#F59E0B' },
                { label: 'Delivered', value: String(insights.deliveredOrders), icon: 'CircleCheck' as const, color: '#10B981' },
              ].map((st) => (
                <View key={st.label} style={s.statCard}>
                  <AppIcon name={st.icon} size={22} color={st.color} />
                  <AppText style={s.statVal}>{st.value}</AppText>
                  <AppText style={s.statLbl}>{st.label}</AppText>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── RECENT ORDERS ── */}
          {!isGuest && recentOrders.length > 0 ? (
            <View style={s.section}>
              <View style={s.sectionHead}>
                <AppText style={s.sectionTitle}>Recent Orders</AppText>
                <Pressable onPress={() => router.push(appRoutes.guestTrackOrder as Href)}>
                  <View style={s.viewAllRow}>
                    <AppText style={s.viewAll}>View All</AppText>
                    <AppIcon name="ChevronRight" size={13} color={BRAND} />
                  </View>
                </Pressable>
              </View>
              <View style={s.ordersCard}>
                {recentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} onPress={() => router.push(`/order-detail/${o.id}` as Href)} />
                ))}
              </View>
            </View>
          ) : null}

          {/* ── GUEST CTA ── */}
          {isGuest ? (
            <Pressable
              onPress={() => requireAccount(undefined, { message: 'Create an account to order your NFC card.' })}
              style={({ pressed }) => [s.guestCta, pressed && s.pressed]}
              accessibilityRole="button"
            >
              <LinearGradient colors={[BRAND_DARK, BRAND, '#4DB8D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <View style={s.guestCtaInner}>
                <AppIcon name="CreditCard" size={26} color={SURFACE} />
                <View style={s.guestCtaCopy}>
              <AppText style={s.guestCtaTitle}>Launch your NFC card</AppText>
              <AppText style={s.guestCtaSub}>Create profile · order card · capture leads</AppText>
                </View>
                <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>
          ) : null}

          {/* ── NFC DEMO LINK ── */}
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
  content: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 120, gap: 22 },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  hLeft: { flex: 1, gap: 2 },
  greeting: { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.6, fontFamily: 'Inter_800ExtraBold' },
  greetSub: { fontSize: 13, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
  hRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  notifDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: BG },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', shadowColor: INK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  avatarT: { fontSize: 17, fontWeight: '900', color: SURFACE, fontFamily: 'Inter_900Black' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  // Hero banner
  heroBanner: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    shadowColor: INK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
    justifyContent: 'flex-end',
  },
  heroContent: { padding: 20, gap: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(37,150,190,0.25)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(37,150,190,0.4)' },
  heroBadgeT: { fontSize: 9, fontWeight: '800', color: '#7DD3FA', letterSpacing: 1, fontFamily: 'Inter_800ExtraBold' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: SURFACE, letterSpacing: -0.8, lineHeight: 30, fontFamily: 'Inter_900Black' },
  heroSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_500Medium' },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  heroCtaT: { fontSize: 13, fontWeight: '700', color: SURFACE, fontFamily: 'Inter_700Bold' },

  // Card
  cardWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 10,
  },

  // Share line
  shareLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 2 },
  shareLineT: { fontSize: 13, fontWeight: '700', color: BRAND, fontFamily: 'Inter_700Bold' },

  // Quick actions
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

  // Section
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.4, fontFamily: 'Inter_800ExtraBold' },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll: { fontSize: 13, fontWeight: '600', color: BRAND, fontFamily: 'Inter_600SemiBold' },

  // Card scroll
  cardScroll: { gap: 12, paddingRight: 4 },
  addTile: { width: 148, height: 168, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(37,150,190,0.35)', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 },
  addTileT: { fontSize: 12, fontWeight: '700', color: BRAND, fontFamily: 'Inter_700Bold' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: SURFACE, borderRadius: 18, padding: 16, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  statVal: { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -1, fontFamily: 'Inter_900Black' },
  statLbl: { fontSize: 10, fontWeight: '600', color: MUTED, fontFamily: 'Inter_600SemiBold' },

  // Orders
  ordersCard: { backgroundColor: SURFACE, borderRadius: 20, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 },

  // Guest CTA
  guestCta: { borderRadius: 22, overflow: 'hidden', shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 8 },
  guestCtaInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  guestCtaCopy: { flex: 1, gap: 3 },
  guestCtaTitle: { fontSize: 16, fontWeight: '800', color: SURFACE, fontFamily: 'Inter_800ExtraBold' },
  guestCtaSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_500Medium' },

  // Demo link
  demoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 },
  demoLinkT: { fontSize: 13, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
});

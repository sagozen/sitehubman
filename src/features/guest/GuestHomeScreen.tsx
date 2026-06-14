import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useOrders } from '@/src/hooks/useOrders';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import type { Order } from '@/src/types/models';

// ─── Brand ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const SURFACE = '#FFFFFF';
const BG = '#F5F5F7';

// ─── Quick actions ───────────────────────────────────────────────────────────
const ACTIONS: {
  icon: AppIconName;
  label: string;
  color: string;
  route?: Href;
  action?: 'share';
}[] = [
  { icon: 'CreditCard', label: 'Card', color: INK, route: appRoutes.guestDesign as Href },
  { icon: 'Users', label: 'Network', color: INK, route: appRoutes.customerConnections as Href },
  { icon: 'BarChart', label: 'Insights', color: INK, route: appRoutes.guestAnalytics as Href },
  { icon: 'Sparkles', label: 'Studio', color: BRAND, route: appRoutes.studio as Href },
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
  const { unreadCount } = useNotifications();
  const { orders } = useOrders(user?.role ?? 'guest', user?.id ?? '');
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);

  useEffect(() => {
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

          {/* ── GUEST PROFILE HEADER ── */}
          <View style={s.profileHeader}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [s.profileAvatar, pressed && s.pressed]}
            >
              <AppText style={s.profileAvatarT}>{initial}</AppText>
            </Pressable>
            <View style={s.profileCopy}>
              <AppText style={s.kicker}>{greeting(user?.displayName)}</AppText>
              <View style={s.profileNameRow}>
                <AppText style={s.profileName} numberOfLines={1}>
                  {heroName || user?.displayName || 'Your Name'}
                </AppText>
                <AppIcon name="BadgeCheck" size={18} color={BRAND} />
              </View>
              <AppText style={s.identityMeta} numberOfLines={1}>
                {[heroTitle || 'Digital identity', cardProfile?.company || 'NFC Global'].filter(Boolean).join(' / ')}
              </AppText>
            </View>
            <View style={s.headerActions}>
              <Pressable
                onPress={() => isGuest ? requireAccount(undefined, { message: 'Sign in to receive card and profile notifications.' }) : router.push('/(tabs)/notifications')}
                style={({ pressed }) => [s.headerIcon, pressed && s.pressed]}
              >
                <AppIcon name="Bell" size={19} color={INK} />
                {unreadCount > 0 ? <View style={s.unreadDot} /> : null}
              </Pressable>
              <Pressable onPress={() => router.push(appRoutes.studio as Href)} style={({ pressed }) => [s.headerIcon, pressed && s.pressed]}>
                <AppIcon name="Sparkles" size={20} color={BRAND} />
              </Pressable>
            </View>
          </View>

          {/* ── NFC CARD — full width, card dominates ── */}
          <View style={s.cardWrap}>
            <NfcGlobalCardFace
              fullName={heroName || undefined}
              title={heroTitle || undefined}
              phone={heroPhone || undefined}
              email={heroEmail || undefined}
            />
          </View>

          {/* Primary action */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [s.shareButton, pressed && s.pressed]}
          >
            <AppIcon name="Share" size={18} color="#FFFFFF" />
            <AppText style={s.shareButtonT}>Share profile</AppText>
          </Pressable>

          {/* ── QUICK ACTIONS — compact strip, card already did the talking ── */}
          <View style={s.actionStrip}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => handleAction(a)}
                style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <AppIcon name={a.icon} size={24} color={a.color} />
                <AppText style={s.actionLabel}>{a.label}</AppText>
              </Pressable>
            ))}
          </View>

          {/* ── RECENT ACTIVITY ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <AppText style={s.sectionTitle}>Recent Activity</AppText>
            </View>
            <View style={s.activityList}>
              {[
                ['Profile viewed', 'Today'],
                ['Connection made', 'Ready'],
                ['Card scanned', isGuest ? 'Preview' : 'Live'],
              ].map(([title, meta], i) => (
                <View key={title} style={[s.activityRow, i === 2 && s.activityRowLast]}>
                  <AppText style={s.activityTitle}>{title}</AppText>
                  <AppText style={s.activityMeta}>{meta}</AppText>
                </View>
              ))}
            </View>
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

          {/* ── PRODUCTS ── */}
          <View style={s.section}>
            <AppText style={s.sectionTitle}>Products</AppText>
            <View style={s.productList}>
              {['Physical NFC cards', 'Digital products', 'Services'].map((item, i) => (
                <Pressable
                  key={item}
                  onPress={() => i === 0 ? router.push(appRoutes.guestDesign as Href) : requireAccount(undefined, { message: 'Sign in to unlock your NFC Global products.' })}
                  style={({ pressed }) => [s.productRow, i === 2 && s.activityRowLast, pressed && s.pressed]}
                >
                  <AppText style={s.productTitle}>{item}</AppText>
                  <AppIcon name="ChevronRight" size={15} color={MUTED} />
                </Pressable>
              ))}
            </View>
          </View>

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
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 120, gap: 24 },

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

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarT: { fontSize: 21, fontWeight: '900', color: SURFACE, fontFamily: 'Inter_900Black' },
  profileCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: { fontSize: 12, fontWeight: '700', color: MUTED, fontFamily: 'Inter_700Bold' },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  profileName: {
    flexShrink: 1,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    color: INK,
    fontFamily: 'Inter_900Black',
  },
  identityMeta: { fontSize: 12, fontWeight: '700', color: MUTED, fontFamily: 'Inter_700Bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },

  // Card — full width, real aspect ratio, dominant
  cardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 10,
  },

  // Share
  shareButton: { height: 56, borderRadius: 28, backgroundColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  shareButtonT: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Inter_900Black' },

  // Action strip — compact, card already did the talking
  actionStrip: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 7 },
  actionLabel: { fontSize: 11, fontWeight: '800', color: INK2, textAlign: 'center', fontFamily: 'Inter_800ExtraBold' },
  actionSub: { fontSize: 9, fontWeight: '500', color: MUTED },

  // Section
  section: { gap: 14, marginTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.4, fontFamily: 'Inter_800ExtraBold' },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll: { fontSize: 13, fontWeight: '600', color: BRAND, fontFamily: 'Inter_600SemiBold' },

  activityList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  activityRow: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  activityRowLast: { borderBottomWidth: 0 },
  activityTitle: { fontSize: 16, fontWeight: '700', color: INK, fontFamily: 'Inter_700Bold' },
  activityMeta: { fontSize: 13, fontWeight: '600', color: MUTED, fontFamily: 'Inter_600SemiBold' },

  productList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  productRow: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  productTitle: { fontSize: 16, fontWeight: '800', color: INK, fontFamily: 'Inter_800ExtraBold' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: SURFACE, borderRadius: 18, padding: 16, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  statVal: { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -1, fontFamily: 'Inter_900Black' },
  statLbl: { fontSize: 10, fontWeight: '600', color: MUTED, fontFamily: 'Inter_600SemiBold' },

  // Orders
  ordersCard: { backgroundColor: SURFACE, borderRadius: 20, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 },

  // Demo link
  demoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 },
  demoLinkT: { fontSize: 13, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
});

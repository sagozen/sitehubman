import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';
import {
  fetchOwnerLeads,
  toggleLeadFollowedUp,
  QualifiedLead,
} from '@/src/services/leadWorkflowService';
import { ConnectIntentModal } from '@/src/components/ConnectIntentModal';
import { CardSuccessShareModal } from '@/src/features/guest/CardSuccessShareModal';
import { EmptyCardState } from '@/src/components/EmptyCardState';

const { width: SW } = Dimensions.get('window');
const MAX_W = 640;
const PROMO_W = Math.min(SW - 40, MAX_W - 40);

// ── Accent: teal + depth palette ─────────────────────────────────────────────
const TEAL = '#00C8D4';
const TEAL_DIM = 'rgba(0,200,212,0.18)';
const TEAL_GLOW = 'rgba(0,200,212,0.28)';
const CARD_BG = '#0E0E12';
const TILE_BG = '#13131A';

// ── Custom premium icon images ───────────────────────────────────────────────
const CUSTOM_ICONS = {
  accounts:  require('@/assets/images/icon_accounts.jpg'),
  transfers: require('@/assets/images/icon_transfers.jpg'),
  payments:  require('@/assets/images/icon_payments.jpg'),
  analytics: require('@/assets/images/icon_analytics.jpg'),
  favorites: require('@/assets/images/icon_favorites.jpg'),
} as const;

// ── Bento data ────────────────────────────────────────────────────────────────
const BENTO = [
  { id: 'profile',   icon: 'Briefcase',  label: 'My Profile',   route: '/(tabs)/profile',      customImage: null },
  { id: 'card',      icon: 'CreditCard', label: 'Payments',     action: 'card',                customImage: CUSTOM_ICONS.payments },
  { id: 'nfc',       icon: 'Radio',      label: 'Transfers',    action: 'nfc',                 customImage: CUSTOM_ICONS.transfers },
  { id: 'leads',     icon: 'Users',      label: 'Connections',  route: '/(tabs)/connections',  customImage: CUSTOM_ICONS.accounts },
  { id: 'analytics', icon: 'BarChart2',  label: 'Analytics',    action: 'analytics',           customImage: CUSTOM_ICONS.analytics },
  { id: 'favorites', icon: 'Star',       label: 'Favorites',    action: 'share',               customImage: CUSTOM_ICONS.favorites },
] as const;

const QUICK_PILLS = [
  { id: 'miniapps',  icon: 'Grid',      label: 'Mini Apps' },
  { id: 'analytics', icon: 'BarChart2', label: 'Analytics' },
  { id: 'auto',      icon: 'Calendar',  label: 'Auto Save' },
  { id: 'export',    icon: 'Download',  label: 'Export' },
  { id: 'settings',  icon: 'Settings',  label: 'Settings' },
] as const;

const PROMOS = [
  { id: 'p1', bg: ['#0D2E1A', '#1A5C34'] as [string,string], shine: ['rgba(0,220,100,0.13)', 'transparent'] as [string,string], title: 'NFC ELITE REWARDS', subtitle: 'Capture verified leads\nwith intent scoring', highlight: '500', unit: 'LEADS FREE', color: '#2ECC71' },
  { id: 'p2', bg: ['#0A1A3A', '#1A3A6E'] as [string,string], shine: ['rgba(0,150,255,0.13)', 'transparent'] as [string,string], title: 'PRO PLAN DEAL', subtitle: 'First 3 months at\nhalf price for new signups', highlight: '50%', unit: 'OFF NOW', color: '#60A5FA' },
  { id: 'p3', bg: ['#2A1800', '#4E2D00'] as [string,string], shine: ['rgba(255,180,0,0.15)', 'transparent'] as [string,string], title: 'REFERRAL BONUS', subtitle: 'Refer executives &\nearn SiteHub credits', highlight: '3X', unit: 'REWARDS', color: '#F59E0B' },
];

const MINI_APPS = [
  { id: 'crm',      icon: 'Users',     label: 'CRM Sync' },
  { id: 'calendar', icon: 'Calendar',  label: 'Scheduler' },
  { id: 'scan',     icon: 'Scan',      label: 'NFC Scan' },
  { id: 'email',    icon: 'Mail',      label: 'Email' },
  { id: 'docs',     icon: 'FileText',  label: 'Proposals' },
  { id: 'pay',      icon: 'Zap',       label: 'Quick Pay' },
];

// ── 3D Bento Tile ─────────────────────────────────────────────────────────────
const BentoTile = React.memo(({ item, onPress }: { item: typeof BENTO[number]; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shadow = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => {
        HapticTap.selection();
        Animated.parallel([
          Animated.spring(scale, { toValue: 0.91, useNativeDriver: true, speed: 60, bounciness: 3 }),
          Animated.timing(shadow, { toValue: 0, duration: 80, useNativeDriver: false }),
        ]).start();
      }}
      onPressOut={() => {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 12 }),
          Animated.timing(shadow, { toValue: 1, duration: 200, useNativeDriver: false }),
        ]).start();
      }}
      onPress={onPress}
      hitSlop={2}
      style={styles.bentoCell}
    >
      {/* 3D extrusion shadow layer */}
      <Animated.View
        style={[
          styles.bentoCellShadow,
          {
            shadowOpacity: shadow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }),
          },
        ]}
      >
        <Animated.View style={[styles.bentoCellInner, { transform: [{ scale }] }]}>
          {/* Top-edge highlight for 3D depth */}
          <View style={styles.bentoTopShine} />
          {/* Custom image icon OR fallback teal AppIcon */}
          {item.customImage ? (
            <View style={styles.bentoImgWrap}>
              {/* Glow halo behind image */}
              <View style={styles.bentoImgGlow} />
              <Image
                source={item.customImage}
                style={styles.bentoImg}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.bentoGlowRing}>
              <LinearGradient
                colors={[TEAL_GLOW, TEAL_DIM]}
                style={styles.bentoGlowGrad}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              />
              <View style={styles.bentoIconInner}>
                <AppIcon name={item.icon as any} size={22} color={TEAL} />
              </View>
            </View>
          )}
          <AppText style={styles.bentoLabel} weight="medium">{item.label}</AppText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

// ── 3D Icon Nav Button ────────────────────────────────────────────────────────
const NavIconBtn = ({ icon, color = '#AEAEB2', bg = TILE_BG, onPress, hasNotif = false }: {
  icon: string; color?: string; bg?: string; onPress: () => void; hasNotif?: boolean;
}) => (
  <Pressable onPress={onPress} hitSlop={10} style={styles.navBtn3D}>
    <LinearGradient colors={[bg, '#090910']} style={styles.navBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <View style={styles.navBtnShine} />
      <AppIcon name={icon as any} size={19} color={color} />
    </LinearGradient>
    {hasNotif && <View style={styles.notifBadge} />}
  </Pressable>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export function SiteHubHomeScreen() {
  const { user, signOutUser } = useAuth();
  const [leads, setLeads] = useState<QualifiedLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toastOp = useRef(new Animated.Value(0)).current;
  const promoRef = useRef<FlatList>(null);

  const ownerId = user?.id ?? 'demo_owner';
  const ownerName = user?.displayName || 'Alexander Wright';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!';

  const toast = useCallback((msg: string) => {
    HapticTap.light();
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOp, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOp, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  }, [toastOp]);

  const loadData = useCallback(async () => {
    try {
      const f = await fetchOwnerLeads(ownerId, 10);
      setLeads(f);
    } catch {
      setLeads([
        { id: 'l1', ownerId, name: 'Sarah Chen', contactInfo: '+1 555-234-5678', intent: 'services', intentLabel: 'Services', note: '', followedUp: false },
        { id: 'l2', ownerId, name: 'Raj Patel', contactInfo: 'raj@patelcapital.com', intent: 'investment', intentLabel: 'Investment', note: '', followedUp: true },
        { id: 'l3', ownerId, name: 'Emma Liu', contactInfo: 'eliu@vertexio.com', intent: 'partnership', intentLabel: 'Partnership', note: '', followedUp: false },
      ]);
    } finally { setRefreshing(false); }
  }, [ownerId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const t = setInterval(() => {
      setPromoIndex((p) => {
        const n = (p + 1) % PROMOS.length;
        promoRef.current?.scrollToIndex({ index: n, animated: true });
        return n;
      });
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const handleToggle = useCallback(async (lead: QualifiedLead) => {
    if (!lead.id) return;
    HapticTap.light();
    const ns = !lead.followedUp;
    setLeads((p) => p.map((l) => l.id === lead.id ? { ...l, followedUp: ns } : l));
    await toggleLeadFollowedUp(lead.id, lead.followedUp);
    toast(ns ? 'Followed Up ✓' : 'Back to Active');
  }, [toast]);

  const handleBento = useCallback((item: typeof BENTO[number]) => {
    HapticTap.medium();
    if ('route' in item && item.route) { router.push(item.route as any); return; }
    if (item.action === 'share') { setShowShareModal(true); return; }
    if (item.action === 'nfc') { setShowConnectModal(true); return; }
    toast(item.action === 'analytics' ? 'Analytics — Coming Soon' : 'Card Studio — Coming Soon');
  }, [toast]);

  const onPromoScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (PROMO_W + 12));
    setPromoIndex(Math.max(0, Math.min(idx, PROMOS.length - 1)));
  }, []);

  return (
    <SafeAreaView style={styles.app} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={TEAL} />}
      >
        {/* ── TOP NAV — 3D icon buttons right-aligned ── */}
        <View style={styles.topRow}>
          <NavIconBtn icon="MessageCircle" onPress={() => toast('Messages — Coming Soon')} />
          <NavIconBtn icon="Bell" hasNotif onPress={() => toast('Notifications')} />
          <NavIconBtn icon="Wallet" onPress={() => toast('Wallet — Coming Soon')} />
          {user?.isGuest ? (
            <NavIconBtn icon="LogIn" bg="#C0392B" color="#FFFFFF" onPress={() => router.push('/(auth)/login' as any)} />
          ) : (
            <NavIconBtn icon="LogOut" bg="#C0392B" color="#FFFFFF" onPress={() => {
              HapticTap.medium();
              Alert.alert('Sign Out', 'Sign out of SiteHub?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOutUser(); router.replace('/(auth)/login' as any); } },
              ]);
            }} />
          )}
        </View>

        {/* ── GREETING ROW — 3D avatar ── */}
        <View style={styles.greetRow}>
          <Pressable onPress={() => router.push('/(tabs)/profile' as any)} hitSlop={8}>
            {/* Outer glow ring */}
            <View style={styles.avatarGlow}>
              <LinearGradient colors={[TEAL, '#004E5A']} style={styles.avatarRingGrad}>
                <LinearGradient colors={['#1C3D50', '#0A1628']} style={styles.avatarCircle}>
                  <AppText style={styles.avatarInitials} weight="extrabold">
                    {ownerName.substring(0, 2).toUpperCase()}
                  </AppText>
                </LinearGradient>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
          </Pressable>
          <View>
            <AppText style={styles.greetSub}>{greeting}</AppText>
            <AppText style={styles.greetName} weight="extrabold">{ownerName.split(' ')[0]}</AppText>
          </View>
        </View>

        <View style={styles.container}>

          {/* ── 3D MAIN CARD ── */}
          {user?.isGuest && !user?.displayName ? <EmptyCardState /> : (
            <View style={styles.mainCardShadow}>
              <LinearGradient
                colors={['#1A1A24', CARD_BG]}
                style={styles.mainCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 1 }}
              >
                {/* Top-edge shine for 3D lift */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.09)', 'transparent']}
                  style={styles.cardTopShine}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />

                {/* Balance */}
                <View style={styles.balanceRow}>
                  <View style={{ flex: 1 }}>
                    {balanceVisible ? (
                      <AppText style={styles.balanceAmt} weight="extrabold">248 Profile Taps</AppText>
                    ) : (
                      <View style={styles.blurRow}>
                        {[...Array(6)].map((_, i) => <View key={i} style={styles.blurBlock} />)}
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={() => { HapticTap.selection(); setBalanceVisible(v => !v); }}
                    hitSlop={14}
                    style={styles.eyeBtn3D}
                  >
                    <LinearGradient colors={['#2A2A36', '#18181F']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                    <AppIcon name={balanceVisible ? 'Eye' : 'EyeOff'} size={18} color="#8E8E93" />
                  </Pressable>
                </View>

                {/* Plan badge */}
                <View style={styles.planRow}>
                  <LinearGradient colors={[TEAL, '#007A84']} style={styles.planBadge}>
                    <AppText style={styles.planBadgeText} weight="extrabold">PRO</AppText>
                  </LinearGradient>
                  <AppText style={styles.planLabel}>Executive Suite</AppText>
                </View>

                {/* Divider with glow */}
                <View style={styles.glowDivider}>
                  <LinearGradient colors={['transparent', TEAL_GLOW, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
                </View>

                {/* Action row */}
                <View style={styles.cardActionRow}>
                  {[
                    { label: 'Receive', icon: 'ArrowDownLeft', color: '#30D158', onPress: () => setShowConnectModal(true) },
                    { label: 'Send', icon: 'Share2', color: '#FF453A', onPress: () => setShowShareModal(true) },
                    { label: 'Analytics', icon: 'BarChart2', color: TEAL, onPress: () => toast('Analytics — Coming Soon') },
                  ].map((a, i, arr) => (
                    <React.Fragment key={a.label}>
                      <Pressable style={styles.cardAction} onPress={a.onPress} hitSlop={8}>
                        {/* 3D pill icon */}
                        <View style={[styles.actionIconShadow, { shadowColor: a.color }]}>
                          <LinearGradient
                            colors={[a.color, `${a.color}99`]}
                            style={styles.actionIconGrad}
                            start={{ x: 0.2, y: 0 }}
                            end={{ x: 0.8, y: 1 }}
                          >
                            <View style={styles.actionIconShine} />
                            <AppIcon name={a.icon as any} size={16} color="#000000" />
                          </LinearGradient>
                        </View>
                        <AppText style={styles.actionLabel}>{a.label}</AppText>
                      </Pressable>
                      {i < arr.length - 1 && <View style={styles.cardVDivider} />}
                    </React.Fragment>
                  ))}
                </View>
              </LinearGradient>
            </View>
          )}

          {/* ── 3×2 BENTO GRID ── */}
          <View style={styles.bentoGrid}>
            {BENTO.map((item) => (
              <BentoTile key={item.id} item={item} onPress={() => handleBento(item)} />
            ))}
          </View>

          {/* ── 3D QUICK PILL STRIP ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillStrip}>
            {QUICK_PILLS.map((qa) => (
              <Pressable
                key={qa.id}
                hitSlop={8}
                onPress={() => {
                  HapticTap.selection();
                  if (qa.id === 'export') toast('Exporting CSV…');
                  else if (qa.id === 'settings') router.push('/(tabs)/profile' as any);
                  else if (qa.id === 'analytics') router.push('/(tabs)/connections' as any);
                  else toast(`${qa.label} — Coming Soon`);
                }}
              >
                <LinearGradient colors={['#1E1E28', '#111118']} style={styles.quickPill3D} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
                  <View style={styles.pillTopShine} />
                  <View style={styles.pillRedDot} />
                  <AppIcon name={qa.icon as any} size={13} color={TEAL} />
                  <AppText style={styles.pillText} weight="bold">{qa.label}</AppText>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── NEWS & PROMOTIONS ── */}
          <AppText style={styles.sectionTitle} weight="extrabold">News &amp; Promotions</AppText>

          <FlatList
            ref={promoRef}
            data={PROMOS}
            keyExtractor={it => it.id}
            horizontal
            snapToInterval={PROMO_W + 12}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            onScroll={onPromoScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={[styles.promoShadow, { shadowColor: item.color }]}>
                <LinearGradient colors={item.bg} style={styles.promoBanner}>
                  {/* Shine overlay */}
                  <LinearGradient colors={item.shine} style={styles.promoBannerShine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={styles.promoContent}>
                    <AppText style={styles.promoTitle} weight="extrabold">{item.title}</AppText>
                    <AppText style={styles.promoDesc}>{item.subtitle}</AppText>
                    <View style={styles.promoNumRow}>
                      <AppText style={[styles.promoNum, { color: item.color }]} weight="extrabold">{item.highlight}</AppText>
                      <AppText style={[styles.promoUnit, { color: item.color }]} weight="bold">{item.unit}</AppText>
                    </View>
                    <View style={styles.promoCTA}>
                      <AppText style={styles.promoCTAText} weight="bold">SiteHub Users</AppText>
                    </View>
                  </View>
                  <View style={{ opacity: 0.25, paddingLeft: 8 }}>
                    <AppIcon name="Award" size={80} color={item.color} />
                  </View>
                </LinearGradient>
              </View>
            )}
          />
          <View style={styles.dots}>
            {PROMOS.map((_, i) => <View key={i} style={[styles.dot, i === promoIndex && styles.dotActive]} />)}
          </View>

          {/* ── MINI APPS ── */}
          <AppText style={styles.sectionTitle} weight="extrabold">Mini Apps</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4, marginBottom: 28 }}>
            {MINI_APPS.map((app) => (
              <Pressable key={app.id} hitSlop={8} onPress={() => toast(`${app.label} — Coming Soon`)}>
                <View style={styles.miniTileShadow}>
                  <LinearGradient colors={['#1A1A24', TILE_BG]} style={styles.miniTile} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
                    <View style={styles.miniTileShine} />
                    <View style={styles.miniIconRing}>
                      <AppIcon name={app.icon as any} size={20} color={TEAL} />
                    </View>
                    <AppText style={styles.miniLabel} weight="medium">{app.label}</AppText>
                  </LinearGradient>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── DEAL PIPELINE ── */}
          <View style={styles.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText style={styles.sectionTitle} weight="extrabold">Deal Pipeline</AppText>
              <View style={styles.newBadge}>
                <AppText style={styles.newBadgeText} weight="bold">{leads.filter(l => !l.followedUp).length} NEW</AppText>
              </View>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/connections' as any)} hitSlop={10}>
              <AppText style={styles.seeAll}>View CRM →</AppText>
            </Pressable>
          </View>

          <View style={styles.pipelineShadow}>
            <LinearGradient colors={['#17171F', CARD_BG]} style={styles.pipeline} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
              <View style={styles.pipelineTopShine} />
              {leads.map((lead, i) => (
                <React.Fragment key={lead.id ?? `l-${i}`}>
                  <View style={styles.leadRow}>
                    <View style={styles.leadAvatar}>
                      <AppText style={styles.leadInitials} weight="extrabold">{lead.name.substring(0, 2).toUpperCase()}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.leadName} weight="bold">{lead.name}</AppText>
                      <AppText style={styles.leadContact}>{lead.contactInfo}</AppText>
                    </View>
                    <View style={[styles.intentTag, lead.followedUp && styles.intentDone]}>
                      <AppText style={[styles.intentText, lead.followedUp && { color: '#30D158' }]} weight="bold">
                        {lead.followedUp ? 'Done' : lead.intentLabel}
                      </AppText>
                    </View>
                    <Pressable hitSlop={12} onPress={() => handleToggle(lead)} style={[styles.checkBtn, lead.followedUp && styles.checkDone]}>
                      <AppIcon name={lead.followedUp ? 'Check' : 'Clock'} size={14} color={lead.followedUp ? '#30D158' : '#636366'} />
                    </Pressable>
                  </View>
                  {i < leads.length - 1 && <View style={styles.leadDivider} />}
                </React.Fragment>
              ))}
              <Pressable style={styles.simBtn} onPress={() => setShowConnectModal(true)} hitSlop={12}>
                <AppIcon name="Plus" size={15} color={TEAL} />
                <AppText style={styles.simBtnText} weight="bold">Simulate NFC Tap</AppText>
              </Pressable>
            </LinearGradient>
          </View>

          <View style={{ height: 130 }} />
        </View>
      </ScrollView>

      {/* ── TOAST ── */}
      {toastMsg !== null && (
        <Animated.View style={[styles.toast, { opacity: toastOp }]}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <AppText style={styles.toastText} weight="bold">{toastMsg}</AppText>
        </Animated.View>
      )}

      <ConnectIntentModal visible={showConnectModal} onClose={() => setShowConnectModal(false)} ownerId={ownerId} ownerName={ownerName} onSuccess={() => loadData()} />
      <CardSuccessShareModal visible={showShareModal} onClose={() => setShowShareModal(false)} url={`https://sitehub.app/u/${user?.id ?? 'demo'}`} name={ownerName} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#07070B' },
  scroll: { paddingBottom: 40 },
  container: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: MAX_W,
    alignSelf: 'center',
  },

  // ── Top nav ──
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    maxWidth: MAX_W,
    width: '100%',
    alignSelf: 'center',
  },
  navBtn3D: {
    width: 40, height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    // 3D drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  navBtnGrad: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  navBtnShine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5, borderColor: '#07070B',
  },

  // ── Greeting ──
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxWidth: MAX_W,
    width: '100%',
    alignSelf: 'center',
  },
  avatarGlow: {
    position: 'relative',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  avatarRingGrad: {
    width: 56, height: 56,
    borderRadius: 28,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 52, height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#FFFFFF', fontSize: 17 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#30D158',
    borderWidth: 2.5, borderColor: '#07070B',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  greetSub: { color: '#8E8E93', fontSize: 13 },
  greetName: { color: '#FFFFFF', fontSize: 22, letterSpacing: -0.5 },

  // ── Main card ──
  mainCardShadow: {
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 14,
  },
  mainCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 20,
    overflow: 'hidden',
  },
  cardTopShine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1.5,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  balanceAmt: { color: '#FFFFFF', fontSize: 22, letterSpacing: -0.8 },
  blurRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 },
  blurBlock: { width: 22, height: 10, borderRadius: 5, backgroundColor: '#2A2A35' },
  eyeBtn3D: {
    width: 38, height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 5,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  planBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 6,
  },
  planBadgeText: { color: '#000000', fontSize: 10, letterSpacing: 0.5 },
  planLabel: { color: '#8E8E93', fontSize: 13 },
  glowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  cardAction: { flex: 1, alignItems: 'center', gap: 8 },
  actionIconShadow: {
    borderRadius: 22,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 8,
  },
  actionIconGrad: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  actionIconShine: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 14,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  actionLabel: { color: '#AEAEB2', fontSize: 13 },
  cardVDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.05)' },

  // ── Bento grid ──
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  bentoCell: { width: `${(100 - 20) / 3}%` },
  bentoCellShadow: {
    borderRadius: 20,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  bentoCellInner: {
    backgroundColor: TILE_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  bentoTopShine: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bentoGlowRing: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,200,212,0.40)',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  bentoGlowGrad: { ...StyleSheet.absoluteFillObject },
  bentoIconInner: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  // Custom image icon styles
  bentoImgWrap: {
    width: 58, height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  bentoImgGlow: {
    position: 'absolute',
    width: 70, height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212,160,23,0.18)',
    top: -6, left: -6,
  },
  bentoImg: {
    width: 58, height: 58,
    borderRadius: 16,
  },
  bentoLabel: { color: '#FFFFFF', fontSize: 11, textAlign: 'center' },

  // ── Quick pill strip ──
  pillStrip: { gap: 8, paddingRight: 4, marginBottom: 24 },
  quickPill3D: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 5,
    elevation: 5,
  },
  pillTopShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  pillRedDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  pillText: { color: '#AEAEB2', fontSize: 13 },

  // ── Promo ──
  promoShadow: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  promoBanner: {
    width: PROMO_W, borderRadius: 20,
    padding: 20,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', minHeight: 130,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  promoBannerShine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  promoContent: { flex: 1, gap: 6 },
  promoTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 9, letterSpacing: 1.8 },
  promoDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
  promoNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  promoNum: { fontSize: 44, letterSpacing: -2 },
  promoUnit: { fontSize: 11, letterSpacing: 0.8 },
  promoCTA: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  promoCTAText: { color: '#FFFFFF', fontSize: 11 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10, marginBottom: 24 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#2C2C2E' },
  dotActive: { width: 22, backgroundColor: TEAL, shadowColor: TEAL, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 4 },

  // ── Section headers ──
  sectionTitle: { color: '#FFFFFF', fontSize: 18, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  newBadge: {
    backgroundColor: TEAL_DIM, borderWidth: 1, borderColor: 'rgba(0,200,212,0.3)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  newBadgeText: { color: TEAL, fontSize: 9, letterSpacing: 0.5 },
  seeAll: { color: TEAL, fontSize: 13 },

  // ── Mini apps ──
  miniTileShadow: {
    borderRadius: 18,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 7,
  },
  miniTile: {
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 16, paddingHorizontal: 16,
    alignItems: 'center', gap: 10,
    minWidth: 82,
    overflow: 'hidden',
  },
  miniTileShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
  },
  miniIconRing: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: 'rgba(0,200,212,0.38)',
    backgroundColor: TEAL_DIM,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 6,
  },
  miniLabel: { color: '#AEAEB2', fontSize: 11, textAlign: 'center' },

  // ── Pipeline ──
  pipelineShadow: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  pipeline: {
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  pipelineTopShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  leadRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  leadAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1E1E28',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  leadInitials: { color: '#FFFFFF', fontSize: 13 },
  leadName: { color: '#FFFFFF', fontSize: 14 },
  leadContact: { color: '#636366', fontSize: 11, marginTop: 1 },
  intentTag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(255,159,10,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,159,10,0.3)',
  },
  intentDone: { backgroundColor: 'rgba(48,209,88,0.1)', borderColor: 'rgba(48,209,88,0.2)' },
  intentText: { color: '#FF9F0A', fontSize: 9, letterSpacing: 0.5 },
  checkBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A1A22',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { borderColor: 'rgba(48,209,88,0.3)', backgroundColor: 'rgba(48,209,88,0.08)' },
  leadDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },
  simBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  simBtnText: { color: TEAL, fontSize: 13 },

  // ── Toast ──
  toast: {
    position: 'absolute', bottom: 110, alignSelf: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, overflow: 'hidden',
  },
  toastText: { color: '#FFFFFF', fontSize: 13 },
});

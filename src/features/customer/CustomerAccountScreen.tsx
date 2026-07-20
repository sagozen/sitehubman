import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Image,
  ScrollView,
  useWindowDimensions,
  Alert,
  Share,
} from 'react-native';
import { HapticTap } from '@/src/utils/haptics';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerOrders } from '@/src/hooks/useCustomerOrders';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { useBioPage } from '@/src/hooks/useBioPage';
import type { Order } from '@/src/types/models';
import { FAB } from '@/src/components/FAB';
import { QuickActionModal } from '@/src/components/QuickActionModal';
import { pageThemes } from '@/src/constants/pageThemes';

// ─── Apple Pack Marketplace Palette ─────────────────────────────────────────
const APPLE_BLUE = '#0071E3';
const APPLE_GRAY = '#86868B';
const APPLE_BG_LIGHT = '#F4F9FF'; // Refreshing cool ice blue
const APPLE_BG_DARK = pageThemes.home.canvas;
const APPLE_CARD_LIGHT = '#FFFFFF';
const APPLE_CARD_DARK = pageThemes.home.surface;
const APPLE_TEXT_LIGHT = '#0F172A';
const APPLE_TEXT_DARK = pageThemes.home.text;
const APPLE_GREEN = '#34C759';
const APPLE_ORANGE = '#FF9500';

const ACTIONS = [
  { label: 'Edit Profile', subtitle: 'Update bio & links', route: appRoutes.guestDesign as Href, icon: 'PenLine' as AppIconName, image: require('@/assets/images/3d_create_card_v2.png'), color: APPLE_BLUE },
  { label: 'My Network', subtitle: 'Manage leads & contacts', route: appRoutes.customerConnections as Href, icon: 'Users' as AppIconName, image: require('@/assets/images/3d_share_card_v2.png'), color: APPLE_BLUE },
  { label: 'Tap Analytics', subtitle: 'Track scans & CTR', route: appRoutes.customerAnalysis as Href, icon: 'BarChart2' as AppIconName, image: require('@/assets/images/3d_analytics_v2.png'), color: APPLE_BLUE },
  { label: 'NFC Hardware', subtitle: 'Link tag or badge', route: appRoutes.nfcDemo as Href, icon: 'Nfc' as AppIconName, image: require('@/assets/images/3d_signals_v2.png'), color: APPLE_BLUE },
];

function orderStatus(s: string): { label: string; color: string } {
  if (['production_approved', 'printer_assigned', 'printing', 'nfc_writing', 'nfc_verification', 'qa_pending', 'qa_failed'].includes(s))
    return { label: 'In Production', color: APPLE_ORANGE };
  if (['shipped', 'ready_to_ship'].includes(s))
    return { label: 'Shipped', color: APPLE_GREEN };
  if (s === 'delivered') return { label: 'Delivered', color: APPLE_BLUE };
  return { label: 'Processing', color: APPLE_GRAY };
}

function OrderRow({ order, onPress, isDark }: { order: Order; onPress: () => void; isDark: boolean }) {
  const st = orderStatus(order.status);
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const amt = order.amount != null ? `$${order.amount.toFixed(0)}` : '—';
  return (
    <Pressable
      onPress={() => {
        HapticTap.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.orderRowContainer,
        pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
      ]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <View style={styles.orderRow}>
        <View style={[styles.orderIcon, { backgroundColor: isDark ? 'rgba(0,113,227,0.15)' : 'rgba(0,113,227,0.08)' }]}>
          <AppIcon name="CreditCard" size={20} color={APPLE_BLUE} />
        </View>
        <View style={styles.orderInfo}>
          <AppText variant="body" weight="semibold" style={{ color: isDark ? APPLE_TEXT_DARK : APPLE_TEXT_LIGHT }}>
            {order.customerName || 'NFC Card'}
          </AppText>
          <AppText variant="caption" style={{ color: APPLE_GRAY }}>
            {order.quantity ?? 1}× {order.cardDesign?.replace(/_/g, ' ')}
          </AppText>
        </View>
        <View style={styles.orderMeta}>
          <View style={[styles.orderBadge, { backgroundColor: `${st.color}15` }]}>
            <AppText variant="caption" weight="semibold" style={{ color: st.color }}>
              {st.label}
            </AppText>
          </View>
          <AppText variant="bodySmall" weight="bold" style={{ color: isDark ? APPLE_TEXT_DARK : APPLE_TEXT_LIGHT }}>
            {amt}
          </AppText>
          <AppText variant="caption" style={{ color: APPLE_GRAY }}>
            {date}
          </AppText>
        </View>
        <AppIcon name="ChevronRight" size={15} color={APPLE_GRAY} />
      </View>
    </Pressable>
  );
}

function StatCard({ label, value, image, icon, color, style, isDark }: { label: string; value: string; image?: any; icon?: AppIconName; color?: string; style?: any; isDark: boolean }) {
  const textCol = isDark ? APPLE_TEXT_DARK : APPLE_TEXT_LIGHT;

  return (
    <View style={[styles.statCardContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }, style]}>
      {image ? (
        <Image source={image} style={{ width: 36, height: 36 }} resizeMode="contain" />
      ) : icon ? (
        <AppIcon name={icon} size={24} color={color || '#0071E3'} />
      ) : null}
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <AppText variant="title2" weight="bold" style={{ color: textCol }}>
          {value}
        </AppText>
        <AppText variant="caption" style={{ color: APPLE_GRAY }}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

export function CustomerAccountScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { orders } = useCustomerOrders(user?.id, user?.email);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] = useState<any>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const unreadCount = 0; // fallback or hook value
  const items = [];      // fallback or hook value
  const isDark = true;
  const { bioPage } = useBioPage(user?.id ?? '');

  // Responsive card width: clamp to a realistic Apple Wallet card dimension (max 380px)
  const cardWidth = Math.min(screenWidth - 40, 380);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        loadCustomerCloudCard(user.id),
        getCustomerInsights(user.id)
      ])
      .then(([cloudCardData, insightsData]) => {
        setCloudCard(cloudCardData);
        setInsights(insightsData);
      })
      .catch(err => {
        console.error('CustomerAccountScreen data load error:', err);
      })
    }
  }, [user?.id]);

  const recentOrders = useMemo(() => orders.slice(0, 2), [orders]);

  const cardProfile = cloudCard?.profile;
  const heroName = cardProfile?.fullName?.trim() || user?.displayName?.trim() || '';
  const heroTitle = cardProfile?.role?.trim() || '';

  const handleShare = React.useCallback(async () => {
    try {
      await Share.share({
        message: `Check out my digital business card: https://sitehubman.com/profile/${user?.id}`,
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  }, [user]);

  function handleAction(a: any) {
    if (a.action === 'share') {
      handleShare();
      return;
    }
    if (a.route) router.push(a.route);
  }

  // Theme configuration matching Apple Pack parameters
  const bgTheme = isDark ? APPLE_BG_DARK : APPLE_BG_LIGHT;
  const cardTheme = isDark ? APPLE_CARD_DARK : APPLE_CARD_LIGHT;
  const textTheme = isDark ? APPLE_TEXT_DARK : APPLE_TEXT_LIGHT;

  return (
    <View style={[styles.root, { backgroundColor: bgTheme }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <IosScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { maxWidth: 680, alignSelf: 'center', width: '100%' }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.profileHeader}>
            <Pressable
              onPress={() => {
                HapticTap.light();
                router.push('/profile' as any);
              }}
              style={({ pressed }) => [
                styles.fbAvatarBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {bioPage?.photoUrl ? (
                <Image source={{ uri: bioPage.photoUrl }} style={styles.fbAvatarImg} />
              ) : (
                <View style={styles.avatarNoBg}>
                  <AppIcon name="UserRound" size={28} color={textTheme} variant="solar-bold" />
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1 }} />
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  HapticTap.light();
                  router.push('/notifications');
                }}
                style={({ pressed }) => [
                  styles.inboxBtn,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <AppIcon name="Inbox" size={16} color="#FFFFFF" variant="solar-bold" />
                <AppText style={styles.inboxBtnText}>Inbox</AppText>
                <View style={styles.neonBadgePill}>
                  <AppText style={styles.neonBadgeNum}>
                    {unreadCount > 0 ? unreadCount : (items?.length || 0)}
                  </AppText>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  router.push(appRoutes.studio as Href);
                }}
                style={[styles.headerIcon, { backgroundColor: cardTheme }]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <AppIcon name="Wand2" size={19} color={textTheme} />
              </Pressable>
            </View>
          </View>

          {/* NFC Card Container — Responsive Apple Wallet Scale */}
          <View style={styles.cardContainer}>
            <View style={styles.cardElevation}>
              <NfcGlobalCardFace
                fullName={heroName}
                title={heroTitle}
                company={cardProfile?.company || undefined}
                phone={cardProfile?.phone || undefined}
                email={cardProfile?.email || undefined}
                website={cardProfile?.website || undefined}
                gradientIndex={cloudCard?.design?.gradientIndex ?? 0}
                backgroundImageUri={cloudCard?.design?.customImageUri || undefined}
                width={cardWidth}
              />
            </View>
          </View>

          {/* Primary Share Button - Ocean / Marine Fluid Card */}
          <Pressable
            onPress={() => {
              HapticTap.medium();
              handleShare();
            }}
            style={({ pressed }) => [
              styles.oceanShareCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.oceanShareIconWrap}>
              <AppIcon name="Share2" size={26} color="#FFFFFF" variant="solar-bold" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6 }}>
                INSTANT CONTACTLESS SHARE
              </AppText>
              <AppText style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>
                Share Digital Profile
              </AppText>
            </View>
            <AppIcon name="ChevronRight" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          {/* Consolidated Quick Actions — Mini App Cards (Ocean / Marine) */}
          <View style={styles.sectionHeader}>
            <AppText variant="title3" weight="bold" style={{ color: textTheme }}>
              Quick Actions
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.actionScrollView}
            contentContainerStyle={styles.actionScroll}
          >
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => {
                  HapticTap.light();
                  handleAction(a);
                }}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: isDark ? '#1E293B' : '#E0F2FE' },
                  pressed && styles.actionCardPressed,
                ]}
              >
                <View style={styles.actionTextWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(0,199,190,0.15)' : 'rgba(0,113,227,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name={a.icon} size={15} color={isDark ? '#00C7BE' : '#0071E3'} />
                    </View>
                    <AppText variant="caption" weight="bold" style={{ color: isDark ? '#00C7BE' : '#0071E3' }}>
                      {a.subtitle}
                    </AppText>
                  </View>
                  <AppText variant="title3" weight="bold" style={{ color: textTheme }}>
                    {a.label}
                  </AppText>
                </View>
                <View style={styles.actionImageWrap}>
                  {a.image && <Image source={a.image} style={{ width: 64, height: 64 }} resizeMode="contain" />}
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* Stats Summary Section */}
          {insights ? (
            <View style={styles.statsSection}>
              <View style={styles.sectionHeader}>
                <AppText variant="title3" weight="bold" style={{ color: textTheme }}>
                  Account Overview
                </AppText>
              </View>
              <View style={styles.statsRow}>
                {[
                  { label: 'Orders', value: String(insights.totalOrders), image: require('@/assets/images/3d_track_card_v2.png'), color: APPLE_BLUE },
                  { label: 'Active', value: String(insights.activeOrders), image: require('@/assets/images/3d_signals_v2.png'), color: APPLE_ORANGE },
                  { label: 'Delivered', value: String(insights.deliveredOrders), image: require('@/assets/images/3d_scan_card_v2.png'), color: APPLE_GREEN },
                ].map((stat, index) => (
                  <StatCard
                    key={stat.label}
                    {...stat}
                    isDark={isDark}
                    style={[
                      index === 0 && styles.statCardFirst,
                      index === 2 && statsStyles.statCardLast,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Recent Orders */}
          {recentOrders.length > 0 ? (
            <View style={styles.ordersSection}>
              <View style={styles.sectionHeader}>
                <AppText variant="title3" weight="bold" style={{ color: textTheme }}>
                  Recent Orders
                </AppText>
                <AppButton
                  label="View All"
                  variant="link"
                  size="sm"
                  iconRight="ChevronRight"
                  onPress={() => router.push(appRoutes.customer.orders as any)}
                  haptic="light"
                />
              </View>
              <View style={[styles.ordersCard, { backgroundColor: cardTheme }]}>
                {recentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} isDark={isDark} onPress={() => router.push(`/orders/detail/${o.id}` as Href)} />
                ))}
              </View>
            </View>
          ) : null}
        </IosScrollView>
      </SafeAreaView>

      <FAB onPress={() => setFabOpen(true)} />
      <QuickActionModal visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

const statsStyles = StyleSheet.create({
  statCardLast: {
    marginLeft: 6,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  profileAvatarButton: {
    marginRight: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24, // Rounded smooth circle
    backgroundColor: APPLE_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarT: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  profileCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fbAvatarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  avatarNoBg: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  inboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181B', // bg-zinc-900 / black
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  inboxBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  neonBadgePill: {
    backgroundColor: '#39FF14', // bg-neon-lime
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neonBadgeNum: {
    color: '#000000', // text-black
    fontSize: 12,
    fontWeight: '800',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18, // Rounded smooth circle
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  cardContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  cardElevation: {
    borderRadius: 20, // Rounded smooth cards
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25, // Rounded smooth pill button
    backgroundColor: APPLE_BLUE,
    gap: 8,
    shadowColor: APPLE_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  actionScrollView: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  actionScroll: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  actionCard: {
    width: 220,
    height: 104,
    borderRadius: 0,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  actionTextWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  actionImageWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCardContainer: {
    flex: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 0,
  },
  statCardFirst: {
    // optional spacing adjustment
  },
  ordersSection: {
    marginVertical: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ordersCard: {
    borderRadius: 0,
    paddingVertical: 4,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  orderRowContainer: {
    borderBottomWidth: 0,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  orderIcon: {
    width: 38,
    height: 38,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 4,
  },
  orderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  oceanShareCard: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
    marginVertical: 6,
  },
  oceanShareIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appStoreBlackCard: {
    backgroundColor: '#111111',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appStoreBlackCardPressed: {
    backgroundColor: '#27272A',
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  appStoreTextWrap: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  appStoreSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  appStoreTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

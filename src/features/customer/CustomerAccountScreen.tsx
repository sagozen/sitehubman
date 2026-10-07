import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  Share,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { HapticTap } from '@/src/utils/haptics';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = pageThemes.home;
const INK = T.text;
const MUTED = T.muted;
const SURFACE = T.surface;
const BORDER = T.border;
const BG = T.canvas;
const RAISED = T.surfaceRaised;

// ─── Order status helper ──────────────────────────────────────────────────────
function orderStatus(s: string): { label: string; color: string } {
  if (
    ['production_approved','printer_assigned','printing','nfc_writing',
     'nfc_verification','qa_pending','qa_failed'].includes(s)
  ) return { label: 'In Production', color: '#F59E0B' };
  if (['shipped', 'ready_to_ship'].includes(s)) return { label: 'Shipped', color: '#10B981' };
  if (s === 'delivered') return { label: 'Delivered', color: '#0A84FF' };
  return { label: 'Processing', color: MUTED };
}

// ─── Quick navigation actions ─────────────────────────────────────────────────
const QUICK_ACTIONS: { label: string; sub: string; icon: AppIconName; route: Href }[] = [
  { label: 'Edit Profile', sub: 'Bio & links', icon: 'PenLine', route: appRoutes.guestDesign as Href },
  { label: 'My Network', sub: 'Leads & contacts', icon: 'Users', route: appRoutes.customerConnections as Href },
  { label: 'Analytics', sub: 'Scans & CTR', icon: 'BarChart2', route: appRoutes.customerAnalysis as Href },
  { label: 'NFC Hardware', sub: 'Link tag', icon: 'Nfc', route: appRoutes.nfcDemo as Href },
];

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} weight="semibold">{title}</AppText>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={12}>
          <AppText style={styles.sectionAction} weight="medium">{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

// ─── Order row ────────────────────────────────────────────────────────────────
function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const st = orderStatus(order.status);
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const amt = order.amount != null ? `$${order.amount.toFixed(0)}` : '';

  return (
    <Pressable
      onPress={() => { HapticTap.light(); onPress(); }}
      style={({ pressed }) => [styles.orderRow, pressed && { opacity: 0.6 }]}
      hitSlop={8}
    >
      <View style={styles.orderDot} />
      <View style={styles.orderInfo}>
        <AppText style={styles.orderName} weight="medium">
          {order.customerName || 'NFC Card'}
        </AppText>
        <AppText style={styles.orderMeta}>
          {order.quantity ?? 1}× {order.cardDesign?.replace(/_/g, ' ')}{date ? ` · ${date}` : ''}
        </AppText>
      </View>
      <View style={styles.orderRight}>
        <View style={[styles.statusPill, { borderColor: st.color + '40' }]}>
          <View style={[styles.statusDot, { backgroundColor: st.color }]} />
          <AppText style={[styles.statusLabel, { color: st.color }]} weight="medium">{st.label}</AppText>
        </View>
        {amt ? <AppText style={styles.orderAmt} weight="semibold">{amt}</AppText> : null}
      </View>
    </Pressable>
  );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────
function StatStrip({ total, active, delivered }: { total: number; active: number; delivered: number }) {
  const items = [
    { label: 'Total Orders', value: String(total) },
    { label: 'Active', value: String(active) },
    { label: 'Delivered', value: String(delivered) },
  ];
  return (
    <View style={styles.statStrip}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <View style={styles.statItem}>
            <AppText style={styles.statValue} weight="semibold">{item.value}</AppText>
            <AppText style={styles.statLabel}>{item.label}</AppText>
          </View>
          {i < items.length - 1 && <View style={styles.statDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export function CustomerAccountScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { orders } = useCustomerOrders(user?.id, user?.email);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] = useState<any>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const { bioPage } = useBioPage(user?.id ?? '');

  const cardWidth = Math.min(screenWidth - 40, 380);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      loadCustomerCloudCard(user.id),
      getCustomerInsights(user.id),
    ]).then(([cloudCardData, insightsData]) => {
      setCloudCard(cloudCardData);
      setInsights(insightsData);
    }).catch((err) => {
      console.error('CustomerAccountScreen data load error:', err);
    });
  }, [user?.id]);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const cardProfile = cloudCard?.profile;
  const heroName = cardProfile?.fullName?.trim() || user?.displayName?.trim() || '';
  const heroTitle = cardProfile?.role?.trim() || '';

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out my digital business card: https://sitehubman.com/profile/${user?.id}`,
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  }, [user]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <IosScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Pressable
              onPress={() => { HapticTap.light(); router.push('/profile' as any); }}
              style={({ pressed }) => [styles.headerAvatarBtn, pressed && { opacity: 0.7 }]}
              hitSlop={12}
            >
              {bioPage?.photoUrl ? (
                <Image source={{ uri: bioPage.photoUrl }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <AppIcon name="UserRound" size={20} color={INK} />
                </View>
              )}
            </Pressable>

            <View style={styles.headerCenter}>
              <AppText style={styles.headerName} weight="semibold" numberOfLines={1}>
                {heroName || user?.displayName || 'My Account'}
              </AppText>
              {heroTitle ? (
                <AppText style={styles.headerTitle} weight="regular" numberOfLines={1}>
                  {heroTitle}
                </AppText>
              ) : null}
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => { HapticTap.light(); router.push('/notifications'); }}
                style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
                hitSlop={12}
              >
                <AppIcon name="Bell" size={18} color={INK} />
              </Pressable>
              <Pressable
                onPress={() => { HapticTap.medium(); router.push(appRoutes.studio as Href); }}
                style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
                hitSlop={12}
              >
                <AppIcon name="Wand2" size={18} color={INK} />
              </Pressable>
            </View>
          </View>

          {/* ── NFC Card ── */}
          <View style={styles.cardWrap}>
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

          {/* ── Share button ── */}
          <Pressable
            onPress={() => { HapticTap.medium(); handleShare(); }}
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }]}
          >
            <AppIcon name="Share2" size={16} color={BG} />
            <AppText style={styles.shareBtnText} weight="semibold">Share Digital Profile</AppText>
          </Pressable>

          {/* ── Stats ── */}
          {insights && (
            <StatStrip
              total={insights.totalOrders}
              active={insights.activeOrders}
              delivered={insights.deliveredOrders}
            />
          )}

          {/* ── Quick actions grid ── */}
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => { HapticTap.light(); router.push(a.route); }}
                style={({ pressed }) => [styles.quickCell, pressed && { opacity: 0.65 }]}
              >
                <View style={styles.quickIconWrap}>
                  <AppIcon name={a.icon} size={18} color={INK} />
                </View>
                <AppText style={styles.quickLabel} weight="medium">{a.label}</AppText>
                <AppText style={styles.quickSub}>{a.sub}</AppText>
              </Pressable>
            ))}
          </View>

          {/* ── Recent orders ── */}
          {recentOrders.length > 0 && (
            <View>
              <SectionHeader
                title="Recent Orders"
                action="See all"
                onAction={() => router.push(appRoutes.customer.orders as any)}
              />
              <View style={styles.orderList}>
                {recentOrders.map((o, i) => (
                  <React.Fragment key={o.id}>
                    <OrderRow
                      order={o}
                      onPress={() => router.push(`/orders/detail/${o.id}` as Href)}
                    />
                    {i < recentOrders.length - 1 && <View style={styles.orderDividerLine} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}
        </IosScrollView>
      </SafeAreaView>

      <FAB onPress={() => setFabOpen(true)} />
      <QuickActionModal visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  headerAvatarBtn: {
    width: 38,
    height: 38,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    gap: 1,
  },
  headerName: {
    color: INK,
    fontSize: 16,
  },
  headerTitle: {
    color: MUTED,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Card ──
  cardWrap: {
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },

  // ── Share ──
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: INK,
    borderRadius: 12,
    paddingVertical: 13,
  },
  shareBtnText: {
    color: BG,
    fontSize: 15,
  },

  // ── Stats ──
  statStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: INK,
    fontSize: 20,
  },
  statLabel: {
    color: MUTED,
    fontSize: 11,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginVertical: 4,
  },

  // ── Quick grid ──
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCell: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderColor: BORDER,
    padding: 14,
    gap: 6,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: INK,
    fontSize: 14,
  },
  quickSub: {
    color: MUTED,
    fontSize: 11,
  },

  // ── Orders ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: INK,
    fontSize: 14,
  },
  sectionAction: {
    color: MUTED,
    fontSize: 13,
  },
  orderList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  orderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orderInfo: { flex: 1, gap: 2 },
  orderName: { color: INK, fontSize: 14 },
  orderMeta: { color: MUTED, fontSize: 12 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmt: { color: INK, fontSize: 13 },
  orderDividerLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginLeft: 30,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusLabel: { fontSize: 11 },
});

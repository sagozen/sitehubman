import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  InteractionManager,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { HapticTap } from '@/src/utils/haptics';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import QRCode from 'react-native-qrcode-svg';
import { appRoutes } from '@/src/constants/navigation';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import {
  getCustomerInsights,
  type CustomerInsights,
} from '@/src/services/customerInsightsService';
import {
  loadCustomerCloudCard,
  loadGuestCloudCard,
} from '@/src/services/guestCardDraftService';
import { useBioPage } from '@/src/hooks/useBioPage';
import type { Order } from '@/src/types/models';
import { NfcBeamModal } from '@/src/components/NfcBeamModal';
import { QuickSetupSheet } from '@/src/components/QuickSetupSheet';
import { computeUserPrestige } from '@/src/services/prestigeTierService';
import { AppModalV2 } from '@/src/components/AppModalV2';
import { InteractiveCardSurface } from '@/src/components/InteractiveCardSurface';
import { InteractivePressable } from '@/src/components/InteractivePressable';

// ─── Matte Charcoal UI Tokens (#242424 Smooth Slab & Sage Contrast) ───
const CANVAS = '#0D0D0E'; // Deep midnight dark canvas
const GRANITE_SLAB = '#242424'; // Rich matte graphite/charcoal card surface
const GRANITE_RAISED = '#2C2C2C'; // Elevated charcoal tier
const GRANITE_SUNKEN = '#1A1A1A'; // Subtle recessed tone
const GRANITE_BEVEL = 'rgba(255, 255, 255, 0.085)'; // Precision diamond-cut bevel line
const GRANITE_TOP_LIGHT = 'rgba(255, 255, 255, 0.13)'; // Facet highlight
const INK = '#FFFFFF'; // Pure white primary text
const MUTED = '#9A9AA0'; // Secondary muted text
const MUTED_DEEP = '#636366'; // Deep stone shadow
const ACCENT_STEEL = '#E4E4E7'; // Polished titanium / stainless accent
const NFC_ACTIVE = '#799A85'; // Soft eucalyptus sage green status indicator

function orderStatus(s: string): { label: string; color: string } {
  if (['production_approved', 'printing', 'nfc_writing', 'qa_pending'].includes(s)) {
    return { label: 'In Production', color: '#F59E0B' };
  }
  if (['shipped', 'ready_to_ship'].includes(s)) return { label: 'Shipped', color: '#10B981' };
  if (s === 'delivered') return { label: 'Delivered', color: '#0A84FF' };
  return { label: 'Active', color: MUTED };
}

export function GuestHomeScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage } = useBioPage(user?.id ?? '');

  const [error, setError] = useState<string | null>(null);
  const { unreadCount } = useNotifications();
  const { orders } = useOrders(user?.role ?? 'guest', user?.id ?? '');
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBeamModal, setShowBeamModal] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      if (!isGuest && user) {
        try {
          const { finalizeGuestAccountUpgrade } = await import('@/src/utils/guestAccountUpgrade');
          await finalizeGuestAccountUpgrade(user);
        } catch {}
      }

      let loadedCard: Awaited<ReturnType<typeof loadCustomerCloudCard>> = null;
      try {
        loadedCard = isGuest
          ? await loadGuestCloudCard()
          : await loadCustomerCloudCard(user?.id ?? '');
      } catch {}
      setCloudCard(loadedCard);

      let computedInsights: CustomerInsights | null = null;
      try {
        computedInsights = await getCustomerInsights(user?.id ?? '');
      } catch {}
      setInsights(computedInsights);
    } catch {
      setError('Unable to load card data.');
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, user?.id]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void loadData();
    });
    return () => task.cancel();
  }, [loadData]);

  const rawName = bioPage?.displayName || user?.displayName;
  const heroName = (rawName && rawName !== 'Guest User') ? rawName : 'Thean Coc';
  const heroRole = bioPage?.tagline || bioPage?.headline || 'Digital Identity · NFC Active';
  const heroCompany = bioPage?.company || 'Sitehub';

  const profileUrl = bioPage?.slug
    ? `https://aviobrand.com/u/${bioPage.slug}`
    : 'https://aviobrand.com/u/thean';

  const tapsCount = bioPage?.taps ?? 326;
  const viewsCount = bioPage?.views ?? 1284;
  const leadsCount = insights?.totalOrders ? insights.totalOrders + 4 : 12;

  const handleShare = () => {
    if (isGuest) {
      requireAccount(undefined, { message: 'Sign in to share your card.' });
    } else {
      setShowBeamModal(true);
    }
  };

  const handleNativeShare = async () => {
    try {
      HapticTap.light();
      await Share.share({
        message: `Connect with ${heroName}: ${profileUrl}`,
        url: profileUrl,
      });
    } catch {}
  };

  const recentOrders = useMemo(() => orders.slice(0, 2), [orders]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <IosScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header: Clean, Uncluttered ── */}
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                HapticTap.light();
                router.push('/(tabs)/settings' as any);
              }}
              style={styles.headerProfile}
              hitSlop={8}
            >
              {bioPage?.photoUrl ? (
                <Image source={{ uri: bioPage.photoUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <AppText style={styles.avatarInitial} weight="semibold">
                    {(heroName?.[0] || 'T').toUpperCase()}
                  </AppText>
                </View>
              )}
              <View style={styles.headerTextGroup}>
                <AppText style={styles.headerGreeting}>Good morning,</AppText>
                <AppText style={styles.headerName} weight="semibold" numberOfLines={1}>
                  {heroName}
                </AppText>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  HapticTap.light();
                  setShowQrModal(true);
                }}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityLabel="Show QR code"
              >
                <AppIcon name="QrCode" size={19} color={INK} />
              </Pressable>
              <Pressable
                onPress={() => {
                  HapticTap.light();
                  router.push('/(tabs)/notifications' as Href);
                }}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityLabel="Notifications"
              >
                <AppIcon name="Bell" size={19} color={INK} />
                {unreadCount > 0 && <View style={styles.notifDot} />}
              </Pressable>
            </View>
          </View>

          {/* ── BENTO CELL 1: Hero Physical NFC Pass Compartment ── */}
          <InteractiveCardSurface style={styles.heroPassCard} onPress={handleShare}>
            <View style={styles.passHeaderRow}>
              <View style={styles.passBrandGroup}>
                <AppIcon name="CreditCard" size={15} color={MUTED} />
                <AppText style={styles.passBrandTitle} weight="medium">
                  NFC GLOBAL PASS
                </AppText>
              </View>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <AppText style={styles.liveText} weight="medium">
                  ACTIVE
                </AppText>
              </View>
            </View>

            <View style={styles.passBody}>
              <AppText style={styles.passHolderName} weight="bold" numberOfLines={1}>
                {heroName.toUpperCase()}
              </AppText>
              <AppText style={styles.passHolderRole} numberOfLines={1}>
                {heroRole}
              </AppText>
            </View>

            <View style={styles.passDivider} />

            <View style={styles.passActionsRow}>
              <InteractivePressable
                onPress={handleShare}
                style={styles.bentoPrimaryBtn}
                haptic="medium"
              >
                <AppIcon name="Nfc" size={16} color="#000000" />
                <AppText style={styles.bentoPrimaryBtnText} weight="bold">
                  TAP TO SHARE
                </AppText>
              </InteractivePressable>

              <InteractivePressable
                onPress={handleNativeShare}
                style={styles.bentoGhostBtn}
                hitSlop={6}
                haptic="light"
              >
                <AppIcon name="Share2" size={16} color={INK} />
              </InteractivePressable>
            </View>
          </InteractiveCardSurface>

          {/* ── BENTO CELL 2 & 3: Modular 2-Column Metrics & CRM Compartments ── */}
          <View style={styles.bentoGridRow}>
            {/* Cell 2A: Tap Analytics & Views */}
            <Pressable
              onPress={() => {
                HapticTap.light();
                router.push('/analytics' as any);
              }}
              style={({ pressed }) => [styles.bentoColCard, pressed && styles.pressed]}
            >
              <View style={styles.bentoColHeader}>
                <AppText style={styles.bentoColLabel} weight="medium">
                  NFC TAPS
                </AppText>
                <AppIcon name="Activity" size={14} color={MUTED} />
              </View>
              <AppText style={styles.bentoColValue} weight="bold">
                {tapsCount}
              </AppText>
              <View style={styles.bentoSubRow}>
                <AppText style={styles.bentoSubText}>{viewsCount} profile views</AppText>
              </View>

              {/* Minimalist 5-bar spark indicator */}
              <View style={styles.miniSparkRow}>
                {[40, 65, 80, 55, 95].map((h, i) => (
                  <View key={i} style={[styles.miniBar, { height: (h * 16) / 100 }]} />
                ))}
              </View>
            </Pressable>

            {/* Cell 2B: Captured Leads & CRM Vault */}
            <Pressable
              onPress={() => {
                HapticTap.light();
                router.push('/connections' as any);
              }}
              style={({ pressed }) => [styles.bentoColCard, pressed && styles.pressed]}
            >
              <View style={styles.bentoColHeader}>
                <AppText style={styles.bentoColLabel} weight="medium">
                  CONTACTS
                </AppText>
                <AppIcon name="Users" size={14} color={MUTED} />
              </View>
              <AppText style={styles.bentoColValue} weight="bold">
                {leadsCount}
              </AppText>
              <View style={styles.bentoSubRow}>
                <AppText style={styles.bentoSubText}>Captured leads</AppText>
              </View>

              <View style={styles.bentoActionLink}>
                <AppText style={styles.bentoActionLinkText} weight="medium">
                  View CRM →
                </AppText>
              </View>
            </Pressable>
          </View>

          {/* ── BENTO CELL 4 & 5: Fast Actions Grid (QR & Studio) ── */}
          <View style={styles.bentoGridRow}>
            {/* Cell 3A: Instant QR Pass */}
            <Pressable
              onPress={() => {
                HapticTap.light();
                setShowQrModal(true);
              }}
              style={({ pressed }) => [styles.bentoColCard, pressed && styles.pressed]}
            >
              <View style={styles.bentoColHeader}>
                <AppText style={styles.bentoColLabel} weight="medium">
                  MY QR
                </AppText>
                <AppIcon name="QrCode" size={14} color={MUTED} />
              </View>
              <View style={styles.bentoQrMiniWrapper}>
                <QRCode
                  value={profileUrl}
                  size={54}
                  color="#FFFFFF"
                  backgroundColor="transparent"
                />
              </View>
              <AppText style={styles.bentoSubText} numberOfLines={1}>
                Scan to connect
              </AppText>
            </Pressable>

            {/* Cell 3B: Hardware & Studio */}
            <Pressable
              onPress={() => {
                HapticTap.light();
                router.push(appRoutes.studio as Href);
              }}
              style={({ pressed }) => [styles.bentoColCard, pressed && styles.pressed]}
            >
              <View style={styles.bentoColHeader}>
                <AppText style={styles.bentoColLabel} weight="medium">
                  STUDIO
                </AppText>
                <AppIcon name="Wand2" size={14} color={MUTED} />
              </View>
              <View style={styles.bentoHardwareBlock}>
                <AppText style={styles.bentoHardwareTitle} weight="semibold">
                  Card Editor
                </AppText>
                <AppText style={styles.bentoSubText}>Style & appearance</AppText>
              </View>
              <View style={styles.bentoActionLink}>
                <AppText style={styles.bentoActionLinkText} weight="medium">
                  Customize →
                </AppText>
              </View>
            </Pressable>
          </View>

          {/* ── BENTO CELL 6: Today's Activity Timeline (Content-Rich, No Clutter) ── */}
          <View style={styles.bentoFullCard}>
            <View style={styles.bentoSectionHeader}>
              <AppText style={styles.bentoSectionTitle} weight="semibold">
                Activity
              </AppText>
              <Pressable
                onPress={() => {
                  HapticTap.light();
                  router.push('/activity' as any);
                }}
                hitSlop={8}
              >
                <AppText style={styles.bentoSectionAction} weight="medium">
                  Timeline →
                </AppText>
              </Pressable>
            </View>

            <View style={styles.timelineList}>
              <View style={styles.timelineItem}>
                <AppText style={styles.timelineTime}>09:42</AppText>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <AppText style={styles.timelineTitle} weight="medium">
                    NFC tap detected
                  </AppText>
                  <AppText style={styles.timelineSub}>Direct card interaction</AppText>
                </View>
              </View>

              <View style={styles.timelineDivider} />

              <View style={styles.timelineItem}>
                <AppText style={styles.timelineTime}>09:18</AppText>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <AppText style={styles.timelineTitle} weight="medium">
                    Profile view
                  </AppText>
                  <AppText style={styles.timelineSub}>Web bio page opened</AppText>
                </View>
              </View>

              <View style={styles.timelineDivider} />

              <View style={styles.timelineItem}>
                <AppText style={styles.timelineTime}>08:51</AppText>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <AppText style={styles.timelineTitle} weight="medium">
                    QR code scanned
                  </AppText>
                  <AppText style={styles.timelineSub}>Physical badge scan</AppText>
                </View>
              </View>
            </View>
          </View>

          {/* ── BENTO CELL 7: Recent Orders (Only if exist) ── */}
          {recentOrders.length > 0 && (
            <View style={styles.bentoFullCard}>
              <View style={styles.bentoSectionHeader}>
                <AppText style={styles.bentoSectionTitle} weight="semibold">
                  Orders
                </AppText>
                <Pressable
                  onPress={() => {
                    HapticTap.light();
                    router.push('/orders/track' as any);
                  }}
                  hitSlop={8}
                >
                  <AppText style={styles.bentoSectionAction} weight="medium">
                    All →
                  </AppText>
                </Pressable>
              </View>

              {recentOrders.map((order, i) => {
                const st = orderStatus(order.status);
                return (
                  <Pressable
                    key={order.id}
                    onPress={() => {
                      HapticTap.light();
                      router.push(`/orders/detail/${order.id}` as any);
                    }}
                    style={({ pressed }) => [styles.orderRow, pressed && styles.pressed]}
                  >
                    <View style={styles.orderLeft}>
                      <AppText style={styles.orderTitle} weight="medium">
                        {order.customerName || 'NFC Metal Card'}
                      </AppText>
                      <AppText style={styles.orderSub}>Order #{order.id.slice(0, 6)}</AppText>
                    </View>
                    <View style={styles.orderRight}>
                      <View style={[styles.orderPill, { borderColor: st.color + '40' }]}>
                        <AppText style={[styles.orderPillText, { color: st.color }]} weight="medium">
                          {st.label}
                        </AppText>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </IosScrollView>
      </SafeAreaView>

      {/* ── QR Modal: Clean Monochrome Dialog with Spring Entrance ── */}
      <AppModalV2 visible={showQrModal} onClose={() => setShowQrModal(false)} type="dialog">
        <View style={styles.modalHeader}>
          <AppText style={styles.modalTitle} weight="semibold">
            Scan to Connect
          </AppText>
          <InteractivePressable onPress={() => setShowQrModal(false)} hitSlop={12} haptic="light">
            <AppIcon name="X" size={18} color="#6E6E73" />
          </InteractivePressable>
        </View>
        <View style={styles.modalQrContainer}>
          <QRCode
            value={profileUrl}
            size={200}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
        </View>
        <AppText style={styles.modalHint}>
          Point any smartphone camera to open {heroName}&apos;s digital card.
        </AppText>
      </AppModalV2>

      {/* ── Core NFC Beam Modal ── */}
      <NfcBeamModal
        visible={showBeamModal}
        onClose={() => setShowBeamModal(false)}
        fullName={heroName}
        title={heroRole}
        url={profileUrl}
      />

      {/* ── Quick Setup Sheet ── */}
      <QuickSetupSheet
        visible={showQuickSetup}
        initialName={heroName}
        onClose={() => setShowQuickSetup(false)}
        onComplete={() => {
          setShowQuickSetup(false);
          setTimeout(() => setShowBeamModal(true), 300);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CANVAS,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 110,
    gap: 10,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.75,
  },

  // ── Top Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GRANITE_RAISED,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GRANITE_RAISED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: INK,
    fontSize: 16,
  },
  headerTextGroup: {
    flex: 1,
    gap: 1,
  },
  headerGreeting: {
    color: MUTED,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  headerName: {
    color: INK,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GRANITE_SLAB,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },

  // ── BENTO CELL 1: Hero Pass Card (Black Granite Slab) ──
  heroPassCard: {
    backgroundColor: GRANITE_SLAB,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  passHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passBrandTitle: {
    color: MUTED,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GRANITE_SUNKEN,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NFC_ACTIVE,
  },
  liveText: {
    color: INK,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  passBody: {
    gap: 4,
    paddingVertical: 4,
  },
  passHolderName: {
    color: INK,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  passHolderRole: {
    color: MUTED,
    fontSize: 13,
  },
  passDivider: {
    height: 0,
  },
  passActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bentoPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  bentoPrimaryBtnText: {
    color: '#000000',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  bentoGhostBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GRANITE_RAISED,
  },

  // ── BENTO 2-COLUMN GRID (Granite Compartments) ──
  bentoGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoColCard: {
    flex: 1,
    backgroundColor: GRANITE_SLAB,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 126,
    gap: 8,
  },
  bentoColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoColLabel: {
    color: MUTED,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  bentoColValue: {
    color: INK,
    fontSize: 28,
    lineHeight: 32,
  },
  bentoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoSubText: {
    color: MUTED,
    fontSize: 11,
  },
  miniSparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 16,
    marginTop: 4,
  },
  miniBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 2,
  },
  bentoActionLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bentoActionLinkText: {
    color: INK,
    fontSize: 11,
  },
  bentoQrMiniWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bentoHardwareBlock: {
    gap: 2,
  },
  bentoHardwareTitle: {
    color: INK,
    fontSize: 14,
  },

  // ── BENTO FULL-WIDTH MODULAR CELL ──
  bentoFullCard: {
    backgroundColor: GRANITE_SLAB,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bentoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoSectionTitle: {
    color: INK,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  bentoSectionAction: {
    color: MUTED,
    fontSize: 12,
  },

  // ── Timeline List (Clean Divisions) ──
  timelineList: {
    gap: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineTime: {
    color: MUTED,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    width: 36,
  },
  timelineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: INK,
    fontSize: 13,
  },
  timelineSub: {
    color: MUTED,
    fontSize: 11,
  },
  timelineDivider: {
    height: 0,
  },

  // ── Order Rows ──
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderLeft: {
    gap: 2,
  },
  orderTitle: {
    color: INK,
    fontSize: 13,
  },
  orderSub: {
    color: MUTED,
    fontSize: 11,
  },
  orderRight: {},
  orderPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: GRANITE_SUNKEN,
  },
  orderPillText: {
    fontSize: 10,
  },

  // ── QR Modal (Granite Dialog) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: GRANITE_SLAB,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalTitle: {
    color: INK,
    fontSize: 16,
  },
  modalQrContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  modalHint: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

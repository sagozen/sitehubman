import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  Share,
  Linking,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { PenBoldDuotone, TrashBinTrashBoldDuotone, PrinterBoldDuotone, UserBoldDuotone, DocumentBoldDuotone, WalletBoldDuotone, FireBoldDuotone, StarsBoldDuotone, AddCircleBoldDuotone, BoxBoldDuotone, Card2BoldDuotone } from '@solar-icons/react-native';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { appRoutes } from '@/src/constants/navigation';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { needsSalesApproval } from '@/src/utils/orderProduction';
import type { Order } from '@/src/types/models';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const BG = '#F8FAFC';
const SURFACE = '#FFFFFF';
const INK = '#020617';
const MUTED = '#64748B';
const RED_BRAND = '#E53935'; // Red background like the image
const BLUE = '#4285F4';
const BLUE_LIGHT = '#E8F0FE';
const ORANGE = '#F08428'; // Bright orange from the image
const ORANGE_LIGHT = '#FEF0E5'; // Very light orange background
const TEAL = '#0D9488';

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function SalesDashboardScreen() {
  const { user } = useAuth();
  const { orders, refresh } = useOrders('sales', user?.id ?? '');
  const insets = useSafeAreaInsets();

  useEffect(() => { refresh(); }, [refresh]);

  const firstName = (user?.displayName ?? 'Sales').split(' ')[0] || 'Sales';
  const referralCode = user?.email
    ? `SALE-${user.email.replace(/[@.]/g, '').slice(0, 10).toUpperCase()}`
    : `SALE-${firstName.toUpperCase()}25`;

  // Dashboard stats
  const dashStats = useMemo(() => {
    const today = new Date().toDateString();
    let todayOrders = 0;
    let todayRevenue = 0;
    orders.forEach(o => {
      const isToday = new Date(o.createdAt).toDateString() === today;
      if (isToday) {
        todayOrders++;
        if (o.amount) todayRevenue += o.amount;
      }
    });
    return { todayOrders, todayRevenue };
  }, [orders]);

  // Recent orders (last 5)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  return (
    <View style={s.bg}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <IosScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Top Identity & Revenue Card (from the image) ── */}
          <View style={s.identityCard}>
            {/* User Info Row */}
            <View style={s.userRow}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={s.avatar} />
              ) : (
                <View style={s.avatarFallback}>
                  <UserBoldDuotone size={30} color={RED_BRAND} />
                </View>
              )}
              <View style={s.userInfo}>
                <AppText style={s.userName}>{user?.displayName || 'Sales Agent'}</AppText>
                <AppText style={s.userRole}>Ref Code: {referralCode}</AppText>
              </View>
            </View>

            {/* Stats Row */}
            <View style={s.statsRow}>
              <View style={s.statCol}>
                <AppText style={s.statLabel}>Today's Orders</AppText>
                <View style={s.statValRow}>
                  <AppText style={s.statValue}>{dashStats.todayOrders}</AppText>
                  <AppIcon name="ChevronRight" size={14} color={MUTED} />
                </View>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <AppText style={s.statLabel}>Today's Revenue</AppText>
                <View style={s.statValRow}>
                  <AppText style={s.statValue}>${dashStats.todayRevenue.toFixed(2)}</AppText>
                  <AppIcon name="ChevronRight" size={14} color={MUTED} />
                </View>
              </View>
            </View>
          </View>

          {/* ── Two Big Action Buttons (New Order & Printing) ── */}
          <View style={s.actionRow}>
            <Pressable
              style={({ pressed }) => [s.bigActionBtn, { backgroundColor: BLUE_LIGHT }, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(appRoutes.sales.newOrder as any)}
            >
              <View style={[s.bigActionIconBox, { backgroundColor: BLUE }]}>
                <BoxBoldDuotone size={26} color="#FFF" />
              </View>
              <AppText style={[s.bigActionText, { color: INK }]}>New Order</AppText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [s.bigActionBtn, { backgroundColor: ORANGE_LIGHT }, pressed && { opacity: 0.85 }]}
              onPress={() => {
                // Navigate to the new Print Jobs tab
                router.push('/sales/print-jobs' as any);
              }}
            >
              <View style={[s.bigActionIconBox, { backgroundColor: ORANGE }]}>
                <PrinterBoldDuotone size={26} color="#FFF" />
              </View>
              <AppText style={[s.bigActionText, { color: INK }]}>Printing</AppText>
            </Pressable>
          </View>

          {/* ── Quick Actions ── */}
          <AppText style={s.sectionTitle}>Quick Actions</AppText>
          <View style={s.card}>
            <View style={s.quickGrid}>
              <QuickAction
                icon={<PenBoldDuotone size={22} color="#10B981" />}
                label="Add Order"
                color="#10B981"
                bgColor="#d1fae5"
                onPress={() => router.push(appRoutes.sales.newOrder as any)}
              />
              <View style={s.quickDivider} />
              <QuickAction
                icon={<UserBoldDuotone size={22} color="#2563EB" />}
                label="CRM Leads"
                color="#2563EB"
                bgColor="#dbeafe"
                onPress={() => router.push('/sales/customers' as any)}
              />
              <View style={s.quickDivider} />
              <QuickAction
                icon={<DocumentBoldDuotone size={22} color="#7C3AED" />}
                label="Orders"
                color="#7C3AED"
                bgColor="#ede9fe"
                onPress={() => router.push(appRoutes.sales.orders as any)}
              />
              <View style={s.quickDivider} />
              <QuickAction
                icon={<WalletBoldDuotone size={22} color="#F59E0B" />}
                label="Commission"
                color="#F59E0B"
                bgColor="#fef3c7"
                onPress={() => router.push(appRoutes.sales.payouts as any)}
              />
            </View>
          </View>

          {/* ── Smart Tasks ── */}
          <AppText style={s.sectionTitle}>Smart Tasks</AppText>
          <AppText style={s.sectionSub}>Recommendations & urgent follow-ups</AppText>
          <View style={s.card}>
            <Pressable
              style={s.taskRow}
              onPress={() => Linking.openURL('https://www.tiktok.com/business/en-US/blog/tiktok-viral-tips')}
            >
              <View style={[s.taskIconBox, { backgroundColor: '#fce7f3' }]} >
                <FireBoldDuotone size={20} color="#db2777" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={s.taskTitle}>Post on TikTok today</AppText>
                <AppText style={[s.taskLink, { color: '#db2777' }]}>View Viral Tips</AppText>
              </View>
              <AppIcon name="ChevronRight" size={16} color={MUTED} />
            </Pressable>
            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 12, marginLeft: 52 }} />
            <Pressable
              style={s.taskRow}
              onPress={() => Alert.alert('Follow Up', 'Message 3 customers.')}
            >
              <View style={[s.taskIconBox, { backgroundColor: '#e0e7ff' }]}>
                <StarsBoldDuotone size={20} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={s.taskTitle}>Follow up 3 pending orders</AppText>
                <AppText style={[s.taskLink, { color: '#4f46e5' }]}>Send Reminders</AppText>
              </View>
              <AppIcon name="ChevronRight" size={16} color={MUTED} />
            </Pressable>
          </View>

          {/* ── Referral Code Share ── */}
          <AppText style={s.sectionTitle}>Referral Program</AppText>
          <View style={s.card}>
            <Pressable
              style={s.taskRow}
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Get 25% off your first NFC smart card! Use my code: ${referralCode}\n\nBuild your professional network today.`,
                  });
                } catch (e) {}
              }}
            >
              <View style={[s.taskIconBox, { backgroundColor: '#FFE0E0' }]}>
                <FireBoldDuotone size={20} color={RED_BRAND} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={s.taskTitle}>Share my referral code</AppText>
                <AppText style={[s.taskLink, { color: RED_BRAND }]}>{referralCode}</AppText>
              </View>
              <AppIcon name="Share2" size={16} color={MUTED} />
            </Pressable>
          </View>

          {/* ── Recent Orders ── */}
          <View style={s.sectionRow}>
            <AppText style={s.sectionTitle}>Recent Orders</AppText>
            <Pressable onPress={() => router.push(appRoutes.sales.orders as any)}>
              <AppText style={s.seeAll}>See All</AppText>
            </Pressable>
          </View>

          {recentOrders.length === 0 ? (
            <View style={s.emptyCard}>
              <AppText style={{ fontSize: 14, fontWeight: '600', color: MUTED, textAlign: 'center', paddingVertical: 20 }}>
                No orders yet. Create your first order!
              </AppText>
            </View>
          ) : (
            recentOrders.map((o) => (
              <RecentOrderCard key={o.id} order={o} referralCode={referralCode} />
            ))
          )}

          <View style={{ height: 32 }} />
        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Quick Action Button ────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  color,
  bgColor,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.quickItem} onPress={onPress}>
      <View style={[s.quickIconBox, { backgroundColor: bgColor }]}>
        {typeof icon === 'string' ? <AppIcon name={icon} size={22} color={color} /> : icon}
      </View>
      <AppText style={s.quickLabel} numberOfLines={2}>{label}</AppText>
    </Pressable>
  );
}

// ─── Recent Order Card ──────────────────────────────────────────────────────

function RecentOrderCard({ order, referralCode }: { order: Order; referralCode: string }) {
  const total = formatOrderTotal(order);
  return (
    <Pressable 
      style={({ pressed }) => [
        s.orderCardCompact, 
        pressed && { backgroundColor: '#F8FAFF' }
      ]}
      onPress={() => router.push(`/order-detail/${order.id}` as any)}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <DocumentBoldDuotone size={22} color={MUTED} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText style={s.orderNameCompact} numberOfLines={1}>{order.customerName ?? 'Guest'}</AppText>
          <AppText style={s.orderPriceCompact}>{total}</AppText>
        </View>
        <AppText style={s.orderIdCompact}>#{order.id.slice(0, 8).toUpperCase()}</AppText>
      </View>
      <AppIcon name="ChevronRight" size={18} color={MUTED} style={{ marginLeft: 12 }} />
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  redHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: RED_BRAND,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 },

  // Identity Card
  identityCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginTop: 3,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
    marginBottom: 8,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: INK,
  },

  // Big Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  bigActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  bigActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionText: {
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },

  // Cards & Sections
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  // Quick Actions
  quickGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: INK,
    textAlign: 'center',
  },
  quickDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // Smart Tasks
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
    marginBottom: 2,
  },
  taskLink: {
    fontSize: 13,
    fontWeight: '700',
    color: TEAL,
    textDecorationLine: 'underline',
  },

  // Sections
  sectionSub: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
    color: TEAL,
  },

  // Order Card
  emptyCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  orderCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  orderNameCompact: { fontSize: 15, fontWeight: '800', color: INK },
  orderIdCompact: { fontSize: 12, fontWeight: '700', color: MUTED },
  orderPriceCompact: { fontSize: 15, fontWeight: '900', color: TEAL },
});

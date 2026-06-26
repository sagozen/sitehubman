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
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { 
  PenBoldDuotone, 
  UserBoldDuotone, 
  DocumentBoldDuotone, 
  WalletBoldDuotone, 
  FireBoldDuotone, 
  StarsBoldDuotone, 
  BoxBoldDuotone,
  BellBoldDuotone
} from '@solar-icons/react-native';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { appRoutes } from '@/src/constants/navigation';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import type { Order } from '@/src/types/models';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const BACKGROUND = '#F5F5F7';
const SURFACE = '#FFFFFF';
const INK = '#1C1C1E';
const MUTED = '#8E8E93';
const BORDER = '#E5E5EA';
const PRIMARY = '#2596BE';

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function SalesDashboardScreen() {
  const { user } = useAuth();
  const { orders, refresh } = useOrders('sales', user?.id ?? '');

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
        {/* ── Top Header (Sticky or inside Scroll) ── */}
        <View style={s.topHeader}>
          <View style={s.headerLeft}>
            <AppText style={s.greetingText}>Good morning 👋</AppText>
            <AppText style={s.headerName}>{user?.displayName || 'Sales Agent'}</AppText>
            <AppText style={s.headerSub}>NFC Global Sales · Today</AppText>
          </View>
          <View style={s.headerRight}>
            <Pressable style={s.bellBtn}>
              <BellBoldDuotone size={24} color={INK} />
              <View style={s.bellDot} />
            </Pressable>
            <Pressable onPress={() => router.push('/sales/me' as any)}>
              {user?.telegramPhotoUrl ? (
                <Image source={{ uri: user.telegramPhotoUrl }} style={s.smallAvatar} />
              ) : (
                <View style={s.smallAvatarFallback}>
                  <UserBoldDuotone size={16} color={PRIMARY} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <IosScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          
          {/* ── Sales Overview Card ── */}
          <SalesOverviewCard referralCode={referralCode} stats={dashStats} />

          {/* ── Main Action Cards ── */}
          <View style={s.actionRow}>
            <BigActionCard 
              title="New Order"
              subtitle="Create customer order"
              icon={<BoxBoldDuotone size={28} color="#FFFFFF" />}
              bgColor="#EBF5FA"
              iconBg={PRIMARY}
              onPress={() => router.push(appRoutes.sales.newOrder as any)}
            />
            <BigActionCard 
              title="Orders"
              subtitle="Manage pipeline"
              icon={<DocumentBoldDuotone size={28} color="#FFFFFF" />}
              bgColor="#E5F1FF"
              iconBg="#007AFF"
              onPress={() => router.push(appRoutes.sales.orders as any)}
            />
          </View>

          {/* ── Quick Actions ── */}
          <AppText style={s.sectionTitle}>Quick Actions</AppText>
          <View style={s.quickActionsCard}>
            <QuickActionItem
              icon={<PenBoldDuotone size={24} color={PRIMARY} />}
              label="Add Order"
              bgColor="#EBF5FA"
              onPress={() => router.push(appRoutes.sales.newOrder as any)}
            />
            <QuickActionItem
              icon={<UserBoldDuotone size={24} color="#5856D6" />}
              label="CRM Leads"
              bgColor="#EAE9FA"
              onPress={() => router.push('/sales/customers' as any)}
            />
            <QuickActionItem
              icon={<DocumentBoldDuotone size={24} color="#007AFF" />}
              label="Orders"
              bgColor="#E5F1FF"
              onPress={() => router.push(appRoutes.sales.orders as any)}
            />
            <QuickActionItem
              icon={<WalletBoldDuotone size={24} color="#FF9500" />}
              label="Commission"
              bgColor="#FFF4E5"
              onPress={() => router.push(appRoutes.sales.payouts as any)}
            />
          </View>

          {/* ── Smart Tasks (Apple Reminders Style) ── */}
          <AppText style={s.sectionTitle}>Smart Tasks</AppText>
          <View style={s.listCard}>
            <TaskRow
              icon={<FireBoldDuotone size={22} color="#FF2D55" />}
              iconBg="#FFEAEF"
              title="Post on TikTok today"
              onPress={() => Linking.openURL('https://www.tiktok.com/business/en-US/blog/tiktok-viral-tips')}
            />
            <View style={s.hairlineDivider} />
            <TaskRow
              icon={<StarsBoldDuotone size={22} color="#5856D6" />}
              iconBg="#EAE9FA"
              title="Follow up 3 pending orders"
              onPress={() => Alert.alert('Follow Up', 'Message 3 customers.')}
            />
          </View>

          {/* ── Referral Program ── */}
          <AppText style={s.sectionTitle}>Referral Program</AppText>
          <ReferralCard referralCode={referralCode} />

          {/* ── Recent Orders ── */}
          <View style={s.sectionHeader}>
            <AppText style={s.sectionTitle}>Recent Orders</AppText>
            <Pressable onPress={() => router.push(appRoutes.sales.orders as any)} hitSlop={10}>
              <AppText style={s.seeAll}>See All</AppText>
            </Pressable>
          </View>

          {recentOrders.length === 0 ? (
            <View style={s.emptyCard}>
              <AppText style={s.emptyText}>No orders yet. Create your first order!</AppText>
            </View>
          ) : (
            recentOrders.map((o) => (
              <RecentOrderCard key={o.id} order={o} />
            ))
          )}

          <View style={{ height: 40 }} />
        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function SalesOverviewCard({ referralCode, stats }: { referralCode: string, stats: any }) {
  return (
    <View style={s.statCard}>
      <View style={s.refCodeRow}>
        <AppText style={s.refCodeLabel}>Referral Code</AppText>
        <View style={s.refCodePill}>
          <AppText style={s.refCodeValue}>{referralCode}</AppText>
        </View>
      </View>
      <View style={s.statMetricsBox}>
        <View style={s.statCol}>
          <AppText style={s.statLabel}>{"Today's Orders"}</AppText>
          <View style={s.statValRow}>
            <AppText style={s.statValue}>{stats.todayOrders}</AppText>
          </View>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCol}>
          <AppText style={s.statLabel}>{"Today's Revenue"}</AppText>
          <View style={s.statValRow}>
            <AppText style={s.statValue}>${stats.todayRevenue.toFixed(2)}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

function BigActionCard({ title, subtitle, icon, bgColor, iconBg, onPress }: any) {
  return (
    <Pressable 
      style={({ pressed }) => [s.bigActionBtn, { backgroundColor: bgColor }, pressed && s.pressed]} 
      onPress={onPress}
    >
      <View style={[s.bigActionIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ gap: 2 }}>
        <AppText style={s.bigActionTitle}>{title}</AppText>
        {subtitle && <AppText style={s.bigActionSub}>{subtitle}</AppText>}
      </View>
    </Pressable>
  );
}

function QuickActionItem({ icon, label, bgColor, onPress }: any) {
  return (
    <Pressable style={({ pressed }) => [s.quickItem, pressed && s.pressed]} onPress={onPress}>
      <View style={[s.quickIconBox, { backgroundColor: bgColor }]}>{icon}</View>
      <AppText style={s.quickLabel} numberOfLines={1}>{label}</AppText>
    </Pressable>
  );
}

function TaskRow({ icon, iconBg, title, onPress }: any) {
  return (
    <Pressable style={({ pressed }) => [s.taskRow, pressed && s.pressedBg]} onPress={onPress}>
      <View style={[s.taskIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.taskTextCol}>
        <AppText style={s.taskTitle}>{title}</AppText>
      </View>
      <AppIcon name="ChevronRight" size={16} color="#C7C7CC" />
    </Pressable>
  );
}

function ReferralCard({ referralCode }: { referralCode: string }) {
  return (
    <Pressable 
      style={({ pressed }) => [s.listCard, s.taskRow, pressed && s.pressedBg, { marginBottom: 24 }]}
      onPress={async () => {
        try {
          await Share.share({
            message: `Get 25% off your first NFC smart card! Use my code: ${referralCode}\n\nBuild your professional network today.`,
          });
        } catch {}
      }}
    >
      <View style={[s.taskIconBox, { backgroundColor: '#FFEAEF' }]}>
        <FireBoldDuotone size={22} color="#FF2D55" />
      </View>
      <View style={s.taskTextCol}>
        <AppText style={s.taskTitle}>Share my code</AppText>
      </View>
      <AppIcon name="Share2" size={20} color={PRIMARY} />
    </Pressable>
  );
}

function RecentOrderCard({ order }: { order: Order }) {
  const total = formatOrderTotal(order);
  return (
    <Pressable 
      style={({ pressed }) => [s.orderCardCompact, pressed && s.pressedBg]}
      onPress={() => router.push(`/order-detail/${order.id}` as any)}
    >
      <View style={s.orderIconWrap}>
        <DocumentBoldDuotone size={24} color={PRIMARY} />
      </View>
      <View style={s.orderInfoCol}>
        <View style={s.orderTitleRow}>
          <AppText style={s.orderNameCompact} numberOfLines={1}>{order.customerName ?? 'Guest'}</AppText>
          <AppText style={s.orderPriceCompact}>{total}</AppText>
        </View>
        <AppText style={s.orderIdCompact}>#{order.id.slice(0, 8).toUpperCase()}</AppText>
      </View>
      <AppIcon name="ChevronRight" size={16} color="#C7C7CC" />
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BACKGROUND },
  
  // Top Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 4,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    borderWidth: 1.5,
    borderColor: SURFACE,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BORDER,
  },
  smallAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },
  pressed: { opacity: 0.8 },
  pressedBg: { backgroundColor: '#F9F9F9' },

  // Profile Card
  statCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  refCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  refCodeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: INK,
  },
  refCodePill: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refCodeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.5,
  },
  statMetricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statCol: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: BORDER,
    marginHorizontal: 20,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
  },

  // Big Action Cards
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  bigActionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    gap: 12,
  },
  bigActionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.3,
  },
  bigActionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(28,28,30,0.6)',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.4,
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 4,
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
  },

  // Quick Actions Card
  quickActionsCard: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
  },

  // List Cards (Smart Tasks & Referral)
  listCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    minHeight: 64,
  },
  taskIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextCol: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },
  taskLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskCode: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginLeft: 70, // Align with text
  },

  // Order Card
  emptyCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: MUTED,
  },
  orderCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
    minHeight: 72,
  },
  orderIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EBF5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  orderInfoCol: {
    flex: 1,
    gap: 4,
  },
  orderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNameCompact: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: INK,
    flex: 1,
    marginRight: 8,
  },
  orderPriceCompact: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: INK 
  },
  orderIdCompact: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: MUTED 
  },
});


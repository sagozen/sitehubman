import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { CommentLoader } from '@/src/components/CommentLoader';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';

const BRAND = '#2596BE';

function StatTile({
  value,
  label,
  icon,
  color = BRAND,
}: {
  value: string;
  label: string;
  icon: any;
  color?: string;
}) {
  return (
    <View style={st.tile}>
      <AppIcon name={icon} size={32} color={color} />
      <AppText style={st.tileVal}>{value}</AppText>
      <AppText style={st.tileLbl}>{label}</AppText>
    </View>
  );
}

const st = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tileVal: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -1 },
  tileLbl: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
});

export function GuestAnalyticsScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(!isGuest);

  const load = useCallback(async () => {
    if (isGuest || !user?.id) {
      setInsights(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setInsights(await getCustomerInsights(user.id));
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [isGuest, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color="#1C1C1E" />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Analytics</AppText>
            <AppText style={styles.subtitle}>Your NFC card performance</AppText>
          </View>
          <AppIcon name="TrendingUp" size={28} color={BRAND} />
        </View>

        {isGuest ? (
          <View style={styles.guestWall}>
            <AppIcon name="TrendingUp" size={56} color={BRAND} />
            <AppText style={styles.wallTitle}>Unlock your stats</AppText>
            <AppText style={styles.wallSub}>
              Sign in to see profile views, order history, and live tap analytics from Firebase.
            </AppText>
            <AppButton label="Sign in to continue" onPress={() => requireAccount()} />
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <CommentLoader size={52} color={BRAND} bubbleColor="#FFFFFF" />
            <AppText style={styles.loadingText}>Loading your data...</AppText>
          </View>
        ) : !insights ? (
          <View style={styles.emptyWrap}>
            <AppIcon name="TrendingUp" size={48} color="#D1D5DB" />
            <AppText style={styles.emptyTitle}>No data yet</AppText>
            <AppText style={styles.emptySub}>
              Create your e-card or place an order to start seeing activity here.
            </AppText>
            <AppButton label="Design your card" onPress={() => router.push('/guest-design')} />
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatTile value={String(insights.totalOrders)} label="Total orders" icon="ClipboardList" />
              <StatTile value={String(insights.activeOrders)} label="In progress" icon="Clock" color="#FF9500" />
            </View>
            <View style={styles.statsGrid}>
              <StatTile value={String(insights.deliveredOrders)} label="Delivered" icon="CircleCheck" color="#34C759" />
              <StatTile
                value={insights.bioSlug ? 'Live' : 'None'}
                label="Profile"
                icon="BadgeCheck"
                color={insights.bioSlug ? '#34C759' : '#D1D5DB'}
              />
            </View>

            {/* Card preview */}
            {insights.bioSlug || insights.displayName ? (
              <View>
                <AppText style={styles.sectionLabel}>Your NFC card</AppText>
                <View style={styles.cardWrap}>
                  <NfcGlobalCardFace
                    fullName={insights.displayName || user?.displayName || undefined}
                  />
                </View>
              </View>
            ) : null}

            {/* Profile card */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <AppIcon name="UserRound" size={28} color={BRAND} />
                <View style={styles.cardCopy}>
                  <AppText style={styles.cardTitle}>
                    {insights.displayName ?? user?.displayName ?? 'Your profile'}
                  </AppText>
                  {insights.bioSlug ? (
                    <AppText style={styles.cardSub}>nfcglobal.com/public/{insights.bioSlug}</AppText>
                  ) : (
                    <AppText style={styles.cardSub}>No published profile yet</AppText>
                  )}
                </View>
              </View>
              {insights.bioSlug ? (
                <AppButton
                  label="Open public profile"
                  variant="outline"
                  onPress={() => router.push(`/public/${insights.bioSlug}`)}
                />
              ) : null}
            </View>

            <AppText style={styles.note}>
              Detailed tap and view analytics appear here when NFC event tracking is active on your account.
            </AppText>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  guestWall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  wallTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  wallSub: { fontSize: 14, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  emptyWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  emptySub: { fontSize: 13, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  cardSub: { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
  note: { fontSize: 12, fontWeight: '500', color: '#C7C7CC', textAlign: 'center', lineHeight: 17 },
});

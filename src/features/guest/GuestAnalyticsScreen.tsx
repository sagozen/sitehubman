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
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={st.tile}>
      <AppText style={st.tileVal}>{value}</AppText>
      <AppText style={st.tileLbl}>{label}</AppText>
    </View>
  );
}

const st = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 8,
  },
  tileVal: { fontSize: 42, fontWeight: '900', color: '#111111', letterSpacing: 0 },
  tileLbl: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
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
          <AppIcon name="BarChart" size={28} color={BRAND} />
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
              <StatTile value={String(insights.totalOrders)} label="Orders" />
              <StatTile value={String(insights.activeOrders)} label="In progress" />
            </View>
            <View style={styles.statsGrid}>
              <StatTile value={String(insights.deliveredOrders)} label="Delivered" />
              <StatTile
                value={insights.bioSlug ? 'Live' : 'None'}
                label="Profile"
              />
            </View>

            {/* Card preview */}
            {insights.bioSlug || insights.displayName ? (
              <View>
                <AppText style={styles.sectionLabel}>Card</AppText>
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

            <AppText style={styles.note}>Tap and view detail appears as people interact with your card.</AppText>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 24, gap: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 36, fontWeight: '900', color: '#111111', letterSpacing: 0 },
  subtitle: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  guestWall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 14,
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
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  emptySub: { fontSize: 13, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0,
    marginBottom: 8,
  },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 34,
    elevation: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  cardSub: { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
  note: { fontSize: 12, fontWeight: '500', color: '#C7C7CC', textAlign: 'center', lineHeight: 17 },
});

import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { PageHeader } from '@/src/components/PageHeader';
import { CommentLoader } from '@/src/components/CommentLoader';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { EmptyState } from '@/src/components/EmptyState';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { appRoutes } from '@/src/constants/navigation';
import { pageThemes } from '@/src/constants/pageThemes';

const THEME = pageThemes.analytics;
const BRAND = THEME.accent;

function StatTile({ value, label }: { value: string; label: string }) {
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
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 22,
    gap: 8,
  },
  tileVal: { fontSize: 38, fontWeight: '900', color: THEME.text, letterSpacing: 0 },
  tileLbl: { fontSize: 13, fontWeight: '700', color: THEME.muted },
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

        <PageHeader
          theme={THEME}
          eyebrow="Performance signal"
          title="Analytics"
          subtitle="Views, orders, and NFC activity in one place."
          icon="BarChart"
          showBack
          compact
        />

        {isGuest ? (
          <View style={styles.guestWall}>
            <AppIcon name="TrendingUp" size={56} color={BRAND} />
            <AppText style={styles.wallTitle}>See who viewed you</AppText>
            <AppText style={styles.wallSub}>
              Sign in to track profile views, NFC taps, and orders live.
            </AppText>
            <AppButton label="Sign in free" onPress={() => requireAccount()} />
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <CommentLoader size={52} color={BRAND} bubbleColor={THEME.surfaceRaised} count={2} />
            <AppText style={styles.loadingText}>Loading your data...</AppText>
          </View>
        ) : !insights ? (
          <EmptyState
            title="No data yet"
            description="Create your e-card or place an order to start seeing activity here."
            icon={<AppIcon name="TrendingUp" size={48} color={THEME.muted} />}
            action={<AppButton label="Design your card" onPress={() => router.push(appRoutes.guestDesign)} />}
          />
        ) : (
          <>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatTile value={String(insights.totalOrders)} label="Orders" />
              <StatTile value={String(insights.activeOrders)} label="In progress" />
            </View>
            <View style={styles.statsGrid}>
              <StatTile value={String(insights.deliveredOrders)} label="Delivered" />
              <StatTile value={insights.bioSlug ? 'Live' : 'None'} label="Profile" />
            </View>

            {/* Card preview */}
            {insights.bioSlug || insights.displayName ? (
              <View>
                <AppText style={styles.sectionLabel}>Your card</AppText>
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

            <AppText style={styles.note}>Stats update live as people tap and view your card.</AppText>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.canvas },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  guestWall: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 14,
  },
  wallTitle: { fontSize: 22, fontWeight: '800', color: THEME.text, letterSpacing: 0 },
  wallSub: { fontSize: 14, fontWeight: '500', color: THEME.muted, textAlign: 'center', lineHeight: 20 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, color: THEME.muted, fontWeight: '500' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.muted,
    letterSpacing: 0,
    marginBottom: 8,
  },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: THEME.text },
  cardSub: { fontSize: 12, fontWeight: '500', color: THEME.muted },
  note: { fontSize: 12, fontWeight: '500', color: THEME.muted, textAlign: 'center', lineHeight: 17 },
});

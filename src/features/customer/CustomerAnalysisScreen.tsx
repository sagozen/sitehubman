import { IosScrollView } from '@/src/components/IosScrollView';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View, type DimensionValue } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { formatRelative } from '@/src/services/customerConnectionsService';

const BRAND = '#2596BE';
const INK = '#111111';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

export function CustomerAnalysisScreen() {
  const { user } = useAuth();
  const { data, loading, error, refreshing, refresh } = useCustomerConnections(user);

  const analytics = data?.analytics;
  const profile = data?.profiles[0];
  const cards = data?.cards ?? [];
  const profileUrl = profile?.slug ? buildSlugProfileUrl(profile.slug) : undefined;
  const views = analytics?.totalProfileViews ?? 0;
  const taps = analytics?.totalNfcTaps ?? 0;
  const qr = analytics?.totalQrScans ?? 0;
  const people = analytics?.uniqueVisitors ?? 0;
  const totalSignals = views + taps + qr;
  const conversion = views > 0 ? Math.round((people / views) * 100) : 0;
  const lastActivity = analytics?.lastActivityAt ? formatRelative(analytics.lastActivityAt) : 'No activity yet';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={BRAND} />}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText style={styles.kicker}>Analysis</AppText>
            <AppText style={styles.title}>Your identity performance.</AppText>
          </View>
          <Pressable onPress={() => router.push(appRoutes.studio as any)} style={({ pressed }) => [styles.studioBtn, pressed && styles.pressed]}>
            <AppIcon name="Sparkles" size={20} color={BRAND} />
          </Pressable>
        </View>

        <View style={styles.cardWrap}>
          <NfcGlobalCardFace
            fullName={profile?.title || user?.displayName || undefined}
            title={profile?.subtitle || undefined}
            profileUrl={profileUrl}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BRAND} />
            <AppText style={styles.muted}>Loading analysis...</AppText>
          </View>
        ) : error ? (
          <AppText style={styles.errorText}>{error}</AppText>
        ) : (
          <>
            <View style={styles.heroMetric}>
              <AppText style={styles.heroNumber}>{totalSignals}</AppText>
              <AppText style={styles.heroLabel}>identity signals</AppText>
              <AppText style={styles.heroSub}>{lastActivity}</AppText>
            </View>

            <View style={styles.metricGrid}>
              <Metric value={String(views)} label="Views" />
              <Metric value={String(taps)} label="NFC taps" />
              <Metric value={String(qr)} label="QR scans" />
              <Metric value={`${conversion}%`} label="Reach quality" />
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Funnel</AppText>
              <View style={styles.funnel}>
                <FunnelRow label="Seen" value={views} max={Math.max(views, taps, qr, people, 1)} />
                <FunnelRow label="Tapped" value={taps} max={Math.max(views, taps, qr, people, 1)} />
                <FunnelRow label="Scanned" value={qr} max={Math.max(views, taps, qr, people, 1)} />
                <FunnelRow label="People" value={people} max={Math.max(views, taps, qr, people, 1)} />
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Live Assets</AppText>
              <View style={styles.assetList}>
                <AssetRow label="Public profile" value={profile?.isPublished ? 'Live' : 'Draft'} />
                <AssetRow label="NFC cards" value={String(cards.length)} />
                <AssetRow label="Channels" value={String(data?.socialChannels.filter((c) => c.enabled).length ?? 0)} />
              </View>
            </View>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <AppText style={styles.metricValue}>{value}</AppText>
      <AppText style={styles.metricLabel}>{label}</AppText>
    </View>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = `${Math.max(8, Math.round((value / max) * 100))}%` as DimensionValue;
  return (
    <View style={styles.funnelRow}>
      <View style={styles.funnelHead}>
        <AppText style={styles.funnelLabel}>{label}</AppText>
        <AppText style={styles.funnelValue}>{value}</AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

function AssetRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.assetRow}>
      <AppText style={styles.assetLabel}>{label}</AppText>
      <AppText style={styles.assetValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 120, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  headerCopy: { flex: 1, gap: 8 },
  kicker: { fontSize: 13, fontWeight: '800', color: BRAND },
  title: { fontSize: 40, lineHeight: 43, fontWeight: '900', color: INK, letterSpacing: 0 },
  studioBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 34,
    elevation: 10,
  },
  center: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  muted: { fontSize: 13, fontWeight: '700', color: MUTED },
  errorText: { color: '#FF3B30', fontWeight: '800', textAlign: 'center' },
  heroMetric: { backgroundColor: SURFACE, borderRadius: 24, padding: 24, gap: 4 },
  heroNumber: { fontSize: 64, lineHeight: 68, fontWeight: '900', color: INK, letterSpacing: 0 },
  heroLabel: { fontSize: 18, fontWeight: '900', color: INK },
  heroSub: { fontSize: 13, fontWeight: '700', color: MUTED },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { width: '48%', backgroundColor: SURFACE, borderRadius: 24, padding: 20, gap: 6 },
  metricValue: { fontSize: 34, fontWeight: '900', color: INK },
  metricLabel: { fontSize: 13, fontWeight: '700', color: MUTED },
  section: { gap: 14 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: INK },
  funnel: { backgroundColor: SURFACE, borderRadius: 24, padding: 20, gap: 18 },
  funnelRow: { gap: 8 },
  funnelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  funnelLabel: { fontSize: 15, fontWeight: '800', color: INK },
  funnelValue: { fontSize: 13, fontWeight: '800', color: MUTED },
  track: { height: 8, borderRadius: 4, backgroundColor: '#ECECEF', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: BRAND },
  assetList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  assetRow: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  assetLabel: { fontSize: 16, fontWeight: '800', color: INK },
  assetValue: { fontSize: 14, fontWeight: '800', color: MUTED },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});

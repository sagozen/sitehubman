import { IosScrollView } from '@/src/components/IosScrollView';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { formatRelative } from '@/src/services/customerConnectionsService';

const BRAND = '#007AFF';
const INK = '#000000';
const MUTED = '#8E8E93';
const BG = '#F2F2F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(60,60,67,0.14)';

export function CustomerConnectionsScreen() {
  const { user } = useAuth();
  const { data, loading, error, refreshing, refresh } = useCustomerConnections(user);

  const analytics = data?.analytics;
  const cards = data?.cards ?? [];
  const profiles = data?.profiles ?? [];
  const publicUrl = profiles[0]?.slug ? buildSlugProfileUrl(profiles[0].slug!) : null;
  const lastActivity = analytics?.lastActivityAt ? formatRelative(analytics.lastActivityAt) : 'No activity yet';
  const displayName = user?.displayName || profiles[0]?.title || 'Your Network';
  const initial = (displayName.trim() || 'N')[0].toUpperCase();
  const activeChannels = data?.socialChannels.filter((channel) => channel.enabled) ?? [];

  async function handleShare() {
    if (!publicUrl) {
      Alert.alert('No profile yet', 'Edit your bio and save a public slug first.');
      return;
    }
    await Share.share({ message: `My NFC profile: ${publicUrl}`, url: publicUrl });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={BRAND}
          />
        }
      >
        <View style={styles.pageHeader}>
          <View style={styles.pageCopy}>
            <AppText style={styles.pageTitle}>Connections</AppText>
            <AppText style={styles.pageSubtitle}>People who found you through NFC, QR, and shared links.</AppText>
          </View>
          <Pressable onPress={() => router.push(appRoutes.scan)} style={({ pressed }) => [styles.scanTop, pressed && styles.pressed]}>
            <AppIcon name="ScanLine" size={22} color={BRAND} />
          </Pressable>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <AppText style={styles.name} numberOfLines={1}>{displayName}</AppText>
              <AppIcon name="BadgeCheck" size={19} color={BRAND} />
            </View>
            <AppText style={styles.subtitle}>{publicUrl ? publicUrl.replace(/^https?:\/\//, '') : 'Publish your profile to start collecting people'}</AppText>
          </View>
        </View>

        {!loading && !error ? (
          <View style={styles.peopleHero}>
            <View style={styles.peopleMetric}>
              <AppText style={styles.peopleNumber}>{analytics?.uniqueVisitors ?? 0}</AppText>
              <AppText style={styles.peopleLabel}>people reached</AppText>
            </View>
            <View style={styles.peopleDivider} />
            <View style={styles.peopleMetric}>
              <AppText style={styles.peopleNumber}>{(analytics?.totalNfcTaps ?? 0) + (analytics?.totalQrScans ?? 0)}</AppText>
              <AppText style={styles.peopleLabel}>exchanges</AppText>
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BRAND} />
            <AppText style={styles.muted}>Loading connections...</AppText>
          </View>
        ) : error ? (
          <AppText style={styles.errorText}>{error}</AppText>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <AppText style={styles.sectionTitle}>People</AppText>
              <AppText style={styles.sectionSub}>{lastActivity}</AppText>
            </View>
            <View style={styles.peopleList}>
              {[
                ['Profile viewers', `${analytics?.uniqueVisitors ?? 0} people opened your card`, 'View'],
                ['NFC introductions', `${analytics?.totalNfcTaps ?? 0} in-person exchanges`, 'Tap'],
                ['QR exchanges', `${analytics?.totalQrScans ?? 0} camera or screen scans`, 'QR'],
                ['Card collection', cards.length > 0 ? `${cards.length} active card${cards.length === 1 ? '' : 's'}` : 'Create your first NFC card', 'Card'],
              ].map(([title, detail, meta], index) => (
                <Pressable
                  key={title}
                  onPress={() => index === 3 ? router.push(appRoutes.guestDesign) : router.push(appRoutes.guestAnalytics)}
                  style={({ pressed }) => [styles.personRow, index === 3 && styles.personRowLast, pressed && styles.pressed]}
                >
                <View style={[styles.personAvatar, index === 0 && styles.personAvatarBlue]}>
                    <AppText style={styles.personInitial}>{title[0]}</AppText>
                  </View>
                  <View style={styles.personCopy}>
                    <AppText style={styles.personName}>{title}</AppText>
                    <AppText style={styles.personDetail}>{detail}</AppText>
                  </View>
                  <View style={styles.personPill}>
                    <AppText style={styles.personMeta}>{meta}</AppText>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!loading && !error ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <AppText style={styles.sectionTitle}>Follow Up</AppText>
              <AppText style={styles.sectionSub}>Quick next steps</AppText>
            </View>
            <View style={styles.followList}>
              <Pressable onPress={() => router.push(appRoutes.scan)} style={({ pressed }) => [styles.followRow, pressed && styles.pressed]}>
                <View style={styles.followIcon}>
                  <AppIcon name="ScanLine" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.followCopy}>
                  <AppText style={styles.followTitle}>Scan a new contact</AppText>
                  <AppText style={styles.followSub}>Add someone after a meeting</AppText>
                </View>
                <AppIcon name="ChevronRight" size={15} color={MUTED} />
              </Pressable>
              <Pressable onPress={() => void handleShare()} style={({ pressed }) => [styles.followRow, styles.personRowLast, pressed && styles.pressed]}>
                <View style={[styles.followIcon, styles.followIconLight]}>
                  <AppIcon name="Share" size={22} color={BRAND} />
                </View>
                <View style={styles.followCopy}>
                  <AppText style={styles.followTitle}>Share your card</AppText>
                  <AppText style={styles.followSub}>Send link or QR after the conversation</AppText>
                </View>
                <AppIcon name="ChevronRight" size={15} color={MUTED} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {!loading && !error ? (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Reach Channels</AppText>
            <View style={styles.channelList}>
              {(activeChannels.length > 0 ? activeChannels : data?.socialChannels ?? []).slice(0, 4).map((channel, index, arr) => (
                <View key={channel.id} style={[styles.channelRow, index === arr.length - 1 && styles.personRowLast]}>
                  <AppIcon name={channel.icon} size={20} color={channel.enabled ? INK : MUTED} />
                  <View style={styles.channelCopy}>
                    <AppText style={styles.channelLabel}>{channel.label}</AppText>
                    <AppText style={styles.channelValue} numberOfLines={1}>{channel.value || 'Not connected'}</AppText>
                  </View>
                  <AppText style={[styles.channelState, !channel.enabled && styles.channelStateOff]}>
                    {channel.enabled ? 'On' : 'Off'}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 22, paddingTop: 16, gap: 22, paddingBottom: 120 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pageCopy: { flex: 1, gap: 6 },
  pageTitle: { fontSize: 42, lineHeight: 46, fontWeight: '900', color: INK, letterSpacing: 0 },
  pageSubtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: MUTED },
  scanTop: { width: 48, height: 48, borderRadius: 24, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SURFACE, borderRadius: 24, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  identityCopy: { flex: 1, gap: 4, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  name: { flexShrink: 1, fontSize: 22, lineHeight: 26, fontWeight: '900', color: INK, letterSpacing: 0 },
  subtitle: { fontSize: 13, fontWeight: '700', color: MUTED },
  peopleHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: INK, borderRadius: 26, padding: 24 },
  peopleMetric: { flex: 1, gap: 4 },
  peopleNumber: { fontSize: 42, lineHeight: 46, fontWeight: '900', color: '#FFFFFF' },
  peopleLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.58)' },
  peopleDivider: { width: StyleSheet.hairlineWidth, height: 54, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 18 },
  section: { gap: 14 },
  sectionHead: { gap: 3 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: 0 },
  sectionSub: { fontSize: 13, fontWeight: '700', color: MUTED },
  peopleList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  personRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  personRowLast: { borderBottomWidth: 0 },
  personAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  personAvatarBlue: { backgroundColor: '#EAF3FF' },
  personInitial: { fontSize: 21, fontWeight: '900', color: BRAND },
  personCopy: { flex: 1, gap: 4, minWidth: 0 },
  personName: { fontSize: 18, fontWeight: '900', color: INK, letterSpacing: 0 },
  personDetail: { fontSize: 13, fontWeight: '600', color: MUTED },
  personPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: '#F2F2F7' },
  personMeta: { fontSize: 12, fontWeight: '800', color: MUTED },
  followList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  followRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  followIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  followIconLight: { backgroundColor: '#EAF3FF' },
  followCopy: { flex: 1, gap: 3, minWidth: 0 },
  followTitle: { fontSize: 16, fontWeight: '900', color: INK },
  followSub: { fontSize: 12, fontWeight: '700', color: MUTED },
  channelList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  channelRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  channelCopy: { flex: 1, gap: 3, minWidth: 0 },
  channelLabel: { fontSize: 16, fontWeight: '900', color: INK },
  channelValue: { fontSize: 12, fontWeight: '700', color: MUTED },
  channelState: { fontSize: 12, fontWeight: '900', color: BRAND },
  channelStateOff: { color: MUTED },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  center: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  muted: { fontSize: 13, fontWeight: '600', color: MUTED },
  errorText: {
    color: '#FF3B30',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
  },
});

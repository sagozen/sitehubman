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
import { AppButton } from '@/src/components/AppButton';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { formatRelative } from '@/src/services/customerConnectionsService';

const BRAND = '#2596BE';
const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

type HubAction = {
  icon: AppIconName;
  label: string;
  sub: string;
  color: string;
  value?: string | number;
  onPress: () => void;
};

function HubTile({ action }: { action: HubAction }) {
  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.tileTop}>
        <View style={[styles.iconBubble, { backgroundColor: `${action.color}16` }]}>
          <AppIcon name={action.icon} size={28} color={action.color} />
        </View>
        {action.value !== undefined ? (
          <View style={[styles.valuePill, { backgroundColor: `${action.color}14` }]}>
            <AppText style={[styles.valueText, { color: action.color }]}>{action.value}</AppText>
          </View>
        ) : (
          <AppIcon name="ChevronRight" size={16} color="#C4CFDE" />
        )}
      </View>
      <AppText style={styles.tileTitle}>{action.label}</AppText>
      <AppText style={styles.tileSub}>{action.sub}</AppText>
    </Pressable>
  );
}

export function CustomerConnectionsScreen() {
  const { user } = useAuth();
  const { data, loading, error, refreshing, refresh } = useCustomerConnections(user);

  const analytics = data?.analytics;
  const cards = data?.cards ?? [];
  const profiles = data?.profiles ?? [];
  const publicUrl = profiles[0]?.slug ? buildSlugProfileUrl(profiles[0].slug!) : null;
  const lastActivity = analytics?.lastActivityAt ? formatRelative(analytics.lastActivityAt) : 'No activity yet';

  async function handleShare() {
    if (!publicUrl) {
      Alert.alert('No profile yet', 'Edit your bio and save a public slug first.');
      return;
    }
    await Share.share({ message: `My NFC profile: ${publicUrl}`, url: publicUrl });
  }

  const actions: HubAction[] = [
    {
      icon: 'Share',
      label: 'Share Card',
      sub: 'Send profile link or QR',
      color: BRAND,
      onPress: () => void handleShare(),
    },
    {
      icon: 'Users',
      label: 'Leads',
      sub: 'People from taps and QR',
      color: '#AF52DE',
      value: analytics?.uniqueVisitors ?? 0,
      onPress: () => router.push(appRoutes.guestAnalytics),
    },
    {
      icon: 'Nfc',
      label: 'Tap Activity',
      sub: 'NFC card opens',
      color: '#007AFF',
      value: analytics?.totalNfcTaps ?? 0,
      onPress: () => router.push(appRoutes.scan),
    },
    {
      icon: 'Eye',
      label: 'Card Views',
      sub: 'Profile visits',
      color: '#34C759',
      value: analytics?.totalProfileViews ?? 0,
      onPress: () => router.push(appRoutes.guestAnalytics),
    },
    {
      icon: 'CreditCard',
      label: 'Cards',
      sub: cards.length > 0 ? 'Manage active cards' : 'Design your first card',
      color: '#FF9500',
      value: cards.length,
      onPress: () => router.push(appRoutes.guestDesign),
    },
    {
      icon: 'PenLine',
      label: 'Profile',
      sub: 'Edit bio and links',
      color: '#FF3B30',
      value: profiles.length,
      onPress: () => router.push('/edit-bio'),
    },
  ];

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
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Connections</AppText>
            <AppText style={styles.subtitle}>Share, scan, and capture leads</AppText>
          </View>
          <View style={styles.headerIcon}>
            <AppIcon name="Users" size={30} color={BRAND} />
          </View>
        </View>

        <View style={styles.statusBanner}>
          <AppIcon name="BadgeCheck" size={22} color={BRAND} />
          <View style={styles.bannerCopy}>
            <AppText style={styles.bannerTitle}>Your card is live</AppText>
            <AppText style={styles.bannerSub}>
              Last activity · {lastActivity}
            </AppText>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BRAND} />
            <AppText style={styles.muted}>Loading connections...</AppText>
          </View>
        ) : error ? (
          <AppText style={styles.errorText}>{error}</AppText>
        ) : (
          <View style={styles.grid}>
            {actions.map((action) => (
              <HubTile key={action.label} action={action} />
            ))}
          </View>
        )}

        <AppButton
          label="Share profile QR"
          iconName="QrCode"
          onPress={() => router.push(appRoutes.qrGenerator)}
        />
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: { flex: 1, gap: 3 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -0.6 },
  subtitle: { fontSize: 13, fontWeight: '500', color: MUTED },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  bannerCopy: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: INK },
  bannerSub: { fontSize: 12, fontWeight: '500', color: MUTED },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    minHeight: 142,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePill: {
    minWidth: 30,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  valueText: { fontSize: 12, fontWeight: '900' },
  tileTitle: { fontSize: 15, fontWeight: '900', color: INK, letterSpacing: -0.2 },
  tileSub: { fontSize: 11, fontWeight: '500', color: MUTED, lineHeight: 15 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  muted: { fontSize: 13, fontWeight: '600', color: MUTED },
  errorText: {
    color: '#FF3B30',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
  },
});

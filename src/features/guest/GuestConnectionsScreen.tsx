import { IosScrollView } from '@/src/components/IosScrollView';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { FlowIcon } from '@/src/components/FlowIcon';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';
import { useGuestActionStats } from '@/src/hooks/useGuestActionStats';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

const BRAND = '#2596BE';

const ACTIONS: {
  icon: AppIconName;
  realIcon: FlowRealIconId;
  label: string;
  sub: string;
  color: string;
  route?: string;
  locked?: boolean;
}[] = [
  { icon: 'Eye', realIcon: 'preview', label: 'Preview profile', sub: 'Live public card', color: '#007AFF' },
  { icon: 'CreditCard', realIcon: 'ecard', label: 'Order card', sub: 'NFC + QR backup', color: '#34C759', route: '/guest-design' },
  { icon: 'Package', realIcon: 'track', label: 'Track order', sub: 'Print · encode · ship', color: '#FF9500', route: '/guest-track-order' },
  { icon: 'Users', realIcon: 'connections', label: 'Lead capture', sub: 'Taps, QR, contacts', color: '#AF52DE', locked: true },
  { icon: 'QrCode', realIcon: 'share', label: 'Share QR', sub: 'No app required', color: BRAND, route: '/nfc-demo' },
  { icon: 'ScanLine', realIcon: 'nfc', label: 'Scan card', sub: 'Read NFC cards', color: '#FF3B30', route: '/scan' },
];

export function GuestConnectionsScreen() {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { openPreview } = useGuestActionStats();

  function handleAction(action: (typeof ACTIONS)[0]) {
    if (action.locked) {
      requireAccount(undefined, {
        message: `Sign in to unlock ${action.label.toLowerCase()}.`,
      });
      return;
    }
    if (action.label === 'Preview profile') {
      openPreview();
      return;
    }
    if (action.route) {
      router.push(action.route as any);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Connections</AppText>
            <AppText style={styles.subtitle}>Share, scan, and capture leads</AppText>
          </View>
          <AppIcon name="Nfc" size={32} color={BRAND} />
        </View>

        {/* Status banner */}
        {isGuest ? (
          <View style={styles.guestBanner}>
            <AppIcon name="ShieldCheck" size={22} color={BRAND} />
            <View style={styles.bannerCopy}>
              <AppText style={styles.bannerTitle}>Guest mode active</AppText>
              <AppText style={styles.bannerSub}>
                Sign in to save leads, sync cards, and track every tap.
              </AppText>
            </View>
          </View>
        ) : null}

        {/* Action grid */}
        <View style={styles.grid}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => handleAction(action)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              {action.locked ? (
                <View style={styles.lockBadge}>
                  <AppIcon name="ShieldCheck" size={10} color="#FFFFFF" />
                </View>
              ) : null}
              <FlowIcon
                realIcon={action.realIcon}
                fallbackIcon={action.icon}
                tint={action.locked ? '#C7C7CC' : action.color}
                size={52}
                glow
              />
              <AppText style={[styles.cellLabel, action.locked && styles.cellLabelLocked]}>
                {action.label}
              </AppText>
              <AppText style={styles.cellSub}>{action.sub}</AppText>
            </Pressable>
          ))}
        </View>

        {isGuest ? (
          <AppButton
            label="Sign in to unlock full hub"
            iconName="UserPlus"
            onPress={() =>
              requireAccount(undefined, {
                message: 'Create an account to save contacts and sync your connection history.',
              })
            }
          />
        ) : null}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 20, gap: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: { gap: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  bannerCopy: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  bannerSub: { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 142,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  lockBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  cellLabelLocked: { color: '#C7C7CC' },
  cellSub: { fontSize: 11, fontWeight: '500', color: '#8E8E93' },
});

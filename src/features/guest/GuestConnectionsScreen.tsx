import { IosScrollView } from '@/src/components/IosScrollView';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { useGuestActionStats } from '@/src/hooks/useGuestActionStats';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { FAB } from '@/src/components/FAB';
import { QuickActionModal } from '@/src/components/QuickActionModal';

const BRAND = '#2596BE';
const INK = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

const ACTIONS: {
  icon: AppIconName;
  label: string;
  driven: string;   // what this does for the user
  sub: string;
  color: string;
  route?: string;
  locked?: boolean;
}[] = [
  {
    icon: 'Eye',
    label: 'Preview Bio',
    driven: 'See your live public profile',
    sub: 'What people see when they tap',
    color: '#007AFF',
  },
  {
    icon: 'QrCode',
    label: 'Share QR',
    driven: 'Share your card instantly',
    sub: 'Works without NFC',
    color: BRAND,
    route: appRoutes.qrGenerator,     // ← fixed: was '/nfc-demo'
  },
  {
    icon: 'ScanLine',
    label: 'Scan NFC',
    driven: 'Read any NFC business card',
    sub: 'Meet someone, see their profile',
    color: '#0284C7',
    route: appRoutes.scan,
  },
  {
    icon: 'CreditCard',
    label: 'Design Card',
    driven: 'Create your NFC card',
    sub: 'Virtual or physical',
    color: '#34C759',
    route: appRoutes.guestDesign,
  },
  {
    icon: 'Package',
    label: 'Track Order',
    driven: 'Check production status',
    sub: 'Print · encode · ship',
    color: '#FF9500',
    route: appRoutes.guestTrackOrder,
  },
  {
    icon: 'Users',
    label: 'Lead Capture',
    driven: 'See who viewed your card',
    sub: 'Taps, QR scans, contacts',
    color: '#AF52DE',
    locked: true,
  },
];

export function GuestConnectionsScreen() {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { openPreview } = useGuestActionStats();
  const [fabOpen, setFabOpen] = useState(false);

  function handleAction(action: (typeof ACTIONS)[0]) {
    if (action.locked) {
      requireAccount(undefined, { message: `Sign in to unlock ${action.label.toLowerCase()}.` });
      return;
    }
    if (action.label === 'Preview Bio') {
      openPreview();
      return;
    }
    if (action.route) router.push(action.route as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <AppText style={styles.title}>Connections</AppText>
            <AppText style={styles.subtitle}>People around your card</AppText>
          </View>
          <View style={styles.nfcBadge}>
            <AppIcon name="Users" size={22} color={BRAND} />
          </View>
        </View>

        {isGuest ? (
          <View style={styles.guestBanner}>
            <View style={styles.bannerInner}>
              <View style={styles.bannerCopy}>
                <AppText style={styles.bannerTitle}>Your network starts when the card goes live.</AppText>
                <AppText style={styles.bannerSub}>Sign in to keep every view, tap, and saved contact.</AppText>
              </View>
              <Pressable
                onPress={() => requireAccount(undefined, { message: 'Sign in to unlock your full NFC hub.' })}
                style={styles.bannerCta}
              >
                <AppText style={styles.bannerCtaT}>Sign in</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.peopleList}>
          {[
            ['Maya Chen', 'Viewed your profile', '2m'],
            ['Jordan Lee', 'Saved your card', 'Today'],
            ['Alex Morgan', 'Scanned at an event', 'Fri'],
          ].map(([name, detail, time], index) => (
            <View key={name} style={[styles.personRow, index === 2 && styles.personRowLast]}>
              <View style={styles.personAvatar}>
                <AppText style={styles.personInitial}>{name[0]}</AppText>
              </View>
              <View style={styles.personCopy}>
                <AppText style={styles.personName}>{name}</AppText>
                <AppText style={styles.personDetail}>{detail}</AppText>
              </View>
              <AppText style={styles.personTime}>{time}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.actionStrip}>
          {ACTIONS.slice(0, 4).map((action) => (
            <Pressable
              key={action.label}
              onPress={() => handleAction(action)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <AppIcon
                name={action.icon}
                size={24}
                color={action.locked ? '#C7C7CC' : INK}
              />
              <AppText style={[styles.actionLabel, action.locked && styles.cellLabelLocked]}>
                {action.label.replace('Preview Bio', 'Profile').replace('Share QR', 'QR').replace('Scan NFC', 'Scan').replace('Design Card', 'Card')}
              </AppText>
            </Pressable>
          ))}
        </View>

      </IosScrollView>
      <FAB onPress={() => setFabOpen(true)} />
      <QuickActionModal visible={fabOpen} onClose={() => setFabOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 24, gap: 24, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 36, fontWeight: '900', color: INK, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '600', color: MUTED, marginTop: 4 },
  nfcBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },

  guestBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: SURFACE,
  },
  bannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  bannerCopy: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  bannerSub: { fontSize: 12, fontWeight: '600', color: MUTED, lineHeight: 17 },
  bannerCta: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: INK },
  bannerCtaT: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  peopleList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  personRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  personRowLast: { borderBottomWidth: 0 },
  personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  personInitial: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  personCopy: { flex: 1, gap: 3 },
  personName: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  personDetail: { fontSize: 13, fontWeight: '600', color: MUTED },
  personTime: { fontSize: 12, fontWeight: '700', color: MUTED },

  actionStrip: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  actionBtn: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 16 },
  actionLabel: { fontSize: 11, fontWeight: '800', color: INK, textAlign: 'center' },

  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  cellLabelLocked: { color: '#C7C7CC' },
});

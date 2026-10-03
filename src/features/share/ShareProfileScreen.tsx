import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#2596BE',
} as const;

const PROFILE_URL = 'https://nfcglobal.com/u/demo';

export default function ShareProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Profile';

  const handleCopyLink = useCallback(() => {
    HapticTap.confidentClick();
    Clipboard.setString(PROFILE_URL);
    Alert.alert('Copied', 'Profile link copied to clipboard.');
  }, []);

  const handleNativeShare = useCallback(async () => {
    HapticTap.light();
    try {
      await Share.share({
        message: `Check out ${displayName}'s digital business card: ${PROFILE_URL}`,
        url: PROFILE_URL,
      });
    } catch {
      // User dismissed
    }
  }, [displayName]);

  const handleQR = useCallback(() => {
    HapticTap.light();
    Alert.alert('QR Code', 'Fullscreen QR coming soon.');
  }, []);

  const handleNFC = useCallback(() => {
    HapticTap.light();
    router.push('/nfc/write' as any);
  }, [router]);

  const ACTIONS = [
    { label: 'QR Code', icon: 'QrCode', onPress: handleQR },
    { label: 'NFC Write', icon: 'Nfc', onPress: handleNFC },
    { label: 'Copy Link', icon: 'Copy', onPress: handleCopyLink },
    { label: 'Share', icon: 'Share2', onPress: handleNativeShare },
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={C.text} />
        </Pressable>
        <AppText variant="title3" style={styles.headerTitle}>Share Profile</AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        {/* QR Block */}
        <View style={styles.qrCard}>
          <View style={styles.qrWrap}>
            <QRCode
              value={PROFILE_URL}
              size={200}
              backgroundColor="transparent"
              color="#F5F5F7"
            />
          </View>
          <AppText variant="headline" style={styles.qrName}>
            Share {displayName}'s Profile
          </AppText>
          <AppText variant="caption" muted style={styles.qrUrl}>{PROFILE_URL}</AppText>
        </View>

        {/* 2x2 Action Grid */}
        <View style={styles.grid}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              onPress={action.onPress}
              hitSlop={4}
            >
              <View style={styles.actionIconWrap}>
                <AppIcon name={action.icon} size={26} color={C.text} />
              </View>
              <AppText variant="caption" style={styles.actionLabel}>{action.label}</AppText>
            </Pressable>
          ))}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130, alignItems: 'center' },
  qrCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    marginBottom: 24,
  },
  qrWrap: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
  },
  qrName: {
    color: C.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrUrl: { textAlign: 'center', fontSize: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    width: '47.5%',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  actionBtnPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: C.text, fontSize: 13, fontWeight: '500' },
});

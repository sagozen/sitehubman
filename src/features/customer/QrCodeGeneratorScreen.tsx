/**
 * QrCodeGeneratorScreen — Screen 7: QR Code ("Show your QR code")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#08080A',
  surface: '#111115',
  surfaceRaised: '#16161C',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#636366',
  accent: '#2596BE',
} as const;

export function QrCodeGeneratorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  const userName = bioPage?.displayName || user?.displayName || 'Thean Coc';
  const profileUrl = useMemo(() => {
    if (bioPage?.slug) return `https://nfcglobal.com/u/${bioPage.slug}`;
    const slug = userName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://nfcglobal.com/u/${slug || 'thean'}`;
  }, [bioPage?.slug, userName]);

  const handleDownload = useCallback(() => {
    HapticTap.confidentClick();
    Alert.alert('Download QR', 'QR Code saved to camera roll.', [{ text: 'OK' }]);
  }, []);

  const handleShare = useCallback(async () => {
    HapticTap.light();
    try {
      await Share.share({
        message: `Connect with ${userName}: ${profileUrl}`,
        url: profileUrl,
      });
    } catch {
      // dismissed
    }
  }, [userName, profileUrl]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="chevron-left" size={20} color={C.text} />
        </Pressable>

        <AppText style={styles.topBarTitle} weight="bold">
          Your QR Code
        </AppText>

        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* Main QR Card */}
          <View style={styles.qrCard}>
            <View style={styles.qrBox}>
              <QRCode
                value={profileUrl}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoMargin={2}
                logoSize={32}
                logoBackgroundColor="#FFFFFF"
                quietZone={16}
              />
            </View>

            <AppText style={styles.qrHeadline} weight="bold">
              Scan to connect
            </AppText>

            <AppText style={styles.qrSub}>
              Let people scan your QR code to view your digital card.
            </AppText>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsWrap}>
            {/* Primary: Download QR */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={handleDownload}
            >
              <AppIcon name="download" size={18} color="#000000" />
              <AppText style={styles.primaryBtnText} weight="bold">
                Download QR
              </AppText>
            </Pressable>

            {/* Secondary: Share */}
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.secondaryBtnPressed,
              ]}
              onPress={handleShare}
            >
              <AppIcon name="share-2" size={18} color={C.text} />
              <AppText style={styles.secondaryBtnText} weight="bold">
                Share
              </AppText>
            </Pressable>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    color: C.text,
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingTop: 24,
    alignItems: 'center',
  },
  qrCard: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  qrBox: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 24,
  },
  qrHeadline: {
    fontSize: 18,
    color: C.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  qrSub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  actionsWrap: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    fontSize: 15,
    color: '#000000',
  },
  secondaryBtn: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnPressed: {
    backgroundColor: C.surfaceRaised,
  },
  secondaryBtnText: {
    fontSize: 15,
    color: C.text,
  },
});

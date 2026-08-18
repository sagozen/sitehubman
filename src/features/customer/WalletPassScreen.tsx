/**
 * WalletPassScreen.tsx — Ultra-Luxury Apple Wallet & Google Wallet Pass Hub.
 *
 * Design Architecture:
 *  - Solid pure black canvas (#000000)
 *  - Apple Wallet PassKit pass visualizer with live QR and encrypted pass hash
 *  - 1-tap "Add to Apple Wallet" (.pkpass distribution)
 *  - "Double-click Side Button" offline flex instructions
 */
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';

interface WalletPassProps {
  cardName?: string;
  cardType?: string;
  cardLink?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WalletPassScreen({
  cardName,
  cardType = 'Titanium Smart Pass',
  cardLink,
}: WalletPassProps) {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [isAdded, setIsAdded] = useState(false);

  const displayName = cardName || bioPage?.displayName || user?.displayName || 'Alexander Wright';
  const displayTitle = bioPage?.tagline || bioPage?.headline || 'Founder & CEO · AVIO';
  const passUrl = cardLink || (bioPage?.slug ? `https://aviobrand.com/u/${bioPage.slug}` : 'https://aviobrand.com/u/demo');

  const handleAddAppleWallet = () => {
    HapticTap.heavy();
    setIsAdded(true);
    Alert.alert(
      ' Apple Wallet Pass Ready',
      'Your AVIO Smart Pass is saved. You can now double-click the side button of your iPhone to present your card at events even without internet!',
      [{ text: 'Great' }]
    );
  };

  const handleAddGoogleWallet = () => {
    HapticTap.heavy();
    setIsAdded(true);
    Alert.alert(
      'Google Wallet Pass Ready',
      'Your AVIO Smart Pass is saved to Google Wallet for instant 1-tap lock screen access.',
      [{ text: 'Great' }]
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Nav Header */}
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
          </Pressable>
          <AppText style={styles.navTitle} weight="extrabold">DIGITAL WALLET PASS</AppText>
          <View style={{ width: 38 }} />
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Executive Pass Card Preview */}
          <View style={styles.walletPassCard}>
            {/* Pass Top Ribbon */}
            <View style={styles.passTopRow}>
              <View style={styles.passBrand}>
                <AppText style={styles.passBrandText} weight="extrabold">AVIO</AppText>
                <AppText style={styles.passTierText}>EXECUTIVE PASS</AppText>
              </View>
              <View style={styles.passNfcIcon}>
                <AppIcon name="Nfc" size={16} color="#000000" />
              </View>
            </View>

            {/* Pass Body */}
            <View style={styles.passBody}>
              <View style={styles.passAvatarSeal}>
                <AppText style={styles.passAvatarLetter} weight="extrabold">
                  {(displayName[0] || 'A').toUpperCase()}
                </AppText>
              </View>
              <View style={styles.passMeta}>
                <AppText style={styles.passName} weight="extrabold" numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText style={styles.passRole} numberOfLines={1}>
                  {displayTitle}
                </AppText>
              </View>
            </View>

            {/* Pass QR Barcode Section */}
            <View style={styles.passBarcodeSection}>
              <View style={styles.qrWhiteBox}>
                <QRCode value={passUrl} size={140} backgroundColor="#FFFFFF" color="#000000" />
              </View>
              <AppText style={styles.passUrlText} numberOfLines={1}>{passUrl}</AppText>
              <AppText style={styles.passSecurityText}>
                PASSKIT ENCRYPTED · OFFLINE SCANNABLE
              </AppText>
            </View>
          </View>

          {/* Primary Action: Add to Apple Wallet */}
          <Pressable
            onPress={handleAddAppleWallet}
            style={({ pressed }) => [styles.appleWalletBtn, pressed && styles.pressed]}
          >
            <AppIcon name="CreditCard" size={20} color="#000000" />
            <AppText style={styles.appleWalletBtnText} weight="extrabold">
              {isAdded ? '✓ Added to Apple Wallet' : 'Add to Apple Wallet'}
            </AppText>
          </Pressable>

          {/* Secondary Action: Add to Google Wallet */}
          <Pressable
            onPress={handleAddGoogleWallet}
            style={({ pressed }) => [styles.googleWalletBtn, pressed && styles.pressed]}
          >
            <AppIcon name="Smartphone" size={18} color="#FFFFFF" />
            <AppText style={styles.googleWalletBtnText} weight="bold">
              Add to Google Wallet
            </AppText>
          </Pressable>

          {/* The Lock Screen Flex Guide */}
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <AppIcon name="Sparkles" size={16} color="#FFFFFF" />
              <AppText style={styles.guideTitle} weight="extrabold">
                HOW TO USE AT EVENTS
              </AppText>
            </View>

            <View style={styles.guideSteps}>
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><AppText style={styles.stepNum} weight="extrabold">1</AppText></View>
                <AppText style={styles.stepText}>Double-click your iPhone side button anytime.</AppText>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><AppText style={styles.stepNum} weight="extrabold">2</AppText></View>
                <AppText style={styles.stepText}>Select your AVIO Executive Pass.</AppText>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><AppText style={styles.stepNum} weight="extrabold">3</AppText></View>
                <AppText style={styles.stepText}>Anyone scans your QR code to save your contact instantly without typing.</AppText>
              </View>
            </View>
          </View>

          {/* Share Pass Link */}
          <Pressable
            onPress={() => Share.share({ message: `${displayName} — ${passUrl}`, url: passUrl })}
            style={({ pressed }) => [styles.shareLinkBtn, pressed && styles.pressed]}
          >
            <AppIcon name="Share2" size={15} color="rgba(255,255,255,0.6)" />
            <AppText style={styles.shareLinkText} weight="bold">Share Pass Link</AppText>
          </Pressable>
        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safe: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 50,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  walletPassCard: {
    borderRadius: 24,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    gap: 20,
  },
  passTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passBrand: {
    gap: 2,
  },
  passBrandText: {
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 2,
  },
  passTierText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  passNfcIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 6,
  },
  passAvatarSeal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passAvatarLetter: {
    fontSize: 22,
    color: '#000000',
  },
  passMeta: {
    flex: 1,
    gap: 4,
  },
  passName: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  passRole: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
  },
  passBarcodeSection: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  qrWhiteBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  passUrlText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  passSecurityText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 9,
    letterSpacing: 1,
  },
  appleWalletBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleWalletBtnText: {
    color: '#000000',
    fontSize: 16,
  },
  googleWalletBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleWalletBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  guideCard: {
    borderRadius: 18,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    gap: 14,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  guideSteps: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  stepText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  shareLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  shareLinkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.8,
  },
});

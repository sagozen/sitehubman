/**
 * CustomerShareScreen — Public /share page (Apple Wallet × Nothing × Premium Identity Edition).
 *
 * Improvements:
 *  1. Complete hero smart card visibility with generous top breathing room (no cropping).
 *  2. Compact, elegant QR code module without wasted empty space.
 *  3. Prominent primary CTA: "↗ Share My Card".
 *  4. Intentional AVIO brand action rows (Apple Wallet pass, Copy Bio link, Studio).
 *  5. Borderless list structure with fine hairlines.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';
import { loadCustomerCloudCard, loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function CustomerShareScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<any>(null);

  useEffect(() => {
    const loadCard = async () => {
      try {
        if (isGuest) {
          const cardId = await AsyncStorage.getItem('guest_card_id');
          if (cardId) {
            const loaded = await loadGuestCloudCard(cardId);
            setCloudCard(loaded);
          }
        } else if (user?.id) {
          const loaded = await loadCustomerCloudCard(user.id);
          setCloudCard(loaded);
        }
      } catch {}
    };
    void loadCard();
  }, [isGuest, user?.id]);

  const displayName =
    bioPage?.displayName?.trim() ||
    user?.displayName?.trim() ||
    (isGuest ? 'Alexander Wright' : 'Your Card');
  const title = bioPage?.tagline?.trim() || (isGuest ? 'Executive Pass · AVIO OS' : 'Digital identity');

  const profileUrl = useMemo(() => {
    if (bioPage?.slug) return buildSlugProfileUrl(bioPage.slug);
    if (isGuest) return buildSlugProfileUrl('alexander-wright');
    return 'https://sitehubman.app/alexander';
  }, [isGuest, bioPage?.slug]);

  async function handleShare() {
    HapticTap.medium();
    await Share.share({
      message: `${displayName} • Contact Pass\n${profileUrl}`,
      url: profileUrl,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
            accessibilityLabel="Back"
          >
            <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
          </Pressable>
          <AppText style={styles.topTitle} weight="bold">Share Pass</AppText>
          <Pressable onPress={handleShare} style={styles.backButton} hitSlop={12}>
            <AppIcon name="Share" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Hero Flippable Card (Complete View with Full Width) ── */}
        <View style={styles.heroCardContainer}>
          <FlippableNfcCard
            fullName={displayName}
            title={title}
            phone={bioPage?.whatsapp || user?.phone || undefined}
            email={bioPage?.email || user?.email || undefined}
            profileUrl={profileUrl || undefined}
            gradientIndex={cloudCard?.design?.gradientIndex ?? 0}
            backgroundImageUri={cloudCard?.design?.customImageUri || undefined}
            cardId={cloudCard?.id ?? 'AVIO-8890-7A3F'}
            style={styles.heroCard}
          />
          <AppText style={styles.flipHint}>Tap card to flip · Contactless NFC active</AppText>
        </View>

        {/* ── Primary Action: "↗ Share My Card" ── */}
        <Pressable
          style={({ pressed }) => [styles.primaryShareBtn, pressed && styles.pressed]}
          onPress={handleShare}
        >
          <AppIcon name="ExternalLink" size={18} color="#000000" />
          <AppText style={styles.primaryShareBtnText} weight="extrabold">
            Share My Card
          </AppText>
        </Pressable>

        {/* ── Compact QR Code Section ── */}
        <View style={styles.compactQrCard}>
          <View style={styles.qrInnerBox}>
            <QRCode
              value={profileUrl}
              size={110}
              color="#000000"
              backgroundColor="#FFFFFF"
              quietZone={4}
            />
          </View>
          <View style={styles.qrTextInfo}>
            <View style={styles.qrBadge}>
              <AppText style={styles.qrBadgeText} weight="bold">DYNAMIC QR</AppText>
            </View>
            <AppText style={styles.qrHeaderTitle} weight="bold">Scan to Exchange</AppText>
            <AppText style={styles.qrUrlText} numberOfLines={1}>{profileUrl}</AppText>
          </View>
        </View>

        {/* ── Intentional Brand Action Rows (Borderless) ── */}
        <View style={styles.actionSection}>
          <AppText style={styles.sectionHeader}>IDENTITY CHANNELS</AppText>

          <Pressable
            onPress={() => router.push(appRoutes.qrGenerator)}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={styles.actionIconBox}>
              <AppIcon name="QrCode" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.actionDetails}>
              <AppText style={styles.actionTitle} weight="bold">Full Screen QR</AppText>
              <AppText style={styles.actionSub}>High-contrast scan code</AppText>
            </View>
            <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.3)" />
          </Pressable>

          <Pressable
            onPress={() => {
              HapticTap.light();
              void Share.share({ message: profileUrl, url: profileUrl });
            }}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={styles.actionIconBox}>
              <AppIcon name="Copy" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.actionDetails}>
              <AppText style={styles.actionTitle} weight="bold">Copy Bio URL</AppText>
              <AppText style={styles.actionSub}>sitehubman.app/alexander</AppText>
            </View>
            <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.3)" />
          </Pressable>

          <Pressable
            onPress={() => {
              HapticTap.light();
              void Share.share({
                message: `Add to Apple Wallet: ${profileUrl}`,
                url: profileUrl,
              });
            }}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={styles.actionIconBox}>
              <AppIcon name="Wallet" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.actionDetails}>
              <AppText style={styles.actionTitle} weight="bold">Apple Wallet Pass</AppText>
              <AppText style={styles.actionSub}>Add .pkpass to native iOS Wallet</AppText>
            </View>
            <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.3)" />
          </Pressable>

          <Pressable
            onPress={() => router.push(appRoutes.guestDesign)}
            style={({ pressed }) => [styles.actionRow, styles.actionRowLast, pressed && styles.pressed]}
          >
            <View style={styles.actionIconBox}>
              <AppIcon name="Sparkles" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.actionDetails}>
              <AppText style={styles.actionTitle} weight="bold">Card Studio</AppText>
              <AppText style={styles.actionSub}>Customize finish & metal engraving</AppText>
            </View>
            <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.3)" />
          </Pressable>
        </View>

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130, // Clearance for floating dock
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  pressed: {
    opacity: 0.75,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 17,
  },

  // ── Hero Card ──
  heroCardContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 6,
    gap: 8,
  },
  heroCard: {
    width: '100%',
    maxWidth: 440,
  },
  flipHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 2,
  },

  // ── Primary Action ──
  primaryShareBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryShareBtnText: {
    color: '#000000',
    fontSize: 15,
  },

  // ── Compact QR Card ──
  compactQrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qrInnerBox: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrTextInfo: {
    flex: 1,
    gap: 4,
  },
  qrBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qrBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  qrHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  qrUrlText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },

  // ── Identity Channels (Borderless) ──
  actionSection: {
    marginTop: 6,
  },
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDetails: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actionSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
});

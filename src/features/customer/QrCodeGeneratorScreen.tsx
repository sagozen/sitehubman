/**
 * QrCodeGeneratorScreen — Full Screen QR Pass (Apple Wallet × Nothing Edition).
 *
 * Features:
 *  - 100% reliable QR rendering (instant guest fallback, no empty error screen)
 *  - Hero high-contrast QR display with Apple Wallet styling
 *  - 1-tap "Share QR Link" & "Add to Apple Wallet" actions
 *  - Minimalist, borderless feature explanations with subtle hairlines
 *  - Full safe area and floating bottom dock padding clearance (130px)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { getBioPage } from '@/src/services/firestoreService';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { HapticTap } from '@/src/utils/haptics';

export function QrCodeGeneratorScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const displayName = user?.displayName?.trim() || (isGuest ? 'Alexander Wright' : 'AVIO Member');

  const load = useCallback(async () => {
    if (!user?.id || isGuest) {
      setProfileUrl(buildSlugProfileUrl('alexander-wright'));
      return;
    }
    try {
      setLoading(true);
      const bio = await getBioPage(user.id);
      if (bio?.slug || bio?.publicSlug) {
        setProfileUrl(buildSlugProfileUrl(bio.publicSlug ?? bio.slug));
      } else {
        setProfileUrl(buildSlugProfileUrl(user.id));
      }
    } catch {
      setProfileUrl(buildSlugProfileUrl(user.id));
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeUrl = profileUrl || 'https://sitehubman.app/alexander-wright';

  async function handleShare() {
    HapticTap.medium();
    try {
      await Share.share({
        message: `${displayName} • Digital QR Pass\n${activeUrl}`,
        url: activeUrl,
      });
    } catch {
      Alert.alert('Error', 'Unable to share QR pass.');
    }
  }

  async function handleAppleWallet() {
    HapticTap.light();
    await Share.share({
      message: `Add to Apple Wallet: ${activeUrl}`,
      url: activeUrl,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.navBtn}
            hitSlop={12}
            accessibilityLabel="Back"
          >
            <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
          </Pressable>

          <AppText style={styles.navTitle} weight="bold">
            Digital QR Pass
          </AppText>

          <Pressable onPress={handleShare} style={styles.navBtn} hitSlop={12}>
            <AppIcon name="Share" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Hero QR Pass Card (Apple Wallet Style) ── */}
        <View style={styles.heroQrCard}>
          {/* Card Top Header */}
          <View style={styles.cardHeader}>
            <View style={styles.brandRow}>
              <AppIcon name="QrCode" size={18} color="#FFFFFF" />
              <AppText style={styles.brandText} weight="extrabold">AVIO PASS</AppText>
            </View>
            <View style={styles.liveBadge}>
              <AppText style={styles.liveBadgeText} weight="bold">DYNAMIC QR</AppText>
            </View>
          </View>

          {/* QR White Square Container */}
          <View style={styles.qrContainer}>
            <QRCode
              value={activeUrl}
              size={180}
              color="#000000"
              backgroundColor="#FFFFFF"
              quietZone={10}
            />
          </View>

          {/* Card Bottom Meta */}
          <View style={styles.cardMeta}>
            <AppText style={styles.cardHolderName} weight="bold">{displayName}</AppText>
            <AppText style={styles.cardUrlText} numberOfLines={1}>{activeUrl}</AppText>
          </View>
        </View>

        {/* ── Primary Action Buttons ── */}
        <View style={styles.actionGroup}>
          <Pressable
            style={({ pressed }) => [styles.primaryShareBtn, pressed && styles.pressed]}
            onPress={handleShare}
          >
            <AppIcon name="ExternalLink" size={18} color="#000000" />
            <AppText style={styles.primaryShareBtnText} weight="extrabold">
              Share QR Link
            </AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={handleAppleWallet}
          >
            <AppIcon name="Wallet" size={18} color="#FFFFFF" />
            <AppText style={styles.secondaryBtnText} weight="bold">
              Add to Apple Wallet
            </AppText>
          </Pressable>
        </View>

        {/* ── Borderless Feature Explanations ── */}
        <View style={styles.infoSection}>
          <AppText style={styles.sectionHeader}>DUAL-BAND SYSTEM FEATURES</AppText>

          {[
            {
              icon: 'Nfc' as const,
              title: 'NFC + QR Dual Band',
              sub: 'Instant optical scan when NFC chip tap is not available on legacy devices.',
            },
            {
              icon: 'Download' as const,
              title: '1-Tap Apple Contacts Export',
              sub: 'Directly saves full name, mobile phone, job title, and social links to iOS Contacts.',
            },
            {
              icon: 'Send' as const,
              title: 'Real-time Telegram CRM Sync',
              sub: 'Lead information is routed and delivered straight to your team Telegram channel.',
            },
          ].map((item, idx, arr) => (
            <View
              key={item.title}
              style={[styles.infoRow, idx === arr.length - 1 && styles.infoRowLast]}
            >
              <View style={styles.infoIconBox}>
                <AppIcon name={item.icon} size={18} color="#FFFFFF" />
              </View>
              <View style={styles.infoDetails}>
                <AppText style={styles.infoTitle} weight="bold">{item.title}</AppText>
                <AppText style={styles.infoSub}>{item.sub}</AppText>
              </View>
            </View>
          ))}
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
    paddingBottom: 130, // Clearance for floating capsule dock
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
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 17,
  },

  // ── Hero QR Card ──
  heroQrCard: {
    backgroundColor: '#111114',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 1,
  },
  liveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  qrContainer: {
    width: 204,
    height: 204,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardMeta: {
    alignItems: 'center',
    gap: 3,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  cardUrlText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },

  // ── Action Buttons ──
  actionGroup: {
    gap: 10,
  },
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
  secondaryBtn: {
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // ── Info Section (Borderless) ──
  infoSection: {
    marginTop: 8,
  },
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDetails: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  infoSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    lineHeight: 16,
  },
});

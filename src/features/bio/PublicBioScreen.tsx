/**
 * PublicBioScreen — Premium Dark NFC Public Profile Card
 * Redesigned to match high-end dark mobile profile card specification.
 * Fully responsive, WCAG high-contrast, zero purple/violet, preserved data flows.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { buildCardProfileUrl, buildSlugProfileUrl } from '@/src/constants/publicProfile';
import {
  recordTapEvent,
  resolvePublicProfileByCardId,
  resolvePublicProfileBySlug,
} from '@/src/services/nfcProfileService';
import { trackPublicBioTap, trackPublicBioView } from '@/src/services/firestoreService';
import type { BioPage } from '@/src/types/models';
import { HapticTap } from '@/src/utils/haptics';

interface Props {
  slug?: string;
  cardId?: string;
}

const DEFAULT_PUBLIC_TITLE = 'Digital Business Profile | AVIO NFC';
const DEFAULT_PUBLIC_DESCRIPTION =
  'Open a digital NFC business profile with contact links, social channels, and one-tap contact saving.';
const DEFAULT_PUBLIC_ORIGIN = 'https://sitehubman.vercel.app';

function compactMeta(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

// ─── Social Channel Configuration & Vibrant Accents ──────────────────────────
type SocialConfig = {
  key: string;
  platform: 'instagram' | 'tiktok' | 'spotify' | 'github' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'website';
  icon: React.ComponentProps<typeof AppIcon>['name'];
  bgColor: string;
  iconColor: string;
  url: (v: string) => string;
};

const SOCIALS: SocialConfig[] = [
  {
    key: 'instagram',
    platform: 'instagram',
    icon: 'Camera',
    bgColor: '#FF5252', // Coral / Orange Red
    iconColor: '#FFFFFF',
    url: (v) => `https://instagram.com/${v.replace('@', '')}`,
  },
  {
    key: 'tiktok',
    platform: 'tiktok',
    icon: 'Music',
    bgColor: '#25F4EE', // Bright Cyan / Teal
    iconColor: '#000000',
    url: (v) => `https://tiktok.com/@${v.replace('@', '')}`,
  },
  {
    key: 'spotify',
    platform: 'spotify',
    icon: 'Disc',
    bgColor: '#1DB954', // Emerald Green
    iconColor: '#FFFFFF',
    url: (v) => (v.startsWith('http') ? v : `https://open.spotify.com/user/${v}`),
  },
  {
    key: 'github',
    platform: 'github',
    icon: 'Github',
    bgColor: '#4A4A52', // Soft Slate Silver
    iconColor: '#FFFFFF',
    url: (v) => `https://github.com/${v.replace('@', '')}`,
  },
  {
    key: 'twitter',
    platform: 'twitter',
    icon: 'Twitter',
    bgColor: '#3F3F46', // Dark Silver / Slate
    iconColor: '#FFFFFF',
    url: (v) => `https://twitter.com/${v.replace('@', '')}`,
  },
  {
    key: 'linkedin',
    platform: 'linkedin',
    icon: 'Linkedin',
    bgColor: '#0A66C2', // Bright Sky Blue
    iconColor: '#FFFFFF',
    url: (v) => `https://linkedin.com/in/${v}`,
  },
  {
    key: 'whatsapp',
    platform: 'whatsapp',
    icon: 'Phone',
    bgColor: '#25D366', // WhatsApp Green
    iconColor: '#FFFFFF',
    url: (v) => `https://wa.me/${v.replace(/\D/g, '')}`,
  },
  {
    key: 'email',
    platform: 'email',
    icon: 'Mail',
    bgColor: '#FF5252',
    iconColor: '#FFFFFF',
    url: (v) => `mailto:${v}`,
  },
  {
    key: 'website',
    platform: 'website',
    icon: 'Globe',
    bgColor: '#3B82F6',
    iconColor: '#FFFFFF',
    url: (v) => (v.startsWith('http') ? v : `https://${v}`),
  },
];

export function PublicBioScreen({ slug, cardId }: Props) {
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [resolvedCardId, setResolvedCardId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load bio data
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const resolved = cardId
          ? await resolvePublicProfileByCardId(cardId)
          : slug
            ? await resolvePublicProfileBySlug(slug)
            : null;
        if (cancelled) return;
        if (resolved) {
          setBioPage(resolved.bioPage);
          setPublicUrl(resolved.publicUrl);
          setResolvedCardId(resolved.cardId);
        } else {
          // Direct local draft fallback for instant activation
          try {
            const { loadGuestCardDraft } = await import('@/src/services/guestDraftService');
            const draft = await loadGuestCardDraft();
            if (draft && draft.displayName) {
              const activeSlug = slug || cardId || 'mycard';
              setBioPage({
                id: activeSlug,
                userId: 'guest',
                slug: activeSlug,
                publicSlug: activeSlug,
                status: 'active',
                displayName: draft.displayName,
                tagline: draft.jobTitle ? `${draft.jobTitle}${draft.company ? ` · ${draft.company}` : ''}` : draft.company || 'Verified Member · AVIO',
                email: draft.email || undefined,
                whatsapp: draft.phone || undefined,
                telegram: draft.telegram || undefined,
                customLinks: [],
                theme: 'tech_noir',
                views: 1,
                taps: 0,
                updatedAt: new Date().toISOString(),
              });
              setPublicUrl(buildSlugProfileUrl(activeSlug));
              setResolvedCardId(cardId || slug);
            }
          } catch {
            // ignore
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, cardId]);

  // Track view + tap event
  useEffect(() => {
    if (!bioPage?.id) return;
    void trackPublicBioView(bioPage.id, resolvedCardId).catch(() => undefined);
    if (resolvedCardId) {
      void recordTapEvent({ profileId: bioPage.id, cardId: resolvedCardId, source: 'nfc_card' }).catch(
        () => undefined
      );
    } else if (slug) {
      void recordTapEvent({ profileId: bioPage.id, source: 'slug' }).catch(() => undefined);
    }
  }, [bioPage?.id, resolvedCardId, slug]);

  // Pulse animation for action feedback
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  function trackTap() {
    if (bioPage?.id) void trackPublicBioTap(bioPage.id, resolvedCardId).catch(() => undefined);
  }

  async function handleShare() {
    trackTap();
    HapticTap.light();
    const url =
      publicUrl ||
      (resolvedCardId
        ? buildCardProfileUrl(resolvedCardId)
        : buildSlugProfileUrl(bioPage?.publicSlug ?? bioPage?.slug ?? ''));
    await Share.share({ message: `${bioPage?.displayName ?? 'My profile'} — ${url}`, url });
  }

  async function handleSaveContact() {
    trackTap();
    HapticTap.medium();
    const url = publicUrl || '';
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${bioPage!.displayName}`,
      bioPage!.tagline ? `TITLE:${bioPage!.tagline}` : '',
      bioPage!.whatsapp ? `TEL;TYPE=CELL:${bioPage!.whatsapp}` : '',
      bioPage!.email ? `EMAIL:${bioPage!.email}` : '',
      url ? `URL:${url}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');
    await Share.share({ message: vcard, title: `${bioPage!.displayName} Contact` });
  }

  function handleTextAction() {
    trackTap();
    HapticTap.light();
    const phone = bioPage?.whatsapp ? bioPage.whatsapp.replace(/\D/g, '') : '';
    if (phone) {
      void Linking.openURL(`sms:${phone}`).catch(() => undefined);
    } else {
      void handleShare();
    }
  }

  function handleEmailAction() {
    trackTap();
    HapticTap.light();
    const email = bioPage?.email;
    if (email) {
      void Linking.openURL(`mailto:${email}`).catch(() => undefined);
    } else {
      void handleSaveContact();
    }
  }

  function handleCallAction() {
    trackTap();
    HapticTap.light();
    const phone = bioPage?.whatsapp ? bioPage.whatsapp.replace(/\D/g, '') : '';
    if (phone) {
      void Linking.openURL(`tel:${phone}`).catch(() => undefined);
    } else {
      void handleSaveContact();
    }
  }

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        {Platform.OS === 'web' ? (
          <Head>
            <title>{DEFAULT_PUBLIC_TITLE}</title>
            <meta name="description" content={DEFAULT_PUBLIC_DESCRIPTION} />
            <meta name="robots" content="noindex" />
            <meta name="theme-color" content="#0B0B0E" />
          </Head>
        ) : null}
        <AppIcon name="Nfc" size={42} color="#3B82F6" />
        <AppText style={styles.loadingText}>Loading profile…</AppText>
      </View>
    );
  }

  // ── Not Found Screen ────────────────────────────────────────────────────────
  if (!bioPage) {
    return (
      <SafeAreaView style={styles.notFoundSafe}>
        {Platform.OS === 'web' ? (
          <Head>
            <title>Profile not found | SiteHub</title>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="theme-color" content="#0B0B0E" />
          </Head>
        ) : null}
        <View style={styles.notFoundCenter}>
          <AppIcon name="User" size={48} color="rgba(255, 255, 255, 0.3)" />
          <AppText style={styles.notFoundTitle}>Profile not found</AppText>
          <AppText style={styles.notFoundSub}>This NFC profile link is not available yet.</AppText>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppText style={styles.backBtnT}>Go back</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Collect configured social links
  const socialLinks = SOCIALS.flatMap((s) => {
    const val = (bioPage as unknown as Record<string, unknown>)[s.key] as string | undefined;
    if (!val?.trim()) return [];
    return [{ ...s, value: val.trim() }];
  });

  const canonicalUrl =
    publicUrl ||
    (resolvedCardId
      ? buildCardProfileUrl(resolvedCardId)
      : buildSlugProfileUrl(bioPage.publicSlug ?? bioPage.slug ?? slug ?? ''));
  const metaTitle = compactMeta(`${bioPage.displayName} | SiteHub NFC`, 64);
  const metaDescription = compactMeta(
    bioPage.tagline
      ? `${bioPage.displayName} - ${bioPage.tagline}. Save contact details and connect through NFC.`
      : `Save ${bioPage.displayName}'s contact details and connect through NFC.`,
    155
  );
  const metaImage = bioPage.photoUrl || `${DEFAULT_PUBLIC_ORIGIN}/icon.png`;

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:image" content={metaImage} />
          <meta name="theme-color" content="#0B0B0E" />
        </Head>
      ) : null}

      {/* Subtle Background Glowing Network Dots */}
      <View style={styles.bgDecorations} pointerEvents="none">
        <View style={styles.glowDotTopLeft} />
        <View style={styles.glowDotBottomRight} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Navigation Bar */}
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => {
              HapticTap.light();
              if (router.canGoBack()) router.back();
              else router.push('/');
            }}
            style={styles.topBtn}
            hitSlop={10}
            accessibilityRole="button"
          >
            <AppIcon name="ChevronLeft" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.topRightGroup}>
            <Pressable onPress={() => setShowQrModal(true)} style={styles.topBtn} hitSlop={10}>
              <AppIcon name="QrCode" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => void handleShare()} style={styles.topBtn} hitSlop={10}>
              <AppIcon name="Share" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* ── PHONE CARD CONTAINER (Centered 360px Card Surface) ── */}
          <View style={styles.cardContainer}>
            
            {/* Top Status Bar Row */}
            <View style={styles.statusRow}>
              <AppText style={styles.timeText}>9:41</AppText>
              
              <View style={styles.statusCenter}>
                <AppIcon name="Radio" size={14} color="#9A9AA0" />
                <AppText style={styles.statusLabel}>TAPPED IN</AppText>
              </View>

              <View style={styles.liveBadge}>
                <AppText style={styles.liveBadgeText}>LIVE</AppText>
              </View>
            </View>

            {/* Avatar & Verification Badge */}
            <View style={styles.avatarWrap}>
              {bioPage.photoUrl ? (
                <Image source={{ uri: bioPage.photoUrl }} style={styles.avatarImg} />
              ) : (
                <LinearGradient
                  colors={['#FF7E36', '#FF3B30']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <AppText style={styles.avatarInitial}>
                    {(bioPage.displayName.trim()[0] ?? 'K').toUpperCase()}
                  </AppText>
                </LinearGradient>
              )}

              {/* Small Verification Badge */}
              <View style={styles.verifiedBadge}>
                <AppIcon name="Sparkles" size={14} color="#FF3B30" />
              </View>
            </View>

            {/* Name & Subtitle */}
            <View style={styles.headerInfo}>
              <AppText style={styles.nameText} weight="bold">
                {bioPage.displayName}
              </AppText>
              <AppText style={styles.subtitleText}>
                {bioPage.tagline
                  ? compactMeta(bioPage.tagline, 45)
                  : `${bioPage.role || 'Content Creator'} · ${bioPage.company || 'LA'}`}
              </AppText>
            </View>

            {/* 4 Colorful Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              {/* Save */}
              <View style={styles.actionItem}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionCircle,
                    { backgroundColor: '#C8F526' }, // Lime Green
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => void handleSaveContact()}
                  accessibilityRole="button"
                  accessibilityLabel="Save contact"
                >
                  <AppIcon name="UserPlus" size={22} color="#1C1C1F" />
                </Pressable>
                <AppText style={styles.actionLabel}>Save</AppText>
              </View>

              {/* Text */}
              <View style={styles.actionItem}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionCircle,
                    { backgroundColor: '#3B82F6' }, // Bright Electric Blue
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleTextAction}
                  accessibilityRole="button"
                  accessibilityLabel="Text contact"
                >
                  <AppIcon name="MessageSquare" size={22} color="#FFFFFF" />
                </Pressable>
                <AppText style={styles.actionLabel}>Text</AppText>
              </View>

              {/* Email */}
              <View style={styles.actionItem}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionCircle,
                    { backgroundColor: '#FF5252' }, // Coral / Red
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleEmailAction}
                  accessibilityRole="button"
                  accessibilityLabel="Email contact"
                >
                  <AppIcon name="Mail" size={22} color="#FFFFFF" />
                </Pressable>
                <AppText style={styles.actionLabel}>Email</AppText>
              </View>

              {/* Call */}
              <View style={styles.actionItem}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionCircle,
                    { backgroundColor: '#F59E0B' }, // Warm Amber / Gold
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleCallAction}
                  accessibilityRole="button"
                  accessibilityLabel="Call contact"
                >
                  <AppIcon name="Phone" size={22} color="#FFFFFF" />
                </Pressable>
                <AppText style={styles.actionLabel}>Call</AppText>
              </View>
            </View>

            {/* Dark Rounded Bio Panel Card */}
            <View style={styles.bioPanel}>
              <AppText style={styles.bioText}>
                {bioPage.tagline ||
                  'Making waves on the internet. Brand strategist by day, DJ by night.'}
              </AppText>

              <View style={styles.bioMetaRow}>
                <View style={styles.bioMetaItem}>
                  <AppIcon name="MapPin" size={13} color="#9A9AA0" />
                  <AppText style={styles.bioMetaText}>
                    {bioPage.company || 'Los Angeles'}
                  </AppText>
                </View>
                <AppText style={styles.bioMetaDot}>·</AppText>
                <View style={styles.bioMetaItem}>
                  <AppIcon name="Globe" size={13} color="#9A9AA0" />
                  <AppText style={styles.bioMetaText}>
                    {bioPage.website || 'kairivers.io'}
                  </AppText>
                </View>
              </View>
            </View>

            {/* "FOLLOWS" Heading & Social Icon Grid */}
            <View style={styles.followsSection}>
              <AppText style={styles.followsHeading}>FOLLOWS</AppText>

              <View style={styles.socialGrid}>
                {socialLinks.length > 0 ? (
                  socialLinks.map((s) => (
                    <Pressable
                      key={s.key}
                      style={({ pressed }) => [
                        styles.socialSquare,
                        { backgroundColor: s.bgColor },
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => {
                        trackTap();
                        HapticTap.light();
                        Linking.openURL(s.url(s.value)).catch(() => undefined);
                      }}
                      accessibilityRole="link"
                      accessibilityLabel={s.platform}
                    >
                      <AppIcon name={s.icon} size={24} color={s.iconColor} />
                    </Pressable>
                  ))
                ) : (
                  <>
                    <Pressable style={[styles.socialSquare, { backgroundColor: '#FF5252' }]}>
                      <AppIcon name="Camera" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Pressable style={[styles.socialSquare, { backgroundColor: '#25F4EE' }]}>
                      <AppIcon name="Music" size={24} color="#000000" />
                    </Pressable>
                    <Pressable style={[styles.socialSquare, { backgroundColor: '#1DB954' }]}>
                      <AppIcon name="Disc" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Pressable style={[styles.socialSquare, { backgroundColor: '#4A4A52' }]}>
                      <AppIcon name="Github" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Pressable style={[styles.socialSquare, { backgroundColor: '#3F3F46' }]}>
                      <AppIcon name="Twitter" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Pressable style={[styles.socialSquare, { backgroundColor: '#0A66C2' }]}>
                      <AppIcon name="Linkedin" size={24} color="#FFFFFF" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* Footer NFC Tag Indicator */}
            {resolvedCardId ? (
              <View style={styles.nfcHint}>
                <AppIcon name="Nfc" size={14} color="#9A9AA0" />
                <AppText style={styles.nfcHintText}>
                  Opened via NFC card · tap logged
                </AppText>
              </View>
            ) : null}

          </View>
          
          <AppText style={styles.footerBrand}>Powered by AVIO NFC</AppText>
        </IosScrollView>
      </SafeAreaView>

      {/* QR Code Full Screen Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeaderRow}>
              <AppText style={styles.qrModalTitle}>Scan Profile QR</AppText>
              <Pressable onPress={() => setShowQrModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              {canonicalUrl ? <QRCode value={canonicalUrl} size={220} /> : null}
            </View>
            <AppText style={styles.qrNameText}>{bioPage.displayName}</AppText>
            <AppText style={styles.qrSubText}>Scan with phone camera to open profile</AppText>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0E', // Almost-black textured canvas
  },
  bgDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowDotTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 126, 54, 0.08)', // Amber glow dot
  },
  glowDotBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.06)', // Blue accent glow
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
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    alignItems: 'center',
  },
  
  /* Centered 360px Phone Card Shell */
  cardContainer: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#131316', // Dark charcoal surface
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 16,
  },

  /* Status Bar Row */
  statusRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A9AA0',
    letterSpacing: 1.2,
  },
  liveBadge: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  /* Avatar & Verified Badge */
  avatarWrap: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  /* Header Info */
  headerInfo: {
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A9AA0',
    textAlign: 'center',
  },

  /* 4 Action Buttons Row */
  actionButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 4,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },

  /* Bio Panel Card */
  bioPanel: {
    width: '100%',
    backgroundColor: '#1E1E22',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 18,
    gap: 12,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  bioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bioMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bioMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A9AA0',
  },
  bioMetaDot: {
    fontSize: 14,
    color: '#9A9AA0',
  },

  /* Follows Heading & Grid */
  followsSection: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  followsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1.2,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialSquare: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Footer NFC Indicator */
  nfcHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  nfcHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9AA0',
  },
  footerBrand: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 16,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#131316',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  qrHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    width: 248,
    height: 248,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  qrSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },

  /* Loading & Not Found */
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#0B0B0E',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  notFoundSafe: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notFoundSub: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  backBtnT: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

/**
 * PublicBioScreen — X.com-inspired public NFC digital business card profile.
 *
 * Opened when someone taps an NFC card (/c/[cardId]) or visits a public link (/u/[slug]).
 *
 * Layout:
 *  1. Solid black canvas (#000000) with 640px responsive container constraint
 *  2. Full-bleed X.com cover banner with floating overlapping circular avatar (-42px top margin, 4px black border)
 *  3. Top-bar controls: Frosted glass back, QR Code modal trigger, Share profile button
 *  4. X.com profile header metadata:
 *     - Name with Verified Badge (#1D9BF0)
 *     - @slug handle in silver
 *     - Bio / Tagline text
 *     - Metadata row (Company/Role, Website, Joined date)
 *     - X-style stats row (142 Following · 1.8k Followers · Views & Taps counter)
 *  5. Primary CTA Action Row (Save Contact vCard white pill + Share button)
 *  6. X.com underlined navigation bar (Bio & Links | Contact Cards)
 *  7. High-contrast charcoal cards (#111114, 1px border rgba(255,255,255,0.08)) for social & custom links
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  Platform,
  Share,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { buildCardProfileUrl, buildSlugProfileUrl } from '@/src/constants/publicProfile';
import {
  recordTapEvent,
  resolvePublicProfileByCardId,
  resolvePublicProfileBySlug,
} from '@/src/services/nfcProfileService';
import { trackPublicBioTap, trackPublicBioView } from '@/src/services/firestoreService';
import { captureLead } from '@/src/services/leadService';
import type { BioPage } from '@/src/types/models';
import { getSocialAvatar } from '@/src/utils/socialMediaAvatars';
import { HapticTap } from '@/src/utils/haptics';

interface Props {
  slug?: string;
  cardId?: string;
}

const DEFAULT_PUBLIC_TITLE = 'Digital Business Profile | Snap Tap NFC';
const DEFAULT_PUBLIC_DESCRIPTION =
  'Open a digital NFC business profile with contact links, social channels, and one-tap contact saving.';
const DEFAULT_PUBLIC_ORIGIN = 'https://sitehubman.vercel.app';
const BANNER_H = 140;

const HEADER_GRADIENTS = [
  ['#1D9BF0', '#0044FF'],
  ['#8E54E9', '#4776E6'],
  ['#00B4DB', '#0083B0'],
  ['#FF512F', '#DD2476'],
] as const;

function getHeaderColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HEADER_GRADIENTS[Math.abs(hash) % HEADER_GRADIENTS.length];
}

function compactMeta(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

// ─── Social channel config ────────────────────────────────────────────────────
type SocialConfig = {
  key: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'whatsapp' | 'email' | 'website' | 'youtube' | 'tiktok' | 'spotify' | 'discord' | 'twitch' | 'github';
  icon: React.ComponentProps<typeof AppIcon>['name'];
  color: string;
  label: (v: string) => string;
  url: (v: string) => string;
};

const SOCIALS: SocialConfig[] = [
  {
    key: 'whatsapp',
    platform: 'whatsapp',
    icon: 'Phone',
    color: '#25D366',
    label: (v) => v,
    url: (v) => `https://wa.me/${v.replace(/\D/g, '')}`,
  },
  {
    key: 'telegram',
    platform: 'telegram',
    icon: 'Send',
    color: '#0088CC',
    label: (v) => v,
    url: (v) => `https://t.me/${v.replace('@', '')}`,
  },
  {
    key: 'instagram',
    platform: 'instagram',
    icon: 'Camera',
    color: '#E1306C',
    label: (v) => v,
    url: (v) => `https://instagram.com/${v.replace('@', '')}`,
  },
  {
    key: 'twitter',
    platform: 'twitter',
    icon: 'Twitter',
    color: '#1DA1F2',
    label: (v) => v,
    url: (v) => `https://twitter.com/${v.replace('@', '')}`,
  },
  {
    key: 'facebook',
    platform: 'facebook',
    icon: 'Facebook',
    color: '#1877F2',
    label: (v) => v,
    url: (v) => `https://facebook.com/${v}`,
  },
  {
    key: 'linkedin',
    platform: 'linkedin',
    icon: 'Linkedin',
    color: '#0A66C2',
    label: (v) => v,
    url: (v) => `https://linkedin.com/in/${v}`,
  },
  {
    key: 'email',
    platform: 'email',
    icon: 'Mail',
    color: '#3B82F6',
    label: (v) => v,
    url: (v) => `mailto:${v}`,
  },
  {
    key: 'website',
    platform: 'website',
    icon: 'Globe',
    color: '#8B5CF6',
    label: (v) => v,
    url: (v) => (v.startsWith('http') ? v : `https://${v}`),
  },
  {
    key: 'tiktok',
    platform: 'tiktok',
    icon: 'TikTok',
    color: '#000000',
    label: (v) => v,
    url: (v) => `https://tiktok.com/${v.startsWith('@') ? v : `@${v}`}`,
  },
  {
    key: 'youtube',
    platform: 'youtube',
    icon: 'Youtube',
    color: '#FF0000',
    label: (v) => v,
    url: (v) => `https://youtube.com/${v.startsWith('@') ? v : `@${v}`}`,
  },
  {
    key: 'spotify',
    platform: 'spotify',
    icon: 'Spotify',
    color: '#1DB954',
    label: (v) => v,
    url: (v) => (v.startsWith('http') ? v : `https://open.spotify.com/search/${encodeURIComponent(v)}`),
  },
  {
    key: 'discord',
    platform: 'discord',
    icon: 'Discord',
    color: '#5865F2',
    label: (v) => v,
    url: (v) => (v.startsWith('http') ? v : `https://discord.com/users/${encodeURIComponent(v)}`),
  },
  {
    key: 'twitch',
    platform: 'twitch',
    icon: 'Twitch',
    color: '#9146FF',
    label: (v) => v,
    url: (v) => `https://twitch.tv/${v}`,
  },
  {
    key: 'github',
    platform: 'github',
    icon: 'GitHub',
    color: '#ffffff',
    label: (v) => v,
    url: (v) => `https://github.com/${v.replace('@', '')}`,
  },
];

// ─── Link button ─────────────────────────────────────────────────────────────
function LinkButton({
  icon,
  label,
  url,
  avatarUrl,
  onTap,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  url: string;
  avatarUrl?: string | null;
  onTap?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const showAvatar = avatarUrl && !imageError;

  return (
    <Pressable
      style={({ pressed }) => [lb.btn, pressed && lb.pressed]}
      onPress={() => {
        onTap?.();
        Linking.openURL(url).catch(() => undefined);
      }}
      accessibilityRole="link"
    >
      {showAvatar ? (
        <Image
          source={{ uri: avatarUrl }}
          style={lb.avatar}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={lb.iconWrap}>
          <AppIcon name={icon} size={18} color="#FFFFFF" />
        </View>
      )}
      <View style={lb.copyWrap}>
        <AppText style={lb.label} weight="extrabold" numberOfLines={1}>
          {label}
        </AppText>
        <AppText style={lb.urlText} numberOfLines={1}>
          {url.replace(/^https?:\/\//, '')}
        </AppText>
      </View>
      <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.3)" />
    </Pressable>
  );
}

const lb = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  copyWrap: { flex: 1, minWidth: 0, gap: 2 },
  label: { fontSize: 14, color: '#FFFFFF' },
  urlText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export function PublicBioScreen({ slug, cardId }: Props) {
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [resolvedCardId, setResolvedCardId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'details'>('links');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Lead Capture State
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [leadSuccess, setLeadSuccess] = useState(false);

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
          if (resolved.bioPage.directModeEnabled && resolved.bioPage.directModeUrl) {
            // Instant Redirect
            try {
              trackPublicBioView(resolved.bioPage.id, resolved.cardId);
              if (Platform.OS === 'web') {
                window.location.href = resolved.bioPage.directModeUrl;
              } else {
                void Linking.openURL(resolved.bioPage.directModeUrl);
              }
              // Keep loading state indefinitely since we are leaving the page
              return;
            } catch (e) {
              console.warn('Direct mode redirect failed', e);
            }
          }
          
          setBioPage(resolved.bioPage);
          setPublicUrl(resolved.publicUrl);
          setResolvedCardId(resolved.cardId);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, cardId]);

  // Track view & tap
  useEffect(() => {
    if (!bioPage?.id) return;
    void trackPublicBioView(bioPage.id, resolvedCardId).catch(() => undefined);
    if (resolvedCardId) {
      void recordTapEvent({ profileId: bioPage.id, cardId: resolvedCardId, source: 'nfc_card' }).catch(() => undefined);
    } else if (slug) {
      void recordTapEvent({ profileId: bioPage.id, source: 'slug' }).catch(() => undefined);
    }
  }, [bioPage?.id, resolvedCardId, slug]);

  // Pulse animation for CTA
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
    const url = publicUrl || (resolvedCardId ? buildCardProfileUrl(resolvedCardId) : buildSlugProfileUrl(bioPage?.publicSlug ?? bioPage?.slug ?? ''));
    await Share.share({ message: `${bioPage?.displayName ?? 'My profile'} — ${url}`, url });
  }

  async function handleSaveContact() {
    trackTap();
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
    ].filter(Boolean).join('\n');
    await Share.share({ message: vcard, title: `${bioPage!.displayName} Contact` });
  }

  async function handleLeadSubmit() {
    if (!bioPage?.id || !bioPage?.userId) return;
    if (!leadForm.name.trim()) return;
    
    setIsSubmittingLead(true);
    trackTap();
    try {
      await captureLead({
        profileId: bioPage.id,
        ownerUserId: bioPage.userId,
        name: leadForm.name.trim(),
        email: leadForm.email.trim(),
        phone: leadForm.phone.trim(),
        note: leadForm.note.trim(),
      });
      setLeadSuccess(true);
      setTimeout(() => {
        setShowLeadModal(false);
        setLeadSuccess(false);
        setLeadForm({ name: '', email: '', phone: '', note: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingLead(false);
    }
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        {Platform.OS === 'web' ? (
          <Head>
            <title>{DEFAULT_PUBLIC_TITLE}</title>
            <meta name="description" content={DEFAULT_PUBLIC_DESCRIPTION} />
            <meta name="robots" content="noindex" />
            <meta name="theme-color" content="#000000" />
          </Head>
        ) : null}
        <AppIcon name="Nfc" size={40} color="#1D9BF0" />
        <AppText style={styles.loadingText}>Loading profile…</AppText>
      </View>
    );
  }

  // ── Not Found ──
  if (!bioPage) {
    return (
      <SafeAreaView style={styles.notFoundSafe}>
        {Platform.OS === 'web' ? (
          <Head>
            <title>Profile not found | SiteHub Man</title>
            <meta name="description" content="This NFC profile link is not available or has not been set up yet." />
            <meta name="robots" content="noindex, nofollow" />
            <meta name="theme-color" content="#000000" />
          </Head>
        ) : null}
        <View style={styles.notFoundCenter}>
          <AppIcon name="UserRound" size={48} color="rgba(255, 255, 255, 0.3)" />
          <AppText style={styles.notFoundTitle}>Profile not found</AppText>
          <AppText style={styles.notFoundSub}>This card or profile link has not been published yet.</AppText>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppText style={styles.backBtnT}>Go back</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const gradColors = getHeaderColors(bioPage.displayName);
  const socialLinks = SOCIALS.flatMap((s) => {
    const val = (bioPage as unknown as Record<string, unknown>)[s.key] as string | undefined;
    if (!val?.trim()) return [];
    const avatarUrl = getSocialAvatar(s.platform, val.trim());
    return [{ ...s, value: val.trim(), avatarUrl }];
  });
  const customLinks = bioPage.customLinks ?? [];
  const canonicalUrl =
    publicUrl ||
    (resolvedCardId
      ? buildCardProfileUrl(resolvedCardId)
      : buildSlugProfileUrl(bioPage.publicSlug ?? bioPage.slug ?? slug ?? ''));
  const metaTitle = compactMeta(`${bioPage.displayName} | Snap Tap NFC`, 64);
  const metaDescription = compactMeta(
    bioPage.tagline
      ? `${bioPage.displayName} - ${bioPage.tagline}. Save contact details and connect through this NFC profile.`
      : `Save ${bioPage.displayName}'s contact details and connect through this NFC profile.`,
    155
  );
  const metaImage = bioPage.photoUrl || `${DEFAULT_PUBLIC_ORIGIN}/icon.png`;
  const initial = (bioPage.displayName[0] || 'C').toUpperCase();
  const profileSlug = bioPage.publicSlug ?? bioPage.slug ?? slug ?? 'creator';

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <meta name="author" content={bioPage.displayName} />
          <link rel="canonical" href={canonicalUrl} />

          {/* Open Graph */}
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:image" content={metaImage} />
          <meta property="og:site_name" content="SiteHub Man" />

          {/* Twitter / X Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@sitehubman" />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={metaImage} />
          <meta name="theme-color" content="#000000" />
        </Head>
      ) : null}

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          {/* ── 1. X.com Cover Header Banner ── */}
          <View style={styles.bannerWrap}>
            <LinearGradient
              colors={[gradColors[0], gradColors[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            />

            <SafeAreaView style={styles.bannerTopBar} edges={['top']}>
              <Pressable
                style={styles.iconCircleBtn}
                onPress={() => {
                  HapticTap.light();
                  if (router.canGoBack()) router.back();
                  else router.push('/');
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
              </Pressable>

              <View style={styles.bannerRightBtns}>
                <Pressable
                  style={styles.iconCircleBtn}
                  onPress={() => setShowQrModal(true)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Show QR code"
                >
                  <AppIcon name="QrCode" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.iconCircleBtn}
                  onPress={() => void handleShare()}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Share profile"
                >
                  <AppIcon name="Share" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>

          {/* ── 2. Floating Avatar & Action Row ── */}
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarContainer}>
              {bioPage.photoUrl ? (
                <Image source={{ uri: bioPage.photoUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={[gradColors[0], gradColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarImg}
                >
                  <AppText style={styles.avatarInitial} weight="extrabold">{initial}</AppText>
                </LinearGradient>
              )}
            </View>

            <View style={styles.actionPillRow}>
              <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
                <Pressable
                  style={({ pressed }) => [styles.saveContactBtn, pressed && styles.pressed]}
                  onPress={() => void handleSaveContact()}
                  accessibilityRole="button"
                  accessibilityLabel="Save contact details"
                >
                  <AppIcon name="UserPlus" size={15} color="#000000" />
                  <AppText style={styles.saveContactText} weight="extrabold">Save Contact</AppText>
                </Pressable>
              </Animated.View>

              <Pressable
                style={({ pressed }) => [styles.connectBtn, pressed && styles.pressed]}
                onPress={() => { HapticTap.light(); setShowLeadModal(true); }}
                accessibilityRole="button"
                accessibilityLabel="Share your info back"
              >
                <AppText style={styles.connectText} weight="extrabold">Connect</AppText>
              </Pressable>
            </View>
          </View>

          {/* ── 3. X.com Profile Info Metadata ── */}
          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <AppText style={styles.displayNameText} weight="extrabold" numberOfLines={1}>
                {bioPage.displayName}
              </AppText>
            </View>

            <AppText style={styles.handleText}>@{profileSlug}</AppText>

            {bioPage.tagline ? (
              <AppText style={styles.taglineText}>
                {bioPage.tagline}
              </AppText>
            ) : null}

            {/* X Metadata Row */}
            <View style={styles.metaRow}>
              {bioPage.company ? (
                <View style={styles.metaItem}>
                  <AppIcon name="Briefcase" size={13} color="rgba(255,255,255,0.45)" />
                  <AppText style={styles.metaText}>
                    {bioPage.company}{bioPage.role ? ` · ${bioPage.role}` : ''}
                  </AppText>
                </View>
              ) : null}
              {bioPage.email ? (
                <View style={styles.metaItem}>
                  <AppIcon name="Mail" size={13} color="rgba(255,255,255,0.45)" />
                  <AppText style={styles.metaText}>{bioPage.email}</AppText>
                </View>
              ) : null}
              {canonicalUrl ? (
                <View style={styles.metaItem}>
                  <AppIcon name="Link" size={13} color="#1D9BF0" />
                  <AppText style={[styles.metaText, styles.metaLink]} numberOfLines={1}>
                    snap.tap/{profileSlug}
                  </AppText>
                </View>
              ) : null}
            </View>

            {/* Stats Row (X Followers / Following style) */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">142</AppText>
                <AppText style={styles.statLabel}>Following</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">1.8k</AppText>
                <AppText style={styles.statLabel}>Followers</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">{bioPage.views ?? 0}</AppText>
                <AppText style={styles.statLabel}>Views</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statNum} weight="extrabold">{bioPage.taps ?? 0}</AppText>
                <AppText style={styles.statLabel}>NFC Taps</AppText>
              </View>
            </View>
          </View>

          {/* ── 4. X.com Underlined Tab Navigation ── */}
          <View style={styles.navTabContainer}>
            {[
              { key: 'links', label: 'Bio & Links' },
              { key: 'details', label: 'NFC Details' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.navTabItem}
                  onPress={() => { HapticTap.light(); setActiveTab(tab.key as any); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <AppText
                    style={[styles.navTabText, isActive && styles.navTabTextActive]}
                    weight={isActive ? 'extrabold' : 'regular'}
                  >
                    {tab.label}
                  </AppText>
                  {isActive && <View style={styles.navActiveIndicator} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── 5. Tab Content ── */}
          {activeTab === 'links' && (
            <View style={styles.tabBody}>
              {/* Quick Communication Chips */}
              <View style={styles.quickChipsRow}>
                <Pressable
                  style={styles.chipBtn}
                  onPress={() => {
                    const email = bioPage.email || '';
                    if (email) Linking.openURL(`mailto:${email}`).catch(() => undefined);
                    else void handleSaveContact();
                  }}
                >
                  <AppIcon name="Mail" size={14} color="#1D9BF0" />
                  <AppText style={styles.chipText} weight="extrabold">Send Email</AppText>
                </Pressable>
                <Pressable
                  style={styles.chipBtn}
                  onPress={() => {
                    const phone = bioPage.whatsapp ? bioPage.whatsapp.replace(/\D/g, '') : '';
                    if (phone) Linking.openURL(`https://wa.me/${phone}`).catch(() => undefined);
                    else void handleShare();
                  }}
                >
                  <AppIcon name="Send" size={14} color="#25D366" />
                  <AppText style={styles.chipText} weight="extrabold">WhatsApp</AppText>
                </Pressable>
              </View>

              {/* Social Links List */}
              {socialLinks.length > 0 ? (
                <View style={styles.linkList}>
                  {socialLinks.map((s) => (
                    <LinkButton
                      key={s.key}
                      icon={s.icon}
                      label={s.label(s.value)}
                      url={s.url(s.value)}
                      avatarUrl={s.avatarUrl}
                      onTap={trackTap}
                    />
                  ))}
                </View>
              ) : null}

              {/* Custom Links */}
              {customLinks.length > 0 ? (
                <View style={styles.linkList}>
                  {customLinks.map((link) => (
                    <LinkButton
                      key={link.label + link.url}
                      icon="Link"
                      label={link.label}
                      url={link.url}
                      onTap={trackTap}
                    />
                  ))}
                </View>
              ) : null}

              {/* AR Profile Block (Phase 4) */}
              <View style={styles.storeSection}>
                <AppText style={styles.storeSectionTitle}>AR Experience</AppText>
                <Pressable
                  style={({ pressed }) => [styles.storeProductCard, pressed && styles.pressed]}
                  onPress={() => {
                    HapticTap.medium();
                    Alert.alert('AR Quick Look', 'This will launch a .usdz or .reality file in your native AR viewer. (Requires hosted 3D asset)');
                  }}
                  accessibilityRole="button"
                >
                  <View style={[styles.storeProductIcon, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
                    <AppIcon name="ScanLine" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.storeProductInfo}>
                    <AppText style={styles.storeProductName}>View in AR</AppText>
                    <AppText style={styles.storeProductDesc}>See my digital twin in your space.</AppText>
                  </View>
                  <View style={[styles.storeProductPriceBadge, { backgroundColor: '#007AFF' }]}>
                    <AppText style={[styles.storeProductPriceText, { color: '#FFFFFF' }]}>Launch</AppText>
                  </View>
                </Pressable>
              </View>

              {/* Bio-Store Block (Phase 3) */}
              <View style={styles.storeSection}>
                <AppText style={styles.storeSectionTitle}>Store</AppText>
                <Pressable
                  style={({ pressed }) => [styles.storeProductCard, pressed && styles.pressed]}
                  onPress={() => {
                    HapticTap.medium();
                    Linking.openURL('https://checkout.stripe.com/pay/mock').catch(() => undefined);
                  }}
                  accessibilityRole="button"
                >
                  <View style={styles.storeProductIcon}>
                    <AppIcon name="ShoppingBag" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.storeProductInfo}>
                    <AppText style={styles.storeProductName}>1:1 Consulting Call</AppText>
                    <AppText style={styles.storeProductDesc}>Book a 30-min strategy session.</AppText>
                  </View>
                  <View style={styles.storeProductPriceBadge}>
                    <AppText style={styles.storeProductPriceText}>$150</AppText>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {activeTab === 'details' && (
            <View style={styles.tabBody}>
              <View style={styles.verifiedCard}>
                <View style={styles.verifiedHeader}>
                  <AppIcon name="ShieldCheck" size={18} color="#1D9BF0" />
                  <AppText style={styles.verifiedTitle} weight="extrabold">Verified NFC Digital Profile</AppText>
                </View>
                <AppText style={styles.verifiedSub}>
                  This business profile is registered on the SiteHubMan NFC network and verified for one-tap contact exchange.
                </AppText>
              </View>

              {resolvedCardId ? (
                <View style={styles.nfcInfoCard}>
                  <AppIcon name="Nfc" size={16} color="rgba(255,255,255,0.7)" />
                  <AppText style={styles.nfcInfoText}>
                    Tapped via NFC Card · ID: {resolvedCardId}
                  </AppText>
                </View>
              ) : null}
            </View>
          )}

          {/* Footer */}
          <AppText style={styles.footerBrand}>Powered by SiteHubMan NFC OS</AppText>

          <View style={{ height: 100 }} />
        </View>
      </IosScrollView>

      {/* High-Contrast QR Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeaderRow}>
              <AppText style={styles.qrModalTitle} weight="extrabold">Scan Profile QR</AppText>
              <Pressable onPress={() => setShowQrModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              {canonicalUrl ? <QRCode value={canonicalUrl} size={210} /> : null}
            </View>
            <AppText style={styles.qrNameText} weight="extrabold">{bioPage.displayName}</AppText>
            <AppText style={styles.qrSubText}>Scan with phone camera to open profile</AppText>
          </View>
        </View>
      </Modal>

      {/* High-Contrast Lead Capture Modal */}
      <Modal visible={showLeadModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.leadModalCard}>
            <View style={styles.qrHeaderRow}>
              <AppText style={styles.qrModalTitle} weight="extrabold">Share Your Info</AppText>
              <Pressable onPress={() => setShowLeadModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            
            {leadSuccess ? (
              <View style={styles.leadSuccessWrap}>
                <AppIcon name="CircleCheck" size={48} color="#25D366" />
                <AppText style={styles.leadSuccessText} weight="bold">Info Sent!</AppText>
              </View>
            ) : (
              <View style={styles.leadFormWrap}>
                <AppText style={styles.leadFormSub}>
                  Share your details with {bioPage.displayName} so they can stay in touch.
                </AppText>
                
                <TextInput
                  style={styles.leadInput}
                  placeholder="Full Name *"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={leadForm.name}
                  onChangeText={(t) => setLeadForm(p => ({ ...p, name: t }))}
                />
                <TextInput
                  style={styles.leadInput}
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={leadForm.email}
                  onChangeText={(t) => setLeadForm(p => ({ ...p, email: t }))}
                />
                <TextInput
                  style={styles.leadInput}
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                  value={leadForm.phone}
                  onChangeText={(t) => setLeadForm(p => ({ ...p, phone: t }))}
                />
                <TextInput
                  style={[styles.leadInput, styles.leadInputTall]}
                  placeholder="Note (Optional)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  value={leadForm.note}
                  onChangeText={(t) => setLeadForm(p => ({ ...p, note: t }))}
                />
                
                <Pressable
                  style={({ pressed }) => [styles.leadSubmitBtn, pressed && styles.pressed, !leadForm.name.trim() && styles.leadSubmitBtnDisabled]}
                  onPress={handleLeadSubmit}
                  disabled={!leadForm.name.trim() || isSubmittingLead}
                >
                  {isSubmittingLead ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <AppText style={styles.leadSubmitText} weight="extrabold">Send Info</AppText>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: '#000000',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#000000',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  notFoundSafe: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
  },
  qrSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  storeSection: {
    marginTop: 20,
    gap: 12,
  },
  storeSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  storeProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 16,
  },
  storeProductIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeProductInfo: {
    flex: 1,
    gap: 4,
  },
  storeProductName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storeProductDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  storeProductPriceBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  storeProductPriceText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  
  // ── Lead Capture Modal ──
  leadModalCard: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    width: '100%',
    maxWidth: 640,
    padding: 24,
    paddingBottom: 40,
  },
  leadFormWrap: {
    gap: 12,
    marginTop: 16,
  },
  leadFormSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  leadInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: '#FFFFFF',
    fontSize: 15,
  },
  leadInputTall: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  leadSubmitBtn: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  leadSubmitBtnDisabled: {
    opacity: 0.5,
  },
  leadSubmitText: {
    color: '#000000',
    fontSize: 16,
  },
  leadSuccessWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  leadSuccessText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  notFoundSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  backBtnT: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // ── Cover Banner ──
  bannerWrap: {
    width: '100%',
    height: BANNER_H,
    position: 'relative',
    backgroundColor: '#111114',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRightBtns: {
    flexDirection: 'row',
    gap: 8,
  },

  // ── Floating Avatar & Actions ──
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -42,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#111114',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  actionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  saveContactText: {
    color: '#000000',
    fontSize: 14,
  },
  connectBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // ── Profile Metadata ──
  infoSection: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayNameText: {
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    justifyContent: 'center',
  },
  handleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -4,
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginTop: 4,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  metaLink: {
    color: '#1D9BF0',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 8,
    paddingTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statNum: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },

  // ── Nav Tab Bar ──
  navTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  navTabItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navTabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  navActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  // ── Tab Body ──
  tabBody: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  chipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  linkList: {
    gap: 10,
  },

  // ── Verified Card ──
  verifiedCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 8,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  verifiedSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },
  nfcInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nfcInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  // ── Footer ──
  footerBrand: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 20,
  },

  // ── Modal ──
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
    backgroundColor: '#111114',
    borderRadius: 24,
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
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    width: 236,
    height: 236,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrNameText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

/**
 * PublicBioScreen — public NFC profile.
 * Opened when someone taps an NFC card (/c/[cardId]) or scans a QR (/p/[slug]).
 * Tracks every view and tap automatically.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  Platform,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { buildCardProfileUrl, buildSlugProfileUrl } from '@/src/constants/publicProfile';
import {
  recordTapEvent,
  resolvePublicProfileByCardId,
  resolvePublicProfileBySlug,
} from '@/src/services/nfcProfileService';
import { trackPublicBioTap, trackPublicBioView } from '@/src/services/firestoreService';
import type { BioPage } from '@/src/types/models';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getSocialAvatar } from '@/src/utils/socialMediaAvatars';

interface Props {
  slug?: string;
  cardId?: string;
}

const DEFAULT_PUBLIC_TITLE = 'Digital Business Profile | Snap Tap NFC';
const DEFAULT_PUBLIC_DESCRIPTION =
  'Open a digital NFC business profile with contact links, social channels, and one-tap contact saving.';
const DEFAULT_PUBLIC_ORIGIN = 'https://sitehubman.vercel.app';

function compactMeta(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

// ─── Social channel config ────────────────────────────────────────────────────
type SocialConfig = {
  key: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'whatsapp' | 'email' | 'website';
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
    url: (v) => v.startsWith('http') ? v : `https://${v}`,
  },
];

// ─── Link button with real avatar ────────────────────────────────────────────
function LinkButton({
  icon,
  label,
  color,
  url,
  avatarUrl,
  onTap,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  color: string;
  url: string;
  avatarUrl?: string | null;
  onTap?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const showAvatar = avatarUrl && !imageError;

  return (
    <Pressable
      style={({ pressed }) => [lb.btn, pressed && lb.pressed]}
      onPress={() => { onTap?.(); Linking.openURL(url).catch(() => undefined); }}
      accessibilityRole="link"
    >
      {showAvatar ? (
        <Image
          source={{ uri: avatarUrl }}
          style={lb.avatar}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[lb.icon, { backgroundColor: color }]}>
          <AppIcon name={icon} size={18} color="#FFFFFF" />
        </View>
      )}
      <AppText style={lb.label} numberOfLines={1}>{label}</AppText>
      <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.4)" />
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
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
function ProfileAvatar({
  name,
  photoUrl,
  accent,
  size = 96,
}: {
  name: string;
  photoUrl?: string | null;
  accent: string;
  size?: number;
}) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[pa.img, { width: size, height: size, borderRadius: size / 2, borderColor: accent }]}
      />
    );
  }
  return (
    <View style={[pa.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#1A1A1E', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
      <AppText style={[pa.initial, { fontSize: size * 0.38 }]}>{initial}</AppText>
    </View>
  );
}

const pa = StyleSheet.create({
  img: { borderWidth: 3 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '900', color: '#FFFFFF' },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export function PublicBioScreen({ slug, cardId }: Props) {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [resolvedCardId, setResolvedCardId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
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
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, cardId]);

  // Track view + tap event
  useEffect(() => {
    if (!bioPage?.id) return;
    void trackPublicBioView(bioPage.id, resolvedCardId).catch(() => undefined);
    if (resolvedCardId) {
      void recordTapEvent({ profileId: bioPage.id, cardId: resolvedCardId, source: 'nfc_card' }).catch(() => undefined);
    } else if (slug) {
      void recordTapEvent({ profileId: bioPage.id, source: 'slug' }).catch(() => undefined);
    }
  }, [bioPage?.id, resolvedCardId, slug]);

  // CTA pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
    if (isGuest) {
      requireAccount(undefined, { message: 'Sign in to save contacts.' });
      return;
    }
    trackTap();
    const url = publicUrl || '';
    const vcard = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `FN:${bioPage!.displayName}`,
      bioPage!.tagline ? `TITLE:${bioPage!.tagline}` : '',
      bioPage!.whatsapp ? `TEL;TYPE=CELL:${bioPage!.whatsapp}` : '',
      bioPage!.email ? `EMAIL:${bioPage!.email}` : '',
      url ? `URL:${url}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\n');
    await Share.share({ message: vcard, title: `${bioPage!.displayName} Contact` });
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        {Platform.OS === 'web' ? (
          <Head>
            <title>{DEFAULT_PUBLIC_TITLE}</title>
            <meta name="description" content={DEFAULT_PUBLIC_DESCRIPTION} />
          </Head>
        ) : null}
        <AppIcon name="Nfc" size={40} color="#0071E3" />
        <AppText style={styles.loadingText}>Loading profile…</AppText>
      </View>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!bioPage) {
    return (
      <SafeAreaView style={styles.notFoundSafe}>
        {Platform.OS === 'web' ? (
          <Head>
            <title>Profile not found | Snap Tap NFC</title>
            <meta name="description" content="This NFC profile is not available or has not been set up yet." />
            <meta name="robots" content="noindex" />
          </Head>
        ) : null}
        <View style={styles.notFoundCenter}>
          <AppIcon name="User" size={48} color="rgba(255, 255, 255, 0.3)" />
          <AppText style={styles.notFoundTitle}>Profile not found</AppText>
          <AppText style={styles.notFoundSub}>This card has not been set up yet.</AppText>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppText style={styles.backBtnT}>Go back</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Accent color from theme ────────────────────────────────────────────────
  const accent = '#0071E3';
  // Collect social links with real avatars
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
      ? `${bioPage.displayName} - ${bioPage.tagline}. Save contact details and connect through this NFC business profile.`
      : `Save ${bioPage.displayName}'s contact details and connect through this NFC business profile.`,
    155
  );
  const metaImage = bioPage.photoUrl || `${DEFAULT_PUBLIC_ORIGIN}/icon.png`;
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: bioPage.displayName,
    description: bioPage.tagline || metaDescription,
    image: bioPage.photoUrl || undefined,
    url: canonicalUrl,
    email: bioPage.email || undefined,
    telephone: bioPage.whatsapp || undefined,
    sameAs: [...socialLinks.map((s) => s.url(s.value)), ...customLinks.map((link) => link.url)],
  };

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:image" content={metaImage} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={metaImage} />
          <script type="application/ld+json">{JSON.stringify(profileJsonLd)}</script>
        </Head>
      ) : null}
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : undefined} style={styles.topBtn} hitSlop={10}>
            <AppIcon name="ChevronLeft" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => void handleShare()} style={styles.topBtn} hitSlop={10}>
            <AppIcon name="Share" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.heroCard}>
            <View style={styles.avatarRing}>
              <ProfileAvatar name={bioPage.displayName} photoUrl={bioPage.photoUrl} accent="#0071E3" size={96} />
            </View>
            <AppText style={styles.name}>{bioPage.displayName}</AppText>
            {bioPage.tagline ? (
              <AppText style={styles.tagline}>{bioPage.tagline}</AppText>
            ) : null}

            {/* Stat pills */}
            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <AppIcon name="Eye" size={12} color="#FFFFFF" />
                <AppText style={[styles.statT, { color: '#FFFFFF' }]}>{bioPage.views ?? 0} views</AppText>
              </View>
              <View style={styles.statPill}>
                <AppIcon name="Nfc" size={12} color="#FFFFFF" />
                <AppText style={[styles.statT, { color: '#FFFFFF' }]}>{bioPage.taps ?? 0} taps</AppText>
              </View>
            </View>
          </View>

          {/* ── Primary CTA — B&W High-Contrast ── */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPress={() => void handleSaveContact()}
              style={styles.ctaBtn}
              accessibilityRole="button"
            >
              <AppIcon name="UserPlus" size={20} color="#000000" />
              <AppText style={styles.ctaBtnT}>
                {isGuest ? 'Add to Contacts' : 'Save Contact'}
              </AppText>
            </Pressable>
          </Animated.View>

          {/* ── Social links ── */}
          {socialLinks.length > 0 ? (
            <View style={styles.section}>
              {socialLinks.map((s) => (
                <LinkButton
                  key={s.key}
                  icon={s.icon}
                  color={s.color}
                  label={s.label(s.value)}
                  url={s.url(s.value)}
                  avatarUrl={s.avatarUrl}
                  onTap={trackTap}
                />
              ))}
            </View>
          ) : null}

          {/* ── Custom links ── */}
          {customLinks.length > 0 ? (
            <View style={styles.section}>
              {customLinks.map((link) => (
                <LinkButton
                  key={link.url}
                  icon="Link"
                  color={accent}
                  label={link.label}
                  url={link.url}
                  onTap={trackTap}
                />
              ))}
            </View>
          ) : null}

          {/* ── NFC how-it-works hint (only when opened from NFC card) ── */}
          {resolvedCardId ? (
            <View style={styles.nfcHint}>
              <AppIcon name="Nfc" size={16} color="rgba(255, 255, 255, 0.7)" />
              <AppText style={styles.nfcHintT}>
                Opened via NFC card · tap saved automatically
              </AppText>
            </View>
          ) : null}

          {/* ── Footer ── */}
          <AppText style={styles.footer}>Powered by SiteHub NFC</AppText>

        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 80,
    gap: 14,
    alignItems: 'stretch',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  // Loading
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#000000' },
  loadingText: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },

  // Not found
  notFoundSafe: { flex: 1, backgroundColor: '#000000' },
  notFoundCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  notFoundTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  notFoundSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' },
  backBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#111114', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12 },
  backBtnT: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111114', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroCard: {
    alignItems: 'center',
    gap: 9,
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarRing: { borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 54, padding: 3 },
  name: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, textAlign: 'center' },
  tagline: { fontSize: 14, fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  statT: { fontSize: 11, fontWeight: '700' },

  // CTA - Solid White B&W style
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  ctaBtnT: { fontSize: 16, fontWeight: '800', color: '#000000', letterSpacing: -0.2 },

  // Sections
  section: { gap: 10 },

  // NFC hint
  nfcHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  nfcHintT: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },

  // Footer
  footer: { fontSize: 11, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', marginTop: 8 },
});

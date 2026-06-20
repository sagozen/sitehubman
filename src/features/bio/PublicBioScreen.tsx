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
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
      <AppIcon name="ChevronRight" size={16} color="#C4CFDE" />
    </Pressable>
  );
}

const lb = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
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
    <View style={[pa.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: accent }]}>
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
        <AppIcon name="Nfc" size={40} color="#2596BE" />
        <AppText style={styles.loadingText}>Loading profile…</AppText>
      </View>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!bioPage) {
    return (
      <SafeAreaView style={styles.notFoundSafe}>
        <View style={styles.notFoundCenter}>
          <AppIcon name="User" size={48} color="#D1D5DB" />
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
  const accent = '#007AFF';
  // Collect social links with real avatars
  const socialLinks = SOCIALS.flatMap((s) => {
    const val = (bioPage as unknown as Record<string, unknown>)[s.key] as string | undefined;
    if (!val?.trim()) return [];
    const avatarUrl = getSocialAvatar(s.platform, val.trim());
    return [{ ...s, value: val.trim(), avatarUrl }];
  });
  const customLinks = bioPage.customLinks ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : undefined} style={styles.topBtn} hitSlop={10}>
            <AppIcon name="ChevronLeft" size={22} color="#1C1C1E" />
          </Pressable>
          <Pressable onPress={() => void handleShare()} style={styles.topBtn} hitSlop={10}>
            <AppIcon name="Share" size={20} color={accent} />
          </Pressable>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.heroCard}>
            <View style={[styles.avatarRing, { borderColor: `${accent}40` }]}>
              <ProfileAvatar name={bioPage.displayName} photoUrl={bioPage.photoUrl} accent={accent} size={96} />
            </View>
            <AppText style={styles.name}>{bioPage.displayName}</AppText>
            {bioPage.tagline ? (
              <AppText style={styles.tagline}>{bioPage.tagline}</AppText>
            ) : null}

            {/* Stat pills */}
            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <AppIcon name="Eye" size={12} color={accent} />
                <AppText style={[styles.statT, { color: accent }]}>{bioPage.views ?? 0} views</AppText>
              </View>
              <View style={styles.statPill}>
                <AppIcon name="Nfc" size={12} color="#7C3AED" />
                <AppText style={[styles.statT, { color: '#7C3AED' }]}>{bioPage.taps ?? 0} taps</AppText>
              </View>
            </View>
          </View>

          {/* ── Primary CTA ── */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPress={() => void handleSaveContact()}
              style={[styles.ctaBtn, { backgroundColor: accent, shadowColor: accent }]}
              accessibilityRole="button"
            >
              <AppIcon name="UserPlus" size={20} color="#FFFFFF" />
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
              <AppIcon name="Nfc" size={16} color={accent} />
              <AppText style={[styles.nfcHintT, { color: accent }]}>
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
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 80, gap: 14, alignItems: 'stretch' },

  // Loading
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#F2F2F7' },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },

  // Not found
  notFoundSafe: { flex: 1, backgroundColor: '#F2F2F7' },
  notFoundCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  notFoundTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  notFoundSub: { fontSize: 14, fontWeight: '500', color: '#8E8E93', textAlign: 'center' },
  backBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2596BE', borderRadius: 12 },
  backBtnT: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },

  // Hero
  heroCard: {
    alignItems: 'center',
    gap: 9,
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  avatarRing: { borderWidth: 3, borderRadius: 54, padding: 3 },
  name: { fontSize: 30, fontWeight: '900', color: '#000000', letterSpacing: 0, textAlign: 'center' },
  tagline: { fontSize: 14, fontWeight: '500', color: '#8E8E93', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#F2F2F7' },
  statT: { fontSize: 11, fontWeight: '700' },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 2,
  },
  ctaBtnT: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },

  // Sections
  section: { gap: 10 },

  // NFC hint
  nfcHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  nfcHintT: { fontSize: 12, fontWeight: '600' },

  // Footer
  footer: { fontSize: 11, color: 'rgba(0,0,0,0.25)', textAlign: 'center', marginTop: 8 },
});

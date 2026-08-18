/**
 * PublicBioScreen — Ultra-Luxury Apple Wallet × Nothing Executive Public Bio.
 *
 * Design Architecture:
 *  - Solid pure black canvas (#000000)
 *  - Full-bleed executive profile (No fake 9:41 status bars)
 *  - Polished Monogram / Photo Avatar Seal with verified crest
 *  - Primary Action: [ ↗ Save to Contacts (vCard) ]
 *  - Minimalist dark connect actions (Telegram, Email, Call, WhatsApp, LinkedIn)
 *  - Executive bio panel & bespoke custom link tree
 *  - 120fps hardware accelerated animations
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import QRCode from 'react-native-qrcode-svg';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { buildCardProfileUrl, buildSlugProfileUrl } from '@/src/constants/publicProfile';
import {
  recordTapEvent,
  resolvePublicProfileByCardId,
  resolvePublicProfileBySlug,
} from '@/src/services/nfcProfileService';
import { trackPublicBioTap, trackPublicBioView } from '@/src/services/firestoreService';
import {
  notifyCardOwnerOfView,
  notifyCardOwnerOfSave,
  notifyCardOwnerOfLeadCapture,
} from '@/src/services/cardViewNotificationService';
import { captureLead } from '@/src/services/leadService';
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

type SocialChannel = {
  key: string;
  name: string;
  icon: AppIconName;
  url: (v: string) => string;
};

const SOCIAL_CHANNELS: SocialChannel[] = [
  { key: 'telegram', name: 'Telegram', icon: 'Send', url: (v) => `https://t.me/${v.replace('@', '')}` },
  { key: 'whatsapp', name: 'WhatsApp', icon: 'Phone', url: (v) => `https://wa.me/${v.replace(/\D/g, '')}` },
  { key: 'email', name: 'Email', icon: 'Mail', url: (v) => `mailto:${v}` },
  { key: 'linkedin', name: 'LinkedIn', icon: 'Linkedin', url: (v) => (v.startsWith('http') ? v : `https://linkedin.com/in/${v}`) },
  { key: 'instagram', name: 'Instagram', icon: 'Instagram', url: (v) => `https://instagram.com/${v.replace('@', '')}` },
  { key: 'website', name: 'Website', icon: 'Globe', url: (v) => (v.startsWith('http') ? v : `https://${v}`) },
];

export function PublicBioScreen({ slug, cardId }: Props) {
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [resolvedCardId, setResolvedCardId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadNote, setLeadNote] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Load bio data with multi-layer fallback
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
          // Local draft fallback
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
                tagline: draft.jobTitle
                  ? `${draft.jobTitle}${draft.company ? ` · ${draft.company}` : ''}`
                  : draft.company || 'Founder & Managing Director · AVIO',
                email: draft.email || undefined,
                whatsapp: draft.phone || undefined,
                telegram: draft.telegram || undefined,
                customLinks: [],
                theme: 'tech_noir',
                views: 12,
                taps: 48,
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

  // Track view, tap & fire push notification to card owner
  useEffect(() => {
    if (!bioPage?.id) return;
    // Increment view counter
    void trackPublicBioView(bioPage.id, resolvedCardId).catch(() => undefined);
    // Push notification to card owner (non-blocking, silent fail)
    if (bioPage.userId && bioPage.userId !== 'guest') {
      void notifyCardOwnerOfView(bioPage.userId).catch(() => undefined);
    }
    if (resolvedCardId) {
      void recordTapEvent({ profileId: bioPage.id, cardId: resolvedCardId, source: 'nfc_card' }).catch(() => undefined);
    } else if (slug) {
      void recordTapEvent({ profileId: bioPage.id, source: 'slug' }).catch(() => undefined);
    }
  }, [bioPage?.id, bioPage?.userId, resolvedCardId, slug]);

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
    await Share.share({ message: `${bioPage?.displayName ?? 'My Profile'} — ${url}`, url });
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
    // Notify card owner their contact was saved (non-blocking)
    if (bioPage?.userId && bioPage.userId !== 'guest') {
      void notifyCardOwnerOfSave(bioPage.userId).catch(() => undefined);
    }
  }

  async function handleExchangeContactSubmit() {
    if (!leadName.trim()) return;
    setLeadSubmitting(true);
    try {
      const ownerId = bioPage?.userId || 'guest';
      await captureLead({
        profileId: bioPage?.id || slug || 'unknown',
        ownerUserId: ownerId,
        name: leadName.trim(),
        email: leadEmail.trim() || undefined,
        phone: leadPhone.trim() || undefined,
        company: leadCompany.trim() || undefined,
        note: leadNote.trim() || undefined,
      });

      // Send instant push notification to card owner
      if (ownerId !== 'guest') {
        void notifyCardOwnerOfLeadCapture(ownerId, leadName.trim(), leadCompany.trim() || undefined);
      }

      setLeadSuccess(true);
      HapticTap.heavy();
      setTimeout(() => {
        setShowExchangeModal(false);
        setLeadSuccess(false);
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadCompany('');
        setLeadNote('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit contact exchange:', err);
    } finally {
      setLeadSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <View style={styles.loadingAvatarPulse} />
      </View>
    );
  }

  if (!bioPage) {
    return (
      <SafeAreaView style={styles.notFoundSafe}>
        <View style={styles.notFoundCenter}>
          <AppIcon name="User" size={44} color="rgba(255, 255, 255, 0.4)" />
          <AppText style={styles.notFoundTitle} weight="extrabold">Profile not found</AppText>
          <AppText style={styles.notFoundSub}>This NFC profile link is not available yet.</AppText>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppText style={styles.backBtnText} weight="bold">Go back</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Active Social Connections
  const activeSocials = SOCIAL_CHANNELS.flatMap((s) => {
    const val = (bioPage as unknown as Record<string, unknown>)[s.key] as string | undefined;
    if (!val?.trim()) return [];
    return [{ ...s, value: val.trim() }];
  });

  const canonicalUrl =
    publicUrl ||
    (resolvedCardId
      ? buildCardProfileUrl(resolvedCardId)
      : buildSlugProfileUrl(bioPage.publicSlug ?? bioPage.slug ?? slug ?? ''));
  const metaTitle = compactMeta(`${bioPage.displayName} | AVIO Executive`, 64);
  const metaDescription = compactMeta(
    bioPage.tagline
      ? `${bioPage.displayName} - ${bioPage.tagline}. Verified NFC Smart Pass.`
      : `Save ${bioPage.displayName}'s contact details.`,
    155
  );

  const initial = (bioPage.displayName.trim()[0] ?? 'A').toUpperCase();

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
          <meta name="theme-color" content="#000000" />
        </Head>
      ) : null}

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Navigation Bar */}
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => {
              HapticTap.light();
              if (router.canGoBack()) router.back();
              else router.push('/');
            }}
            style={styles.navIconBtn}
            hitSlop={10}
          >
            <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.navRightGroup}>
            <Pressable onPress={() => setShowQrModal(true)} style={styles.navIconBtn} hitSlop={10}>
              <AppIcon name="QrCode" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => void handleShare()} style={styles.navIconBtn} hitSlop={10}>
              <AppIcon name="Share2" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <IosScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Executive Identity Card ── */}
          <View style={styles.executiveCard}>
            {/* Avatar Seal with Verified Ring */}
            <View style={styles.avatarWrap}>
              {bioPage.photoUrl ? (
                <Image source={{ uri: bioPage.photoUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarSeal}>
                  <AppText style={styles.avatarLetter} weight="extrabold">{initial}</AppText>
                </View>
              )}

              <View style={styles.verifiedBadge}>
                <AppIcon name="Check" size={11} color="#000000" />
              </View>
            </View>

            {/* Name & Title */}
            <View style={styles.nameBlock}>
              <AppText style={styles.nameText} weight="extrabold">{bioPage.displayName}</AppText>
              <AppText style={styles.taglineText}>
                {bioPage.tagline || 'Founder & Managing Director · AVIO'}
              </AppText>
              <AppText style={styles.slugBadgeText}>
                sitehubman.app/{bioPage.slug || slug || 'alexander'}
              </AppText>
            </View>

            {/* ── 2. Primary Executive Actions: Save Contact & Exchange Contact ── */}
            <View style={styles.actionButtonsCol}>
              <Pressable
                onPress={() => void handleSaveContact()}
                style={({ pressed }) => [styles.saveContactBtn, pressed && styles.pressed]}
              >
                <AppIcon name="UserPlus" size={17} color="#000000" />
                <AppText style={styles.saveContactBtnText} weight="extrabold">
                  Save to Contacts
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  setShowExchangeModal(true);
                }}
                style={({ pressed }) => [styles.exchangeContactBtn, pressed && styles.pressed]}
              >
                <AppIcon name="Users" size={16} color="#FFFFFF" />
                <AppText style={styles.exchangeContactBtnText} weight="extrabold">
                  Exchange Contact with {bioPage.displayName.split(' ')[0]}
                </AppText>
              </Pressable>
            </View>

            {/* ── 3. Quick Connect Action Bar ── */}
            <View style={styles.quickConnectRow}>
              {activeSocials.slice(0, 4).map((s) => (
                <Pressable
                  key={s.key}
                  style={({ pressed }) => [styles.quickActionTile, pressed && styles.pressed]}
                  onPress={() => {
                    trackTap();
                    HapticTap.light();
                    Linking.openURL(s.url(s.value)).catch(() => undefined);
                  }}
                >
                  <AppIcon name={s.icon} size={18} color="#FFFFFF" />
                  <AppText style={styles.quickActionLabel} weight="bold">{s.name}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={styles.hairlineDivider} />

          {/* ── 4. Executive Direct Channels ── */}
          <View style={styles.channelsSection}>
            <AppText style={styles.sectionHeading} weight="extrabold">CHANNELS & PORTFOLIO</AppText>

            <View style={styles.channelsList}>
              {activeSocials.map((s) => (
                <Pressable
                  key={s.key}
                  style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]}
                  onPress={() => {
                    trackTap();
                    HapticTap.light();
                    Linking.openURL(s.url(s.value)).catch(() => undefined);
                  }}
                >
                  <View style={styles.channelIconBox}>
                    <AppIcon name={s.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.channelMeta}>
                    <AppText style={styles.channelTitle} weight="bold">{s.name}</AppText>
                    <AppText style={styles.channelSub} numberOfLines={1}>{s.value}</AppText>
                  </View>
                  <AppIcon name="ArrowUpRight" size={16} color="rgba(255, 255, 255, 0.4)" />
                </Pressable>
              ))}

              {bioPage.customLinks && bioPage.customLinks.length > 0 &&
                bioPage.customLinks.map((link, idx) => (
                  <Pressable
                    key={`custom-${idx}`}
                    style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]}
                    onPress={() => {
                      trackTap();
                      HapticTap.light();
                      const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
                      Linking.openURL(url).catch(() => undefined);
                    }}
                  >
                    <View style={styles.channelIconBox}>
                      <AppIcon name="Link" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.channelMeta}>
                      <AppText style={styles.channelTitle} weight="bold">{link.label}</AppText>
                      <AppText style={styles.channelSub} numberOfLines={1}>{link.url}</AppText>
                    </View>
                    <AppIcon name="ArrowUpRight" size={16} color="rgba(255, 255, 255, 0.4)" />
                  </Pressable>
                ))}
            </View>
          </View>

          {/* ── 5. VIRAL GROWTH CARD: Get Your Own AVIO Card ── */}
          <Pressable
            style={({ pressed }) => [styles.viralCard, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.medium();
              Linking.openURL('https://aviobrand.com').catch(() => undefined);
            }}
          >
            <View style={styles.viralCardInner}>
              <View style={styles.viralAvatarSeal}>
                <AppText style={styles.viralAvatarLetter} weight="extrabold">A</AppText>
              </View>
              <View style={styles.viralTextBlock}>
                <AppText style={styles.viralTitle} weight="extrabold">
                  Want your own card like this?
                </AppText>
                <AppText style={styles.viralSub}>
                  Create a free AVIO Smart Pass in 60 seconds.
                </AppText>
              </View>
              <AppIcon name="ArrowUpRight" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.viralPillRow}>
              <View style={styles.viralPill}><AppText style={styles.viralPillText} weight="bold">Free to start</AppText></View>
              <View style={styles.viralPill}><AppText style={styles.viralPillText} weight="bold">NFC ready</AppText></View>
              <View style={styles.viralPill}><AppText style={styles.viralPillText} weight="bold">No app needed</AppText></View>
            </View>
          </Pressable>

          {/* ── 6. NFC Verified Footer ── */}
          <View style={styles.nfcVerifiedFooter}>
            <View style={styles.nfcDot} />
            <AppText style={styles.nfcFooterText}>
              AVIO Smart Pass · {resolvedCardId || 'BC-NFC_JEWDVONG'} · Verified Tap
            </AppText>
          </View>

        </IosScrollView>
      </SafeAreaView>

      {/* QR Code Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeaderRow}>
              <AppText style={styles.qrModalTitle} weight="bold">Scan Profile QR</AppText>
              <Pressable onPress={() => setShowQrModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              {canonicalUrl ? <QRCode value={canonicalUrl} size={200} backgroundColor="#FFFFFF" color="#000000" /> : null}
            </View>
            <AppText style={styles.qrNameText} weight="extrabold">{bioPage.displayName}</AppText>
            <AppText style={styles.qrSubText}>Scan with phone camera to connect</AppText>
          </View>
        </View>
      </Modal>

      {/* ── Exchange Contact Bottom Sheet Modal ── */}
      <Modal visible={showExchangeModal} animationType="slide" transparent>
        <Pressable style={styles.exchangeOverlay} onPress={() => setShowExchangeModal(false)}>
          <Pressable style={styles.exchangeCard} onPress={() => {}}>
            <View style={styles.exchangeHandle} />
            
            <View style={styles.exchangeHeaderRow}>
              <View style={styles.exchangeIconBox}>
                <AppIcon name="Users" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.exchangeModalTitle} weight="extrabold">
                  Exchange Contact
                </AppText>
                <AppText style={styles.exchangeModalSub}>
                  Send your details directly to {bioPage.displayName.split(' ')[0]}
                </AppText>
              </View>
              <Pressable onPress={() => setShowExchangeModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {leadSuccess ? (
              <View style={styles.exchangeSuccessBox}>
                <View style={styles.exchangeSuccessIcon}>
                  <AppIcon name="Check" size={24} color="#000000" />
                </View>
                <AppText style={styles.exchangeSuccessTitle} weight="extrabold">
                  Contact Exchanged!
                </AppText>
                <AppText style={styles.exchangeSuccessSub}>
                  Your info was sent directly to {bioPage.displayName.split(' ')[0]}'s private CRM.
                </AppText>
              </View>
            ) : (
              <View style={styles.exchangeForm}>
                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Full Name *</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadName}
                    onChangeText={setLeadName}
                    placeholder="e.g. Sarah Jenkins"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Email or Phone *</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadEmail || leadPhone}
                    onChangeText={(val) => {
                      if (val.includes('@')) {
                        setLeadEmail(val);
                      } else {
                        setLeadPhone(val);
                      }
                    }}
                    placeholder="sarah@company.com or +1 555-0199"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Company / Role (Optional)</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadCompany}
                    onChangeText={setLeadCompany}
                    placeholder="Partner @ Apex Capital"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Quick Note (Optional)</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadNote}
                    onChangeText={setLeadNote}
                    placeholder="e.g. Met at tech conference"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>

                <Pressable
                  onPress={() => void handleExchangeContactSubmit()}
                  disabled={!leadName.trim() || leadSubmitting}
                  style={({ pressed }) => [
                    styles.sendContactBtn,
                    (!leadName.trim() || leadSubmitting) && styles.btnDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.sendContactBtnText} weight="extrabold">
                    {leadSubmitting ? 'Sending...' : 'Send My Contact →'}
                  </AppText>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  loadingCenter: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAvatarPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16161A',
  },
  pressed: {
    opacity: 0.75,
  },

  // ── Top Nav ──
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  navRightGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll Content ──
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 130, // Clearance for floating capsule dock
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },

  // ── Executive Identity Card ──
  executiveCard: {
    borderRadius: 20,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarSeal: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    color: '#000000',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111114',
  },
  nameBlock: {
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  taglineText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  slugBadgeText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ── Primary Action ──
  saveContactBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveContactBtnText: {
    color: '#000000',
    fontSize: 15,
  },

  // ── Quick Connect Bar ──
  quickConnectRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  quickActionTile: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickActionLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },

  // ── Divider ──
  hairlineDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },

  // ── Channels & Portfolio ──
  channelsSection: {
    gap: 10,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  channelsList: {
    gap: 6,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  channelIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelMeta: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  channelSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },

  // ── Viral Growth Card ──
  viralCard: {
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    gap: 12,
  },
  viralCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viralAvatarSeal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viralAvatarLetter: {
    fontSize: 18,
    color: '#000000',
  },
  viralTextBlock: {
    flex: 1,
    gap: 2,
  },
  viralTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  viralSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
  },
  viralPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  viralPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viralPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },

  // ── NFC Footer ──
  nfcVerifiedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  nfcDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  nfcFooterText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#111114',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  qrHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  qrNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  qrSubText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
  },

  // ── Not Found ──
  notFoundSafe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  notFoundSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    color: '#000000',
    fontSize: 14,
  },

  // ── Executive Action Buttons ──
  actionButtonsCol: {
    width: '100%',
    gap: 8,
  },
  exchangeContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18181C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
  },
  exchangeContactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  // ── Exchange Modal ──
  exchangeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  exchangeCard: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  exchangeHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  exchangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exchangeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  exchangeModalSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
  },
  exchangeForm: {
    gap: 12,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  sendContactBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  sendContactBtnText: {
    color: '#000000',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  exchangeSuccessBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  exchangeSuccessIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  exchangeSuccessTitle: {
    color: '#FFFFFF',
    fontSize: 19,
  },
  exchangeSuccessSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

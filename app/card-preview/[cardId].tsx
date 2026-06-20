import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GeneratedProfileIcon } from '@/src/components/GeneratedProfileIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { buildCardProfileUrl } from '@/src/constants/publicProfile';
import { iosDesign } from '@/src/design-system/ios';
import { GuestAccountSheet } from '@/src/features/guest/GuestAccountSheet';
import { PhotoBanner } from '@/src/components/PhotoBanner';
import { GuestCardPreview } from '@/src/features/guest/GuestCardPreview';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import {
  loadGuestCloudCard,
  type GuestCloudCard,
} from '@/src/services/guestCardDraftService';
import { auth } from '@/src/services/firebaseClient';
import { getAuthErrorMessage } from '@/src/services/authService';
import type { AppUser } from '@/src/types/models';
import { isGuestUser } from '@/src/utils/authFlow';

type ActionTileProps = {
  icon: AppIconName;
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

function ensureUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function ActionTile({ icon, label, disabled, onPress }: ActionTileProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionTile,
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <AppIcon name={icon} size={19} color={guestUi.accent} />
      </View>
      <AppText style={styles.actionLabel}>{label}</AppText>
    </Pressable>
  );
}

export default function GuestCardPreviewRoute() {
  const params = useLocalSearchParams<{ cardId: string }>();
  const cardId = typeof params.cardId === 'string' ? params.cardId : '';
  const { user, signInAsGuest } = useAuth();
  const [card, setCard] = useState<GuestCloudCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyGuest, setBusyGuest] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadGuestCloudCard(cardId);
      setCard(loaded);
      if (!loaded) setError('Draft not found. Start a new NFC card first.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const publicUrl = useMemo(
    () => (card?.publicSlug ? buildCardProfileUrl(card.publicSlug) : ''),
    [card?.publicSlug]
  );

  async function handleContinueAsGuest() {
    if (!card) return;
    setBusyGuest(true);
    setError(null);
    try {
      if (!auth.currentUser && isGuestUser(user)) {
        await signInAsGuest();
      }
      router.push({ pathname: '/checkout/[cardId]', params: { cardId: card.cardId } });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusyGuest(false);
    }
  }

  async function handleConverted(convertedUser: AppUser) {
    setAccountOpen(false);
    router.replace(await getPostAuthDestination(convertedUser));
  }

  async function shareContact() {
    if (!card) return;
    const p = card.profile;
    const message = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${p.fullName || 'NFC Profile'}`,
      p.company ? `ORG:${p.company}` : '',
      p.role ? `TITLE:${p.role}` : '',
      p.phone ? `TEL:${p.phone}` : '',
      p.email ? `EMAIL:${p.email}` : '',
      p.website ? `URL:${ensureUrl(p.website)}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\n');
    await Share.share({ title: p.fullName || 'NFC Profile', message });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={guestUi.accent} />
          <AppText style={styles.muted}>Loading card preview...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Preview" subtitle="NFC card draft" showBack />
        <View style={styles.center}>
          <AppText style={styles.emptyTitle}>No draft found</AppText>
          <AppText style={styles.emptyText}>{error}</AppText>
          <AppButton label="Back to design" onPress={() => router.replace('/guest-design')} />
        </View>
      </SafeAreaView>
    );
  }

  const profile = card.profile;
  const telegramUrl = profile.telegram
    ? profile.telegram.startsWith('http')
      ? profile.telegram
      : `https://t.me/${profile.telegram.replace(/^@/, '')}`
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader title="Your NFC Profile" subtitle="Preview before checkout" showBack />
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PhotoBanner
          marketingSceneId="profile-preview"
          cacheKey="marketing-profile-preview"
          variant="compact"
          overlay="product"
        />
        <GuestCardPreview
          displayName={profile.fullName}
          jobTitle={profile.role}
          company={profile.company}
          email={profile.email}
          phone={profile.phone}
          product={card.design.product ?? 'pvc_card'}
          cardDesign={card.design.cardDesign ?? 'classic_black'}
        />

        <View style={styles.profileCard}>
          <GeneratedProfileIcon
            name={profile.fullName}
            subtitle={[profile.role, profile.company].filter(Boolean).join(' ')}
            seed={card.publicSlug || card.cardId}
            photoUrl={card.design.avatarUrl}
            size={62}
          />
          <View style={styles.profileCopy}>
            <AppText style={styles.profileName}>{profile.fullName || 'Your Name'}</AppText>
            <AppText style={styles.profileSub}>
              {[profile.role, profile.company].filter(Boolean).join(' - ') || 'NFC business card'}
            </AppText>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          <ActionTile
            icon="Phone"
            label="Call"
            disabled={!profile.phone}
            onPress={() => void Linking.openURL(`tel:${profile.phone}`)}
          />
          <ActionTile
            icon="Mail"
            label="Email"
            disabled={!profile.email}
            onPress={() => void Linking.openURL(`mailto:${profile.email}`)}
          />
          <ActionTile
            icon="Share"
            label="Telegram"
            disabled={!telegramUrl}
            onPress={() => void Linking.openURL(telegramUrl)}
          />
          <ActionTile
            icon="Link"
            label="Website"
            disabled={!profile.website}
            onPress={() => void Linking.openURL(ensureUrl(profile.website))}
          />
        </View>

        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            {publicUrl ? <QRCode value={publicUrl} size={148} /> : null}
          </View>
          <View style={styles.qrCopy}>
            <AppText style={styles.sectionTitle}>Public NFC link</AppText>
            <AppText style={styles.publicLink} numberOfLines={2}>{publicUrl}</AppText>
            <View style={styles.inlineActions}>
              <Pressable style={styles.inlineButton} onPress={() => router.push(`/c/${encodeURIComponent(card.publicSlug)}`)}>
                <AppIcon name="ExternalLink" size={16} color={guestUi.text} />
                <AppText style={styles.inlineText}>Preview Live</AppText>
              </Pressable>
              <Pressable style={styles.inlineButton} onPress={() => void shareContact()}>
                <AppIcon name="Download" size={16} color={guestUi.text} />
                <AppText style={styles.inlineText}>Save Contact</AppText>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.prompt}>
          <AppText style={styles.promptTitle}>Save your NFC card</AppText>
          <AppText style={styles.promptText}>
            Create a free account to edit later, track orders, and manage future cards.
          </AppText>
          <View style={styles.benefits}>
            {['Sync across devices', 'Track your order', 'Edit anytime'].map((item) => (
              <View key={item} style={styles.benefitRow}>
                <AppIcon name="CheckCheck" size={14} color={guestUi.accent} />
                <AppText style={styles.benefitText}>{item}</AppText>
              </View>
            ))}
          </View>
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <AppButton label="Create Account" iconName="UserPlus" onPress={() => setAccountOpen(true)} />
          <AppButton
            label={busyGuest ? 'Preparing checkout...' : 'Continue as Guest'}
            variant="outline"
            loading={busyGuest}
            onPress={() => void handleContinueAsGuest()}
          />
        </View>
      </IosScrollView>

      <GuestAccountSheet
        visible={accountOpen}
        cardId={card.cardId}
        onClose={() => setAccountOpen(false)}
        onConverted={handleConverted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosDesign.spacing.md,
    padding: iosDesign.spacing.lg,
  },
  muted: { color: guestUi.muted, fontWeight: '600' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: guestUi.text },
  emptyText: { textAlign: 'center', color: guestUi.muted, lineHeight: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.md,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  profileCopy: { flex: 1, minWidth: 0, gap: 4 },
  profileName: { fontSize: 22, fontWeight: '800', color: guestUi.text },
  profileSub: { fontSize: 13, fontWeight: '600', color: guestUi.muted },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: iosDesign.spacing.sm,
  },
  actionTile: {
    width: '48%',
    minHeight: 82,
    borderRadius: guestUi.radiusMd,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.sm,
    gap: iosDesign.spacing.xs,
    ...guestUi.shadow,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: guestUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '800', color: guestUi.text },
  actionDisabled: { opacity: 0.42 },
  pressed: { opacity: 0.82, transform: [{ scale: iosDesign.animation.softPressScale }] },
  qrCard: {
    flexDirection: 'row',
    gap: iosDesign.spacing.md,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  qrBox: {
    width: 168,
    height: 168,
    borderRadius: guestUi.radiusMd,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCopy: { flex: 1, minWidth: 0, gap: iosDesign.spacing.xs },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: guestUi.text },
  publicLink: { fontSize: 12, lineHeight: 17, fontWeight: '600', color: guestUi.muted },
  inlineActions: { gap: iosDesign.spacing.xs, marginTop: iosDesign.spacing.xs },
  inlineButton: {
    minHeight: 38,
    borderRadius: 16,
    backgroundColor: guestUi.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: iosDesign.spacing.sm,
  },
  inlineText: { fontSize: 12, fontWeight: '800', color: guestUi.text },
  prompt: {
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  promptTitle: { fontSize: 22, fontWeight: '800', color: guestUi.text },
  promptText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: guestUi.muted },
  benefits: { gap: 6 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitText: { fontSize: 12, fontWeight: '700', color: guestUi.text },
  error: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },
});

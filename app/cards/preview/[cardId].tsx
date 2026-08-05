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
import { GuestAccountSheet } from '@/src/features/guest/GuestAccountSheet';
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
        <AppIcon name={icon} size={19} color="#FFFFFF" />
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
      router.push({ pathname: '/payments/checkout/[cardId]', params: { cardId: card.cardId } });
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
      <AppHeader title="Your NFC Card Preview" subtitle="Review before physical order or cloud sync" showBack />
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
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
                {[profile.role, profile.company].filter(Boolean).join(' · ') || 'NFC business profile'}
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
              {publicUrl ? <QRCode value={publicUrl} size={130} /> : null}
            </View>
            <View style={styles.qrCopy}>
              <AppText style={styles.sectionTitle}>Public NFC Profile Link</AppText>
              <AppText style={styles.publicLink} numberOfLines={2}>{publicUrl}</AppText>
              <View style={styles.inlineActions}>
                <Pressable style={styles.inlineButton} onPress={() => router.push(`/u/${encodeURIComponent(card.publicSlug)}`)}>
                  <AppIcon name="ExternalLink" size={14} color="#FFFFFF" />
                  <AppText style={styles.inlineText}>Preview Live</AppText>
                </Pressable>
                <Pressable style={styles.inlineButton} onPress={() => void shareContact()}>
                  <AppIcon name="Download" size={14} color="#FFFFFF" />
                  <AppText style={styles.inlineText}>Save Contact</AppText>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.prompt}>
            <AppText style={styles.promptTitle}>Ready for Order & Sync</AppText>
            <AppText style={styles.promptText}>
              Continue to checkout when the preview looks right. Create an account to sync live edits and track physical card delivery.
            </AppText>
            <View style={styles.benefits}>
              {['Instant NFC tap activation', 'Real-time tap analytics', 'Order status tracking'].map((item) => (
                <View key={item} style={styles.benefitRow}>
                  <AppIcon name="CheckCheck" size={15} color="#30D158" />
                  <AppText style={styles.benefitText}>{item}</AppText>
                </View>
            ))}
            </View>
            {error ? <AppText style={styles.error}>{error}</AppText> : null}
            <View style={styles.btnRow}>
              <AppButton
                label={busyGuest ? 'Preparing checkout...' : 'Continue to Checkout'}
                iconName="CreditCard"
                loading={busyGuest}
                variant="dark"
                onPress={() => void handleContinueAsGuest()}
              />
              <AppButton
                label="Create Account to Sync"
                iconName="UserPlus"
                variant="outline"
                onPress={() => setAccountOpen(true)}
              />
            </View>
          </View>
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
  safe: { flex: 1, backgroundColor: '#000000' },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  muted: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  emptyText: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111114',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  profileCopy: { flex: 1, minWidth: 0, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionTile: {
    width: '48%',
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 8,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  actionDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  qrCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#111114',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    alignItems: 'center',
  },
  qrBox: {
    width: 144,
    height: 144,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  qrCopy: { flex: 1, minWidth: 0, gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  publicLink: { fontSize: 11, lineHeight: 16, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  inlineActions: { gap: 6, marginTop: 4 },
  inlineButton: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  inlineText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  prompt: {
    gap: 12,
    backgroundColor: '#111114',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  promptTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  promptText: { fontSize: 13, lineHeight: 19, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  benefits: { gap: 6 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  error: { fontSize: 12, fontWeight: '700', color: '#FF453A' },
  btnRow: { gap: 10, marginTop: 4 },
});

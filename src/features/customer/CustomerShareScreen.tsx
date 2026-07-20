import { useState, useEffect, useMemo } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { PageHeader } from '@/src/components/PageHeader';
import { appRoutes } from '@/src/constants/navigation';
import { pageThemes } from '@/src/constants/pageThemes';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';
import { loadCustomerCloudCard, loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME = pageThemes.share;

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

  const displayName = bioPage?.displayName?.trim() || user?.displayName?.trim() || (isGuest ? 'Guest User' : 'Your Card');
  const title = bioPage?.tagline?.trim() || (isGuest ? 'Demo Member' : 'Digital identity');
  
  const profileUrl = useMemo(() => {
    if (bioPage?.slug) return buildSlugProfileUrl(bioPage.slug);
    if (isGuest) return buildSlugProfileUrl('guest-demo');
    return '';
  }, [isGuest, bioPage?.slug]);

  async function handleShare() {
    if (!profileUrl) {
      Alert.alert('Publish your profile first', 'Open Studio and save a public profile link before sharing.');
      return;
    }
    HapticTap.medium();
    await Share.share({ message: `${displayName} - ${profileUrl}`, url: profileUrl });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader
          theme={THEME}
          eyebrow="Identity handoff"
          title="Share"
          subtitle="Send your NFC card, QR code, or public profile link."
          compact
          showBack={true}
          onBack={() => router.replace('/')}
        />

        <View style={styles.cardWrap}>
          <NfcGlobalCardFace
            fullName={displayName}
            title={title}
            phone={bioPage?.whatsapp || user?.phone || undefined}
            email={bioPage?.email || user?.email || undefined}
            profileUrl={profileUrl || undefined}
            gradientIndex={cloudCard?.design?.gradientIndex ?? 0}
            backgroundImageUri={cloudCard?.design?.customImageUri || undefined}
          />
        </View>

        <View style={styles.radarBadge}>
          <AppIcon name="Nfc" size={16} color="#FFFFFF" />
          <AppText style={styles.radarText}>NFC ANTENNA ACTIVE</AppText>
        </View>

        <View style={styles.qrPanel}>
          <View style={styles.qrHeader}>
            <View style={styles.qrIcon}>
              <AppIcon name="QrCode" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.qrCopy}>
              <AppText style={styles.qrTitle}>{profileUrl ? 'QR code ready' : 'Profile not published'}</AppText>
              <AppText style={styles.qrSub} numberOfLines={2}>
                {profileUrl || 'Open Studio to create your public identity link.'}
              </AppText>
            </View>
          </View>
          <View style={styles.qrBox}>
            {profileUrl ? (
              <QRCode value={profileUrl} size={148} color="#000000" backgroundColor="#FFFFFF" quietZone={4} />
            ) : (
              <AppIcon name="QrCode" size={96} color="#4B5563" />
            )}
          </View>
        </View>

        <View style={{ marginTop: 6 }}>
          <AppButton
            label="Share card"
            iconName="Share2"
            variant="dark"
            onPress={() => void handleShare()}
          />
        </View>

        <View style={styles.actionList}>
          <Pressable
            onPress={() => router.push(appRoutes.qrGenerator)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}><AppIcon name="QrCode" size={22} color="#FFFFFF" /></View>
            <AppText style={styles.rowTitle}>Open full QR</AppText>
            <AppIcon name="ChevronRight" size={15} color={THEME.muted} />
          </Pressable>
          <Pressable
            onPress={() => router.push(appRoutes.studio as never)}
            style={({ pressed }) => [styles.row, styles.rowLast, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}><AppIcon name="Sparkles" size={22} color="#FFFFFF" /></View>
            <AppText style={styles.rowTitle}>Edit in Studio</AppText>
            <AppIcon name="ChevronRight" size={15} color={THEME.muted} />
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 22 },
  cardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  radarText: {
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  qrPanel: {
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qrHeader: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrIcon: { width: 32, alignItems: 'center', justifyContent: 'center' },
  qrBox: { width: 178, height: 178, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  qrCopy: { flex: 1, gap: 3, minWidth: 0 },
  qrTitle: { fontSize: 18, color: THEME.text, fontFamily: 'SF-Pro-Display-Regular' },
  qrSub: { fontSize: 13, color: THEME.muted, lineHeight: 18, fontFamily: 'SF-Pro-Display-Regular' },
  actionList: { backgroundColor: '#111114', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 32, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, fontSize: 16, color: THEME.text, fontFamily: 'SF-Pro-Display-Regular' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});

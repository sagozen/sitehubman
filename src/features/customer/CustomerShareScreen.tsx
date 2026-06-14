import { IosScrollView } from '@/src/components/IosScrollView';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';

const BRAND = '#2596BE';
const INK = '#111111';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

export function CustomerShareScreen() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  const displayName = bioPage?.displayName?.trim() || user?.displayName?.trim() || 'Your Card';
  const title = bioPage?.tagline?.trim() || 'Digital identity';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : '';

  async function handleShare() {
    if (!profileUrl) {
      Alert.alert('Publish your profile first', 'Open Studio and save a public profile link before sharing.');
      return;
    }
    await Share.share({ message: `${displayName} · ${profileUrl}`, url: profileUrl });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText style={styles.kicker}>Share</AppText>
          <AppText style={styles.title}>Send your card in one tap.</AppText>
        </View>

        <View style={styles.cardWrap}>
          <NfcGlobalCardFace
            fullName={displayName}
            title={title}
            phone={bioPage?.whatsapp || user?.phone || undefined}
            email={bioPage?.email || user?.email || undefined}
            profileUrl={profileUrl || undefined}
          />
        </View>

        <View style={styles.qrPanel}>
          <View style={styles.qrBox}>
            {profileUrl ? (
              <QRCode value={profileUrl} size={148} color={INK} backgroundColor={SURFACE} quietZone={4} />
            ) : (
              <AppIcon name="QrCode" size={96} color="#D1D5DB" />
            )}
          </View>
          <View style={styles.qrCopy}>
            <AppText style={styles.qrTitle}>{profileUrl ? 'Public link ready' : 'Profile not published'}</AppText>
            <AppText style={styles.qrSub} numberOfLines={2}>
              {profileUrl || 'Open Studio to create your public identity link.'}
            </AppText>
          </View>
        </View>

        <Pressable onPress={() => void handleShare()} style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}>
          <AppIcon name="Share" size={20} color="#FFFFFF" />
          <AppText style={styles.shareButtonText}>Share card</AppText>
        </Pressable>

        <View style={styles.actionList}>
          <Pressable onPress={() => router.push(appRoutes.qrGenerator)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <AppIcon name="QrCode" size={22} color={INK} />
            <AppText style={styles.rowTitle}>Open full QR</AppText>
            <AppIcon name="ChevronRight" size={15} color={MUTED} />
          </Pressable>
          <Pressable onPress={() => router.push(appRoutes.studio as any)} style={({ pressed }) => [styles.row, styles.rowLast, pressed && styles.pressed]}>
            <AppIcon name="Sparkles" size={22} color={BRAND} />
            <AppText style={styles.rowTitle}>Edit in Studio</AppText>
            <AppIcon name="ChevronRight" size={15} color={MUTED} />
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 120, gap: 24 },
  header: { gap: 7 },
  kicker: { fontSize: 13, fontWeight: '900', color: BRAND },
  title: { fontSize: 40, lineHeight: 43, fontWeight: '900', color: INK, letterSpacing: 0 },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 34,
    elevation: 10,
  },
  qrPanel: { backgroundColor: SURFACE, borderRadius: 24, padding: 22, alignItems: 'center', gap: 18 },
  qrBox: { width: 176, height: 176, borderRadius: 24, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  qrCopy: { alignItems: 'center', gap: 5 },
  qrTitle: { fontSize: 20, fontWeight: '900', color: INK },
  qrSub: { fontSize: 13, fontWeight: '700', color: MUTED, textAlign: 'center', lineHeight: 18 },
  shareButton: { height: 58, borderRadius: 29, backgroundColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  shareButtonText: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  actionList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowTitle: { flex: 1, fontSize: 17, fontWeight: '900', color: INK },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});

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

const BRAND = '#007AFF';
const INK = '#000000';
const MUTED = '#8E8E93';
const BG = '#F2F2F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(60,60,67,0.14)';

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
          <AppText style={styles.title}>Share</AppText>
          <AppText style={styles.subtitle}>Send your NFC card, QR code, or public profile link.</AppText>
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
          <View style={styles.qrHeader}>
            <View style={styles.qrIcon}>
              <AppIcon name="QrCode" size={20} color={BRAND} />
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
              <QRCode value={profileUrl} size={148} color={INK} backgroundColor={SURFACE} quietZone={4} />
            ) : (
              <AppIcon name="QrCode" size={96} color="#D1D5DB" />
            )}
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
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 120, gap: 22 },
  header: { gap: 6 },
  title: { fontSize: 42, lineHeight: 46, fontWeight: '900', color: INK, letterSpacing: 0 },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: MUTED, maxWidth: 330 },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 34,
    elevation: 10,
  },
  qrPanel: { backgroundColor: SURFACE, borderRadius: 24, padding: 18, alignItems: 'center', gap: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  qrHeader: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
  qrBox: { width: 178, height: 178, borderRadius: 24, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  qrCopy: { flex: 1, gap: 3, minWidth: 0 },
  qrTitle: { fontSize: 18, fontWeight: '900', color: INK },
  qrSub: { fontSize: 13, fontWeight: '600', color: MUTED, lineHeight: 18 },
  shareButton: { height: 56, borderRadius: 16, backgroundColor: BRAND, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  shareButtonText: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  actionList: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
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

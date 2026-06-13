import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Share } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CommentLoader } from '@/src/components/CommentLoader';
import { useAuth } from '@/src/hooks/useAuth';
import { getBioPage } from '@/src/services/firestoreService';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';

const BRAND = '#2596BE';
const BRAND_DARK = '#1A7FAA';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';

export function QrCodeGeneratorScreen() {
  const { user } = useAuth();
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const bio = await getBioPage(user.id);
      if (bio?.slug || bio?.publicSlug) {
        setProfileUrl(buildSlugProfileUrl(bio.publicSlug ?? bio.slug));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function handleShare() {
    if (!profileUrl) return;
    try {
      await Share.share({ message: `Connect with me: ${profileUrl}`, url: profileUrl });
    } catch {
      Alert.alert('Error', 'Unable to share.');
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <AppText style={s.title}>QR Code</AppText>
          <AppText style={s.subtitle}>Share your digital card</AppText>
        </View>

        {loading ? (
          <View style={s.center}>
            <CommentLoader size={52} color={BRAND} bubbleColor="#FFFFFF" />
            <AppText style={s.loadingT}>Loading your profile…</AppText>
          </View>
        ) : profileUrl ? (
          <>
            {/* QR card */}
            <View style={s.qrCard}>
              {/* Top brand band */}
              <LinearGradient
                colors={[BRAND_DARK, BRAND, '#4DB8D8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.qrBand}
              />
              <View style={s.qrInner}>
                <View style={s.qrWrap}>
                  <QRCode
                    value={profileUrl}
                    size={200}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                    logoSize={44}
                    logoBackgroundColor="transparent"
                    quietZone={12}
                  />
                </View>
                <AppText style={s.qrLabel}>Scan to connect</AppText>
                <AppText style={s.qrUrl} numberOfLines={2}>{profileUrl}</AppText>
              </View>
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <Pressable
                onPress={() => void handleShare()}
                style={({ pressed }) => [s.shareBtn, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[BRAND_DARK, BRAND]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <AppIcon name="Share" size={20} color="#FFFFFF" />
                <AppText style={s.shareBtnT}>Share Link</AppText>
              </Pressable>
            </View>

            {/* Info */}
            <View style={s.infoCard}>
              {[
                { icon: 'Nfc' as const, title: 'NFC + QR on every card', sub: 'QR works everywhere NFC is unavailable' },
                { icon: 'QrCode' as const, title: 'Same URL as your NFC chip', sub: 'One profile, two ways to tap and scan' },
                { icon: 'ShieldCheck' as const, title: 'Always live', sub: 'Update your profile without reprinting your card' },
              ].map((item, i, arr) => (
                <View key={item.title} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                  <AppIcon name={item.icon} size={22} color={BRAND} />
                  <View style={s.infoCopy}>
                    <AppText style={s.infoTitle}>{item.title}</AppText>
                    <AppText style={s.infoSub}>{item.sub}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={s.emptyCard}>
            <AppIcon name="QrCode" size={52} color="#D1D5DB" />
            <AppText style={s.emptyTitle}>No profile yet</AppText>
            <AppText style={s.emptySub}>Create and publish your bio page to generate a QR code.</AppText>
          </View>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  header: { gap: 3 },
  title: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -0.8, fontFamily: 'Inter_900Black' },
  subtitle: { fontSize: 13, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingT: { fontSize: 13, fontWeight: '500', color: MUTED },
  qrCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  qrBand: { height: 6 },
  qrInner: { padding: 28, alignItems: 'center', gap: 14 },
  qrWrap: {
    padding: 16,
    backgroundColor: SURFACE,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrLabel: { fontSize: 16, fontWeight: '800', color: INK2, letterSpacing: -0.3, fontFamily: 'Inter_800ExtraBold' },
  qrUrl: { fontSize: 11, fontWeight: '500', color: MUTED, textAlign: 'center', maxWidth: 260, fontFamily: 'Inter_500Medium' },
  actions: { gap: 10 },
  shareBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  shareBtnT: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  infoCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoCopy: { flex: 1, gap: 2 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: INK2, fontFamily: 'Inter_700Bold' },
  infoSub: { fontSize: 12, fontWeight: '500', color: MUTED },
  emptyCard: { backgroundColor: SURFACE, borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: INK2, fontFamily: 'Inter_800ExtraBold' },
  emptySub: { fontSize: 13, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 18 },
});

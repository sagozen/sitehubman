import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View , Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CommentLoader } from '@/src/components/CommentLoader';
import { useAuth } from '@/src/hooks/useAuth';
import { getBioPage } from '@/src/services/firestoreService';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';

const BRAND = '#007AFF';
const INK = '#000000';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F2F2F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(60,60,67,0.14)';

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
          <AppText style={s.subtitle}>A scannable backup for every NFC card.</AppText>
        </View>

        {loading ? (
          <View style={s.center}>
            <CommentLoader size={52} color={BRAND} bubbleColor="#FFFFFF" />
            <AppText style={s.loadingT}>Loading your profile…</AppText>
          </View>
        ) : profileUrl ? (
          <>
            <View style={s.qrCard}>
              <View style={s.qrInner}>
                <View style={s.qrTopIcon}>
                  <AppIcon name="QrCode" size={22} color={BRAND} />
                </View>
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

            <View style={s.actions}>
              <Pressable
                onPress={() => void handleShare()}
                style={({ pressed }) => [s.shareBtn, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <AppIcon name="Share" size={20} color="#FFFFFF" />
                <AppText style={s.shareBtnT}>Share Link</AppText>
              </Pressable>
            </View>

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
  content: { padding: 22, gap: 22, paddingBottom: 100 },
  header: { gap: 6 },
  title: { fontSize: 42, lineHeight: 46, fontWeight: '900', color: INK, letterSpacing: 0 },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: MUTED },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingT: { fontSize: 13, fontWeight: '500', color: MUTED },
  qrCard: {
    backgroundColor: SURFACE,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  qrInner: { padding: 28, alignItems: 'center', gap: 16 },
  qrTopIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
  qrWrap: {
    padding: 16,
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  qrLabel: { fontSize: 18, fontWeight: '900', color: INK2, letterSpacing: 0 },
  qrUrl: { fontSize: 12, fontWeight: '600', color: MUTED, textAlign: 'center', maxWidth: 280, lineHeight: 17 },
  actions: { gap: 10 },
  shareBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareBtnT: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  infoCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  infoCopy: { flex: 1, gap: 2 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: INK2 },
  infoSub: { fontSize: 12, fontWeight: '500', color: MUTED },
  emptyCard: { backgroundColor: SURFACE, borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: INK2 },
  emptySub: { fontSize: 13, fontWeight: '500', color: MUTED, textAlign: 'center', lineHeight: 18 },
});

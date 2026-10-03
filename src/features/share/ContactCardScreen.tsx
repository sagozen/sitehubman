import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#2596BE',
} as const;

function buildVCard(params: {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
}): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${params.name}`,
    `TITLE:${params.title}`,
    `ORG:${params.company}`,
    params.phone ? `TEL;TYPE=CELL:${params.phone}` : null,
    params.email ? `EMAIL:${params.email}` : null,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function ContactCardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? 'guest';
  const { bioPage } = useBioPage(userId);

  const displayName = user?.displayName ?? bioPage?.displayName ?? 'Your Name';
  const jobTitle = (bioPage as any)?.jobTitle ?? 'Digital Card';
  const company = (bioPage as any)?.company ?? 'SiteHubMan';
  const phone = (bioPage as any)?.phone ?? '';
  const email = user?.email ?? '';

  const vCard = buildVCard({ name: displayName, title: jobTitle, company, phone, email });

  const handleSaveContact = useCallback(async () => {
    HapticTap.confidentClick();
    try {
      await Share.share({
        message: vCard,
        title: `${displayName}'s Contact Card`,
      });
    } catch {
      Alert.alert('Error', 'Could not open contact saver.');
    }
  }, [vCard, displayName]);

  const handleShareVCard = useCallback(async () => {
    HapticTap.light();
    try {
      await Share.share({
        message: vCard,
        title: `${displayName} - vCard`,
      });
    } catch {
      // Dismissed
    }
  }, [vCard, displayName]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={C.text} />
        </Pressable>
        <AppText variant="title3" style={styles.headerTitle}>Contact Card</AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.cardTop}>
            <View style={styles.cardAvatar}>
              <AppText style={styles.cardAvatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.cardInfo}>
              <AppText style={styles.cardName}>{displayName}</AppText>
              <AppText variant="caption" muted>{jobTitle}</AppText>
              <AppText variant="caption" muted>{company}</AppText>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.contactDetails}>
            {phone ? (
              <View style={styles.detailRow}>
                <AppIcon name="Phone" size={15} color={C.muted} />
                <AppText variant="bodySmall" muted>{phone}</AppText>
              </View>
            ) : null}
            {email ? (
              <View style={styles.detailRow}>
                <AppIcon name="Mail" size={15} color={C.muted} />
                <AppText variant="bodySmall" muted>{email}</AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.87 }]}
            onPress={handleSaveContact}
            hitSlop={4}
          >
            <AppIcon name="UserPlus" size={18} color="#000" />
            <AppText style={styles.primaryBtnText}>Save Contact</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            onPress={handleShareVCard}
            hitSlop={4}
          >
            <AppIcon name="Share2" size={18} color={C.text} />
            <AppText style={styles.secondaryBtnText}>Share vCard</AppText>
          </Pressable>
        </View>

        {/* vCard Preview */}
        <View style={styles.section}>
          <AppText variant="caption" muted style={styles.sectionLabel}>VCARD PREVIEW</AppText>
          <View style={styles.vCardPreview}>
            <AppText style={styles.vCardText}>{vCard}</AppText>
          </View>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  previewCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 20,
    gap: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarInitial: { fontSize: 22, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 18, fontWeight: '700', color: C.text },
  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  contactDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { gap: 12, marginBottom: 28 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
  },
  secondaryBtnText: { color: C.text, fontWeight: '600', fontSize: 16 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  vCardPreview: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  vCardText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: C.muted,
    lineHeight: 20,
  },
});

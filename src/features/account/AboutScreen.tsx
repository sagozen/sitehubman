import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#799A85',
} as const;

const APP_VERSION = '1.0.0';

interface LinkRow {
  label: string;
  url?: string;
  route?: string;
}

const LINKS: LinkRow[] = [
  { label: 'Terms of Service', url: 'https://sitehubman.com/terms' },
  { label: 'Privacy Policy', url: 'https://sitehubman.com/privacy' },
  { label: 'Open Source Licenses', url: 'https://sitehubman.com/licenses' },
];

export default function AboutScreen() {
  const router = useRouter();

  const handleLink = useCallback((row: LinkRow) => {
    HapticTap.light();
    if (row.url) {
      Linking.openURL(row.url).catch(() => null);
    } else if (row.route) {
      router.push(row.route as any);
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={C.text} />
        </Pressable>
        <AppText variant="title3" style={styles.headerTitle}>About</AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        {/* App Identity */}
        <View style={styles.identity}>
          <View style={styles.logoWrap}>
            <AppIcon name="Nfc" size={64} color={C.accent} />
          </View>
          <AppText style={styles.appName}>SiteHubMan</AppText>
          <AppText variant="caption" muted>Version {APP_VERSION}</AppText>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <AppText variant="caption" muted style={styles.sectionLabel}>LEGAL</AppText>
          <View style={styles.card}>
            {LINKS.map((row, idx) => (
              <React.Fragment key={row.label}>
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => handleLink(row)}
                  hitSlop={4}
                >
                  <AppText variant="body" style={styles.rowLabel}>{row.label}</AppText>
                  <AppIcon name="ExternalLink" size={15} color={C.muted} />
                </Pressable>
                {idx < LINKS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AppText variant="caption" muted style={styles.footerText}>Made with care</AppText>
          <AppText variant="caption" muted style={styles.footerSub}>
            © {new Date().getFullYear()} SiteHubMan. All rights reserved.
          </AppText>
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
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 130 },
  identity: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.2,
  },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowLabel: { color: C.text, fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 16 },
  footer: { alignItems: 'center', gap: 4, paddingTop: 24 },
  footerText: { fontSize: 13, color: C.muted },
  footerSub: { fontSize: 12, color: 'rgba(154,154,160,0.6)' },
});

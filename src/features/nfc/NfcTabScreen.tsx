/**
 * NfcTabScreen — 04 NFC Management
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 */
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceSoft: '#141418',
  hairline: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#2596BE',
  cardBg: '#0B0B0E',
} as const;

const NFC_ACTIONS = [
  {
    label: 'Connect NFC Card',
    subtitle: 'Pair a new physical card',
    icon: 'Radio',
    route: '/nfc/connect',
  },
  {
    label: 'Write to NFC',
    subtitle: 'Update data on your physical chip',
    icon: 'UploadCloud',
    route: '/nfc/write',
  },
  {
    label: 'Direct Mode & Lock',
    subtitle: 'Instant routing & chip write lock',
    icon: 'Lock',
    route: '/nfc/direct-mode',
  },
  {
    label: 'Test NFC Card',
    subtitle: 'Verify antenna and profile URL',
    icon: 'CheckCircle',
    route: '/nfc/test',
  },
  {
    label: 'Troubleshoot NFC',
    subtitle: 'Recovery and read/write guide',
    icon: 'HelpCircle',
    route: '/nfc/error',
  },
] as const;

export default function NfcTabScreen() {
  const handleAction = useCallback((route: string) => {
    HapticTap.medium();
    router.push(route as never);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.headerTitle} weight="bold">
            NFC Devices
          </AppText>
          <AppText style={styles.headerSubtitle}>
            Physical cards paired to your profile
          </AppText>
        </View>

        {/* Physical Device Card — Apple Wallet Minimalist */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceCardTop}>
            <AppText style={styles.cardBadge}>NFC CARD #1</AppText>
            <AppText style={styles.statusText}>CONNECTED</AppText>
          </View>

          <View style={styles.deviceCardBody}>
            <AppText style={styles.cardName} weight="bold">
              Matte Black Metal
            </AppText>
            <AppText style={styles.cardSubtitle}>
              NTAG216 · 888 Bytes
            </AppText>
          </View>

          <View style={styles.deviceCardBottom}>
            <AppText style={styles.cardSerial}>ID: 04:A2:8B:1F:7C:90</AppText>
            <View style={styles.activeDot} />
          </View>
        </View>

        {/* Action List — Clean iOS Inset Grouped Table */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionLabel}>
            Actions
          </AppText>
        </View>

        <View style={styles.actionList}>
          {NFC_ACTIONS.map((action, index) => (
            <React.Fragment key={action.label}>
              <Pressable
                onPress={() => handleAction(action.route)}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}
              >
                <View style={styles.actionInfo}>
                  <AppText style={styles.actionLabel} weight="medium">
                    {action.label}
                  </AppText>
                  <AppText style={styles.actionSubtitle}>
                    {action.subtitle}
                  </AppText>
                </View>
                <AppIcon name="ChevronRight" size={16} color={C.textMuted} />
              </Pressable>
              {index < NFC_ACTIONS.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 14,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 3,
  },
  deviceCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 22,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardBadge: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: C.textMuted,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.textSecondary,
    fontWeight: '700',
  },
  deviceCardBody: {
    marginBottom: 20,
    gap: 4,
  },
  cardName: {
    fontSize: 22,
    letterSpacing: -0.4,
    color: C.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: C.textMuted,
  },
  deviceCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSerial: {
    fontSize: 11,
    color: C.textMuted,
    fontVariant: ['tabular-nums'],
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    color: C.textMuted,
    letterSpacing: 0.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionList: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  actionRowPressed: {
    backgroundColor: C.surfaceSoft,
  },
  actionInfo: {
    flex: 1,
    gap: 3,
  },
  actionLabel: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: C.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: C.hairline,
    marginLeft: 18,
  },
});

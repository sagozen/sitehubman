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

const NFC_ACTIONS = [
  {
    label: 'Connect NFC Card',
    subtitle: 'Pair a new physical NFC card',
    icon: 'Nfc',
    route: '/nfc/connect',
  },
  {
    label: 'Write to NFC',
    subtitle: 'Update card data on your NFC chip',
    icon: 'Send',
    route: '/nfc/write',
  },
  {
    label: 'Direct Mode & Lock',
    subtitle: 'Instant app routing & chip write protection',
    icon: 'Lock',
    route: '/nfc/direct-mode',
  },
  {
    label: 'Test NFC Card',
    subtitle: 'Verify your card is working correctly',
    icon: 'BadgeCheck',
    route: '/nfc/test',
  },
  {
    label: 'Troubleshoot NFC',
    subtitle: 'Write failure recovery & tips',
    icon: 'AlertTriangle',
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
          <AppText style={styles.headerTitle}>NFC Cards</AppText>
        </View>

        {/* Device Card */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceCardInner}>
            <View style={styles.deviceCardTop}>
              <AppText style={styles.cardId}>NFC CARD #1</AppText>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <AppText style={styles.statusText}>Connected</AppText>
              </View>
            </View>
            <AppText style={styles.cardName}>sitehubman</AppText>
            <View style={styles.nfcIconWrap}>
              <AppIcon name="Nfc" size={32} color="rgba(37,150,190,0.6)" />
            </View>
          </View>
        </View>

        {/* Action Rows */}
        <AppText style={styles.sectionLabel}>Actions</AppText>
        <View style={styles.actionList}>
          {NFC_ACTIONS.map((action, index) => (
            <Pressable
              key={action.label}
              onPress={() => handleAction(action.route)}
              style={({ pressed }) => [
                styles.actionRow,
                index < NFC_ACTIONS.length - 1 && styles.actionRowBorder,
                pressed && styles.actionRowPressed,
              ]}
            >
              <View style={styles.actionIconWrap}>
                <AppIcon name={action.icon} size={22} color="#2596BE" />
              </View>
              <View style={styles.actionInfo}>
                <AppText style={styles.actionLabel}>{action.label}</AppText>
                <AppText style={styles.actionSubtitle}>{action.subtitle}</AppText>
              </View>
              <AppIcon name="ChevronRight" size={18} color="#9A9AA0" />
            </Pressable>
          ))}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F7',
    letterSpacing: -0.5,
  },
  deviceCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2596BE',
    overflow: 'hidden',
    backgroundColor: '#111114',
    marginBottom: 28,
  },
  deviceCardInner: {
    padding: 24,
    gap: 8,
  },
  deviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: '#9A9AA0',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158',
  },
  statusText: {
    fontSize: 12,
    color: '#30D158',
    fontWeight: '500',
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F7',
    letterSpacing: -0.3,
  },
  nfcIconWrap: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#9A9AA0',
    letterSpacing: 0.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  actionList: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  actionRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(37,150,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F5F5F7',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#9A9AA0',
  },
});

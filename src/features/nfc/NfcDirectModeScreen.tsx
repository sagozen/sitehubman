/**
 * NfcDirectModeScreen — 27 NFC Direct Mode & Chip Lock (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 27 — Direct Mode Routing & Hardware Protection
 * - Direct routing toggle (Instagram, WhatsApp, LinkedIn, Website, Digital Profile)
 * - Chip Write-Lock toggle
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  warning: '#FF9F0A',
  success: '#34C759',
} as const;

type RouteOption = {
  id: string;
  name: string;
  sub: string;
  icon: string;
};

const ROUTE_OPTIONS: RouteOption[] = [
  { id: 'profile', name: 'Digital Profile (Default)', sub: 'Opens your full multi-link landing page', icon: 'globe' },
  { id: 'whatsapp', name: 'Direct WhatsApp', sub: 'Opens chat directly: +1 (555) 234-5678', icon: 'message-circle' },
  { id: 'linkedin', name: 'LinkedIn Profile', sub: 'Opens linkedin.com/in/thean', icon: 'user' },
  { id: 'website', name: 'Company Website', sub: 'Opens your primary business domain', icon: 'external-link' },
  { id: 'contact', name: 'Instant vCard Download', sub: 'Prompts receiver to save contact immediately', icon: 'download' },
];

export default function NfcDirectModeScreen() {
  const [directModeEnabled, setDirectModeEnabled] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('profile');
  const [chipLocked, setChipLocked] = useState(false);

  const handleToggleDirect = useCallback((val: boolean) => {
    HapticTap.medium();
    setDirectModeEnabled(val);
  }, []);

  const handleToggleLock = useCallback((val: boolean) => {
    HapticTap.heavy();
    if (val) {
      Alert.alert(
        'Lock NFC Chip?',
        'Hardware locking protects your physical card from unauthorized reprogramming by strangers. You can unlock it anytime using this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Lock',
            onPress: () => {
              setChipLocked(true);
              HapticTap.success();
            },
          },
        ]
      );
    } else {
      setChipLocked(false);
    }
  }, []);

  const handleSave = useCallback(() => {
    HapticTap.confidentClick();
    Alert.alert('Routing Updated', 'Please tap your physical card to apply the new NFC configuration.', [
      {
        text: 'Program Card',
        onPress: () => router.push('/nfc/write' as any),
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <AppIcon name="ChevronLeft" size={24} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="bold">
          Direct Mode & Lock
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Toggle Direct Mode */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <AppText style={styles.rowTitle} weight="bold">
                Direct Mode
              </AppText>
              <AppText style={styles.rowSub}>
                Bypass profile view and instantly launch a specific destination when tapped.
              </AppText>
            </View>
            <Switch
              value={directModeEnabled}
              onValueChange={handleToggleDirect}
              trackColor={{ false: '#3A3A3C', true: C.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Destination List */}
        <View style={[styles.card, !directModeEnabled && { opacity: 0.4 }]}>
          <AppText style={styles.cardHeader} weight="bold">
            Instant Destination
          </AppText>

          {ROUTE_OPTIONS.map((opt, idx) => {
            const isSelected = selectedRoute === opt.id;
            return (
              <Pressable
                key={opt.id}
                disabled={!directModeEnabled}
                style={[
                  styles.optionRow,
                  idx !== ROUTE_OPTIONS.length - 1 && styles.borderBottom,
                ]}
                onPress={() => {
                  HapticTap.light();
                  setSelectedRoute(opt.id);
                }}
              >
                <View style={[styles.iconWrap, isSelected && { backgroundColor: C.accent }]}>
                  <AppIcon name={opt.icon} size={18} color={isSelected ? '#FFFFFF' : C.textSecondary} />
                </View>
                <View style={styles.optionContent}>
                  <AppText style={styles.optionName} weight={isSelected ? 'bold' : 'regular'}>
                    {opt.name}
                  </AppText>
                  <AppText style={styles.optionSub}>{opt.sub}</AppText>
                </View>
                {isSelected && (
                  <AppIcon name="Check" size={18} color={C.accent} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Hardware Chip Lock */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <View style={styles.lockRow}>
                <AppText style={styles.rowTitle} weight="bold">
                  Write Protection Lock
                </AppText>
                {chipLocked && (
                  <View style={styles.lockedBadge}>
                    <AppText style={styles.lockedText}>PROTECTED</AppText>
                  </View>
                )}
              </View>
              <AppText style={styles.rowSub}>
                Password-protects the physical NTAG216 chip against being overwritten by external NFC tools.
              </AppText>
            </View>
            <Switch
              value={chipLocked}
              onValueChange={handleToggleLock}
              trackColor={{ false: '#3A3A3C', true: C.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Save & Apply */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          onPress={handleSave}
        >
          <AppText style={styles.saveBtnText} weight="bold">
            Apply to Card
          </AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    fontSize: 14,
    color: C.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedText: {
    fontSize: 9,
    color: C.success,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rowTitle: {
    fontSize: 16,
    color: C.text,
  },
  rowSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    color: C.text,
  },
  optionSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  saveBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

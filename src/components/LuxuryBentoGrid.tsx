/**
 * LuxuryBentoGrid.tsx — Barclays Financial Seals Edition.
 *
 * Replaces generic tiles with high-precision 48px circular action seals
 * aligned to strict 8pt grid tokens.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface LuxuryBentoGridProps {
  onPressBeam: () => void;
  onPressWallet: () => void;
  onPressLeads: () => void;
  onPressStudio: () => void;
  leadsCount?: number;
}

export function LuxuryBentoGrid({
  onPressBeam,
  onPressWallet,
  onPressLeads,
  onPressStudio,
  leadsCount = 3,
}: LuxuryBentoGridProps) {
  return (
    <View style={styles.grid}>
      {/* 48px Circular Action Row (Barclays Style) */}
      <View style={styles.actionRowCard}>
        <AppText style={styles.actionRowLabel} weight="bold">EXECUTIVE TOOLKIT</AppText>

        <View style={styles.actionItemsRow}>
          {/* Action 1: ⚡ Beam / Radar */}
          <Pressable
            onPress={() => {
              HapticTap.medium();
              onPressBeam();
            }}
            style={({ pressed }) => [styles.actionSealWrap, pressed && styles.pressed]}
          >
            <View style={[styles.actionSealCircle, styles.actionSealBeam]}>
              <AppIcon name="Nfc" size={20} color="#000000" />
            </View>
            <AppText style={styles.actionSealText} weight="bold">NFC Radar</AppText>
            <AppText style={styles.actionSealSub}>NameDrop</AppText>
          </Pressable>

          {/* Action 2: 💳 Apple Wallet */}
          <Pressable
            onPress={() => {
              HapticTap.medium();
              onPressWallet();
            }}
            style={({ pressed }) => [styles.actionSealWrap, pressed && styles.pressed]}
          >
            <View style={styles.actionSealCircle}>
              <AppIcon name="CreditCard" size={20} color="#FFFFFF" />
            </View>
            <AppText style={styles.actionSealText} weight="bold">PassKit</AppText>
            <AppText style={styles.actionSealSub}>Apple Wallet</AppText>
          </Pressable>

          {/* Action 3: 👥 CRM Vault */}
          <Pressable
            onPress={() => {
              HapticTap.medium();
              onPressLeads();
            }}
            style={({ pressed }) => [styles.actionSealWrap, pressed && styles.pressed]}
          >
            <View style={styles.actionSealCircle}>
              <AppIcon name="Users" size={20} color="#FFFFFF" />
              {leadsCount > 0 && (
                <View style={styles.sealBadge}>
                  <AppText style={styles.sealBadgeText} weight="extrabold">+{leadsCount}</AppText>
                </View>
              )}
            </View>
            <AppText style={styles.actionSealText} weight="bold">CRM Vault</AppText>
            <AppText style={styles.actionSealSub}>Leads ({leadsCount})</AppText>
          </Pressable>

          {/* Action 4: 🎨 Card Studio */}
          <Pressable
            onPress={() => {
              HapticTap.medium();
              onPressStudio();
            }}
            style={({ pressed }) => [styles.actionSealWrap, pressed && styles.pressed]}
          >
            <View style={styles.actionSealCircle}>
              <AppIcon name="Sparkles" size={20} color="#FFD60A" />
            </View>
            <AppText style={styles.actionSealText} weight="bold">Card Studio</AppText>
            <AppText style={styles.actionSealSub}>24K Metal</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  actionRowCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 16,
    gap: 14,
  },
  actionRowLabel: {
    color: '#808080',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  actionItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionSealWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  actionSealCircle: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionSealBeam: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sealBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1DB954',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  sealBadgeText: {
    color: '#000000',
    fontSize: 9,
  },
  actionSealText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  actionSealSub: {
    color: '#808080',
    fontSize: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

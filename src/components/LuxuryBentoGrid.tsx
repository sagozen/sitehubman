/**
 * LuxuryBentoGrid.tsx
 *
 * 2x2 High-Contrast Tactile Bento Grid for AVIO Executive Workspace.
 * Replaces vertical banner clutter with dense, interactive luxury modules.
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
      {/* Row 1: Beam Mode & Apple Wallet Pass */}
      <View style={styles.row}>
        {/* Tile 1: ⚡ NameDrop Beam */}
        <Pressable
          onPress={() => {
            HapticTap.medium();
            onPressBeam();
          }}
          style={({ pressed }) => [styles.tile, styles.tileBeam, pressed && styles.pressed]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.iconCircleBeam}>
              <AppIcon name="Nfc" size={17} color="#000000" />
            </View>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <AppText style={styles.liveTagText} weight="extrabold">BEAM</AppText>
            </View>
          </View>
          <View style={styles.tileMeta}>
            <AppText style={styles.tileTitle} weight="extrabold">NFC Radar</AppText>
            <AppText style={styles.tileSub}>NameDrop Mode →</AppText>
          </View>
        </Pressable>

        {/* Tile 2: 💳 Apple Wallet Pass */}
        <Pressable
          onPress={() => {
            HapticTap.medium();
            onPressWallet();
          }}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.iconCircle}>
              <AppIcon name="CreditCard" size={17} color="#FFFFFF" />
            </View>
            <AppText style={styles.passKitTag} weight="bold">PASSKIT</AppText>
          </View>
          <View style={styles.tileMeta}>
            <AppText style={styles.tileTitle} weight="extrabold">Apple Wallet</AppText>
            <AppText style={styles.tileSub}>Offline Pass →</AppText>
          </View>
        </Pressable>
      </View>

      {/* Row 2: CRM Leads & Card Studio */}
      <View style={styles.row}>
        {/* Tile 3: 👥 CRM Leads with Avatar Stack */}
        <Pressable
          onPress={() => {
            HapticTap.medium();
            onPressLeads();
          }}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.avatarStack}>
              <View style={[styles.miniAvatar, { backgroundColor: '#FF512F', zIndex: 3 }]}>
                <AppText style={styles.avatarLetter}>S</AppText>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#4776E6', marginLeft: -8, zIndex: 2 }]}>
                <AppText style={styles.avatarLetter}>J</AppText>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#11998E', marginLeft: -8, zIndex: 1 }]}>
                <AppText style={styles.avatarLetter}>M</AppText>
              </View>
            </View>
            <View style={styles.countBadge}>
              <AppText style={styles.countBadgeText} weight="bold">+{leadsCount}</AppText>
            </View>
          </View>
          <View style={styles.tileMeta}>
            <AppText style={styles.tileTitle} weight="extrabold">CRM Network</AppText>
            <AppText style={styles.tileSub}>View Leads →</AppText>
          </View>
        </Pressable>

        {/* Tile 4: 🎨 Card Studio */}
        <Pressable
          onPress={() => {
            HapticTap.medium();
            onPressStudio();
          }}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.iconCircle}>
              <AppIcon name="Sparkles" size={17} color="#FFD60A" />
            </View>
            <View style={styles.chipPill}>
              <AppText style={styles.chipPillText} weight="extrabold">24K / METAL</AppText>
            </View>
          </View>
          <View style={styles.tileMeta}>
            <AppText style={styles.tileTitle} weight="extrabold">Card Studio</AppText>
            <AppText style={styles.tileSub}>Customize →</AppText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: '#111114',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 110,
    gap: 12,
  },
  tileBeam: {
    backgroundColor: '#141418',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconCircleBeam: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#30D158',
  },
  liveTagText: {
    color: '#30D158',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  passKitTag: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  chipPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
  },
  chipPillText: {
    color: '#FFD60A',
    fontSize: 8,
    letterSpacing: 0.6,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#111114',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countBadgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  tileMeta: {
    gap: 2,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  tileSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});

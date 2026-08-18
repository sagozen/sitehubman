/**
 * TestTapSimulatorCard.tsx
 *
 * Interactive Test-Drive Simulator for Day-1 Users.
 * Provides instant tactile feedback, haptics, and simulated lead generation.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';

interface TestTapSimulatorCardProps {
  onSimulateTap: () => void;
}

export function TestTapSimulatorCard({ onSimulateTap }: TestTapSimulatorCardProps) {
  const [simulating, setSimulating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleTestTap = () => {
    if (simulating || completed) return;
    HapticTap.heavy();
    setSimulating(true);

    setTimeout(() => {
      HapticPattern.tapSuccess();
      setSimulating(false);
      setCompleted(true);
      onSimulateTap();
    }, 1200);
  };

  return (
    <Pressable
      onPress={handleTestTap}
      style={({ pressed }) => [
        styles.card,
        completed ? styles.cardCompleted : styles.cardActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconCircle}>
        {simulating ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : completed ? (
          <AppIcon name="CircleCheck" size={20} color="#30D158" />
        ) : (
          <AppIcon name="Nfc" size={20} color="#000000" />
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.badgeRow}>
          <AppText style={styles.questBadge} weight="extrabold">
            {completed ? 'QUEST COMPLETED ✅' : 'NEW MEMBER QUEST ⚡'}
          </AppText>
        </View>
        <AppText style={styles.title} weight="extrabold">
          {completed ? 'First Tap Verified!' : 'Test-Drive Your Smart Pass'}
        </AppText>
        <AppText style={styles.subtitle}>
          {completed
            ? 'Your card is active and ready to beam at events.'
            : 'Tap here to simulate your first live NFC connection.'}
        </AppText>
      </View>

      {!completed && !simulating && (
        <View style={styles.tapPrompt}>
          <AppText style={styles.tapPromptText} weight="bold">
            TAP
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  cardActive: {
    backgroundColor: '#1C1910',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cardCompleted: {
    backgroundColor: '#111813',
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  questBadge: {
    color: '#F59E0B',
    fontSize: 10,
    letterSpacing: 1.1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  tapPrompt: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  tapPromptText: {
    color: '#000000',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.8,
  },
});

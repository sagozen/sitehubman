/**
 * DailyNetworkingPrompt.tsx
 *
 * Daily Dynamic Executive Networking Focus & Micro-Prompt.
 * Keeps the home screen fresh every day by offering an actionable networking objective.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

const DAILY_PROMPTS = [
  {
    tag: "TODAY'S NETWORKING GOAL",
    title: 'Exchange contacts with 1 new founder or executive',
    tip: 'Use your NFC Beam mode to leave a memorable impression in 5 seconds.',
    icon: 'Target' as const,
    accent: '#FFD60A',
  },
  {
    tag: 'FOLLOW-UP REMINDER',
    title: 'Follow up with your recent connections within 24h',
    tip: 'Connections convert 3x higher when followed up on the same day.',
    icon: 'Sparkles' as const,
    accent: '#30D158',
  },
  {
    tag: 'AVIO STATUS TIP',
    title: 'Unlock 24K Heritage Gold tier at 25 connections',
    tip: 'Share your vanity link or add your pass to Apple Wallet to accelerate.',
    icon: 'Award' as const,
    accent: '#0A84FF',
  },
];

export function DailyNetworkingPrompt({ onPress }: { onPress?: () => void }) {
  // Rotate based on day of month
  const dayIndex = new Date().getDate() % DAILY_PROMPTS.length;
  const prompt = DAILY_PROMPTS[dayIndex];

  return (
    <Pressable
      onPress={() => {
        HapticTap.light();
        onPress?.();
      }}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.leftBar} />
      <View style={styles.content}>
        <View style={styles.tagRow}>
          <AppIcon name={prompt.icon} size={13} color={prompt.accent} />
          <AppText style={[styles.tagText, { color: prompt.accent }]} weight="extrabold">
            {prompt.tag}
          </AppText>
        </View>
        <AppText style={styles.title} weight="bold">
          {prompt.title}
        </AppText>
        <AppText style={styles.tip}>
          {prompt.tip}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  leftBar: {
    width: 4,
    backgroundColor: '#FFD60A',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 9,
    letterSpacing: 1.1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  tip: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});

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
  const [completed, setCompleted] = React.useState<boolean>(false);

  // Rotate based on day of month
  const dayIndex = new Date().getDate() % DAILY_PROMPTS.length;
  const prompt = DAILY_PROMPTS[dayIndex];

  const handleToggleDone = () => {
    if (!completed) {
      HapticTap.success();
      setCompleted(true);
    } else {
      HapticTap.selection();
      setCompleted(false);
    }
  };

  return (
    <View style={[styles.container, completed && styles.containerCompleted]}>
      <View style={[styles.leftBar, { backgroundColor: completed ? '#30D158' : prompt.accent }]} />
      <View style={styles.content}>
        <View style={styles.tagRow}>
          <View style={styles.tagLeft}>
            <AppIcon
              name={completed ? 'CheckCircle2' : prompt.icon}
              size={13}
              color={completed ? '#30D158' : prompt.accent}
            />
            <AppText
              style={[styles.tagText, { color: completed ? '#30D158' : prompt.accent }]}
              weight="extrabold"
            >
              {completed ? 'GOAL COMPLETED • +50 PTS' : prompt.tag}
            </AppText>
          </View>

          <Pressable
            onPress={handleToggleDone}
            style={({ pressed }) => [
              styles.checkBtn,
              completed && styles.checkBtnCompleted,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
          >
            <AppIcon
              name={completed ? 'Check' : 'Circle'}
              size={14}
              color={completed ? '#000000' : 'rgba(255, 255, 255, 0.4)'}
            />
          </Pressable>
        </View>

        <AppText
          style={[styles.title, completed && styles.titleCompleted]}
          weight="bold"
        >
          {prompt.title}
        </AppText>
        <AppText style={styles.tip}>
          {completed ? 'Great work! Keep your momentum going today.' : prompt.tip}
        </AppText>
      </View>
    </View>
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
  containerCompleted: {
    borderColor: 'rgba(48, 209, 88, 0.3)',
    backgroundColor: 'rgba(48, 209, 88, 0.04)',
  },
  leftBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  checkBtnCompleted: {
    backgroundColor: '#30D158',
    borderColor: '#30D158',
  },
  tagText: {
    fontSize: 9,
    letterSpacing: 1.1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  titleCompleted: {
    color: 'rgba(255, 255, 255, 0.65)',
    textDecorationLine: 'line-through',
  },
  tip: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    lineHeight: 16,
  },
});

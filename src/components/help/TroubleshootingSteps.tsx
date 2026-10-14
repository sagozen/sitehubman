import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

// ─── Design tokens (inline for locality) ────────────────────────────────────
const CANVAS = '#0D0D0E';
const SURFACE = '#242424';
const ACCENT = '#799A85';
const TEXT = '#F5F5F7';
const MUTED = '#A1A1AA';

interface TroubleshootStep {
  icon: string;
  title: string;
  description: string;
}

const STEPS: TroubleshootStep[] = [
  {
    icon: 'unlock',
    title: 'Unlock your phone',
    description: 'NFC requires the screen to be unlocked and NFC enabled',
  },
  {
    icon: 'shield-off',
    title: 'Remove case or cover',
    description: 'Thick cases block the NFC signal. Try without it',
  },
  {
    icon: 'clock',
    title: 'Hold still for 2 seconds',
    description: 'Keep devices touching briefly until you feel the vibration',
  },
  {
    icon: 'wifi',
    title: 'Check NFC is enabled',
    description: 'Settings > NFC > Enable. Then retry the tap',
  },
];

/**
 * TroubleshootingSteps
 *
 * Renders a vertical numbered step-list for NFC troubleshooting.
 * Each step has a circle number badge, feather icon, title, and description.
 */
export const TroubleshootingSteps: React.FC = () => {
  return (
    <View style={styles.wrapper}>
      {STEPS.map((step, index) => {
        const isLast = index === STEPS.length - 1;
        return (
          <View key={step.title} style={styles.row}>
            {/* Left column: badge + connector line */}
            <View style={styles.leftCol}>
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{index + 1}</AppText>
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>

            {/* Right column: card content */}
            <View style={[styles.card, isLast && { marginBottom: 0 }]}>
              <View style={styles.iconCircle}>
                <AppIcon name={step.icon} size={18} color={ACCENT} />
              </View>
              <View style={styles.textBlock}>
                <AppText style={styles.stepTitle}>{step.title}</AppText>
                <AppText style={styles.stepDesc}>{step.description}</AppText>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  leftCol: {
    alignItems: 'center',
    width: 32,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D0D0E',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: 'rgba(121,154,133,0.25)',
    marginVertical: 4,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(121,154,133,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
  },
  stepDesc: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
  },
});

export default TroubleshootingSteps;

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import IosScrollView from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const ACCENT = '#2596BE';
const SURFACE = '#111114';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA0';

interface Step {
  label: string;
  date: string;
  status: 'done' | 'current' | 'upcoming';
}

const STEPS: Step[] = [
  { label: 'Ordered',          date: 'Oct 1, 2026 · 09:14 AM', status: 'done'     },
  { label: 'Design Approved',  date: 'Oct 1, 2026 · 11:30 AM', status: 'done'     },
  { label: 'Production',       date: 'Oct 2, 2026 · 02:00 PM', status: 'current'  },
  { label: 'NFC Programmed',   date: 'Pending',                 status: 'upcoming' },
  { label: 'Quality Check',    date: 'Pending',                 status: 'upcoming' },
  { label: 'Shipped',          date: 'Pending',                 status: 'upcoming' },
  { label: 'Delivered',        date: 'Pending',                 status: 'upcoming' },
];

function PulsingDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.dot, styles.dotCurrent, { transform: [{ scale: pulse }] }]}>
      <View style={styles.dotCurrentInner} />
    </Animated.View>
  );
}

function TimelineStep({ step, isLast }: { step: Step; isLast: boolean }) {
  const isDone = step.status === 'done';
  const isCurrent = step.status === 'current';

  return (
    <View style={styles.stepRow}>
      {/* Left column: dot + line */}
      <View style={styles.stepLeft}>
        {isCurrent ? (
          <PulsingDot />
        ) : (
          <View
            style={[
              styles.dot,
              isDone ? styles.dotDone : styles.dotUpcoming,
            ]}
          >
            {isDone && <AppIcon name="check" size={10} color="#FFFFFF" />}
          </View>
        )}
        {!isLast && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
      </View>

      {/* Right column: text */}
      <View style={styles.stepContent}>
        <AppText style={[styles.stepLabel, !isDone && !isCurrent && styles.stepLabelMuted]}>
          {step.label}
        </AppText>
        <AppText style={[styles.stepDate, isCurrent && styles.stepDateAccent]}>
          {step.date}
        </AppText>
      </View>
    </View>
  );
}

export default function ProductionTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => { HapticTap.light(); router.back(); }}
            hitSlop={12}
          >
            <AppIcon name="arrow-left" size={20} color={TEXT} />
          </Pressable>
          <View style={styles.headerText}>
            <AppText style={styles.headerTitle}>Order #{orderId ?? '10042'}</AppText>
            <AppText style={styles.headerSub}>Production Tracking</AppText>
          </View>
        </View>

        {/* Status summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <AppIcon name="package" size={24} color={ACCENT} />
          </View>
          <View style={styles.summaryText}>
            <AppText style={styles.summaryTitle}>In Production</AppText>
            <AppText style={styles.summarySubtitle}>Est. ready in 2–3 business days</AppText>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          {STEPS.map((step, idx) => (
            <TimelineStep key={step.label} step={step} isLast={idx === STEPS.length - 1} />
          ))}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <AppIcon name="info" size={16} color={MUTED} />
          <AppText style={styles.infoText}>
            You'll receive a push notification when your card ships. Tracking info will appear in Delivery Tracking.
          </AppText>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 130,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: MUTED,
  },
  summaryCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(37,150,190,0.25)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(37,150,190,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    gap: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  summarySubtitle: {
    fontSize: 13,
    color: MUTED,
  },
  timelineCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    minHeight: 52,
  },
  stepLeft: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: ACCENT,
  },
  dotCurrent: {
    backgroundColor: 'rgba(37,150,190,0.2)',
    borderWidth: 2,
    borderColor: ACCENT,
  },
  dotCurrentInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  dotUpcoming: {
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: 'transparent',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: BORDER,
    marginVertical: 4,
  },
  stepLineDone: {
    backgroundColor: ACCENT,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
    gap: 3,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  stepLabelMuted: {
    color: MUTED,
    fontWeight: '400',
  },
  stepDate: {
    fontSize: 12,
    color: MUTED,
  },
  stepDateAccent: {
    color: ACCENT,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
  },
});

import React from 'react';
import {
  View,
  StyleSheet,
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

type DeliveryStepStatus = 'done' | 'current' | 'upcoming';

interface DeliveryStep {
  label: string;
  status: DeliveryStepStatus;
}

const DELIVERY_STEPS: DeliveryStep[] = [
  { label: 'Shipped',           status: 'done'    },
  { label: 'Out for Delivery',  status: 'current' },
  { label: 'Delivered',         status: 'upcoming'},
];

function SimpleStepper({ steps }: { steps: DeliveryStep[] }) {
  return (
    <View style={styles.stepper}>
      {steps.map((step, idx) => {
        const isDone = step.status === 'done';
        const isCurrent = step.status === 'current';
        const isLast = idx === steps.length - 1;

        return (
          <View key={step.label} style={styles.stepperItem}>
            <View style={styles.stepperDotCol}>
              <View
                style={[
                  styles.stepperDot,
                  isDone && styles.stepperDotDone,
                  isCurrent && styles.stepperDotCurrent,
                ]}
              >
                {isDone && <AppIcon name="check" size={10} color="#FFFFFF" />}
                {isCurrent && <View style={styles.stepperDotInner} />}
              </View>
              {!isLast && (
                <View style={[styles.stepperConnector, isDone && styles.stepperConnectorDone]} />
              )}
            </View>
            <View style={styles.stepperLabel}>
              <AppText
                style={[
                  styles.stepperText,
                  isCurrent && styles.stepperTextCurrent,
                  step.status === 'upcoming' && styles.stepperTextMuted,
                ]}
              >
                {step.label}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function DeliveryTrackingScreen() {
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
            <AppText style={styles.headerTitle}>Delivery Tracking</AppText>
            <AppText style={styles.headerSub}>Order #{orderId ?? '10042'}</AppText>
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapIconWrap}>
            <AppIcon name="map" size={48} color={MUTED} />
            <AppText style={styles.mapLabel}>Live map coming soon</AppText>
          </View>
        </View>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusIndicator} />
          <AppText style={styles.statusText}>Out for delivery</AppText>
        </View>

        {/* Estimated Delivery */}
        <View style={styles.etaCard}>
          <AppIcon name="clock" size={20} color={ACCENT} />
          <View style={styles.etaText}>
            <AppText style={styles.etaLabel}>Estimated Delivery</AppText>
            <AppText style={styles.etaValue}>Today, 2:00 PM — 4:00 PM</AppText>
          </View>
        </View>

        {/* Carrier Row */}
        <View style={styles.carrierCard}>
          <View style={styles.carrierIconWrap}>
            <AppIcon name="truck" size={22} color={ACCENT} />
          </View>
          <View style={styles.carrierInfo}>
            <AppText style={styles.carrierName}>DHL Express</AppText>
            <AppText style={styles.carrierTracking}>1Z 999 AA1 01 2345 6784</AppText>
          </View>
          <Pressable
            style={styles.copyBtn}
            onPress={() => HapticTap.light()}
            hitSlop={8}
          >
            <AppIcon name="copy" size={16} color={MUTED} />
          </Pressable>
        </View>

        {/* Delivery Steps */}
        <View style={styles.stepsCard}>
          <AppText style={styles.stepsTitle}>Delivery Status</AppText>
          <SimpleStepper steps={DELIVERY_STEPS} />
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 16,
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
  mapPlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIconWrap: {
    alignItems: 'center',
    gap: 10,
  },
  mapLabel: {
    fontSize: 13,
    color: MUTED,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(37,150,190,0.1)',
    borderColor: 'rgba(37,150,190,0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACCENT,
  },
  etaCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  etaText: {
    gap: 3,
  },
  etaLabel: {
    fontSize: 12,
    color: MUTED,
  },
  etaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  carrierCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  carrierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: 'rgba(37,150,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carrierInfo: {
    flex: 1,
    gap: 3,
  },
  carrierName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  carrierTracking: {
    fontSize: 12,
    color: MUTED,
    fontFamily: 'monospace',
  },
  copyBtn: {
    padding: 6,
  },
  stepsCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepper: {
    gap: 0,
  },
  stepperItem: {
    flexDirection: 'row',
    gap: 14,
    minHeight: 44,
  },
  stepperDotCol: {
    alignItems: 'center',
    width: 20,
  },
  stepperDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDotDone: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  stepperDotCurrent: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(37,150,190,0.15)',
  },
  stepperDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  stepperConnector: {
    flex: 1,
    width: 2,
    backgroundColor: BORDER,
    marginVertical: 4,
  },
  stepperConnectorDone: {
    backgroundColor: ACCENT,
  },
  stepperLabel: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 18,
  },
  stepperText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
  },
  stepperTextCurrent: {
    color: ACCENT,
  },
  stepperTextMuted: {
    color: MUTED,
    fontWeight: '400',
  },
});

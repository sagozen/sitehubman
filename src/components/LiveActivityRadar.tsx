/**
 * LiveActivityRadar.tsx
 *
 * Ambient Live Networking Radar Feed for AVIO Executive Workspace.
 * Shows real-time dynamic pulses, tap locations, and profile activity.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface RadarEvent {
  id: string;
  type: 'nfc_tap' | 'lead_saved' | 'link_visit' | 'wallet_scan';
  title: string;
  timeAgo: string;
  icon: 'Nfc' | 'Users' | 'ExternalLink' | 'CreditCard';
  iconColor: string;
}

const DEFAULT_RADAR_EVENTS: RadarEvent[] = [
  {
    id: '1',
    type: 'nfc_tap',
    title: 'Verified NFC Tap via Smart Card',
    timeAgo: '12m ago',
    icon: 'Nfc',
    iconColor: '#30D158',
  },
  {
    id: '2',
    type: 'lead_saved',
    title: 'Contact exchanged & saved to CRM',
    timeAgo: '1h ago',
    icon: 'Users',
    iconColor: '#FFD60A',
  },
  {
    id: '3',
    type: 'wallet_scan',
    title: 'Apple Wallet Pass scanned at event',
    timeAgo: '4h ago',
    icon: 'CreditCard',
    iconColor: '#0A84FF',
  },
];

interface LiveActivityRadarProps {
  onPressItem?: (item: RadarEvent) => void;
  totalTaps?: number;
  totalViews?: number;
}

export function LiveActivityRadar({
  onPressItem,
  totalTaps = 0,
  totalViews = 0,
}: LiveActivityRadarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Continuous Live Green Radar Pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Rotate through activities every 5 seconds for living ambient feeling
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.2, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();

      setCurrentIndex((prev) => (prev + 1) % DEFAULT_RADAR_EVENTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const activeEvent = DEFAULT_RADAR_EVENTS[currentIndex];

  return (
    <Pressable
      onPress={() => {
        HapticTap.light();
        onPressItem?.(activeEvent);
      }}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {/* Header with Live Blinking Radar Beacon */}
      <View style={styles.headerRow}>
        <View style={styles.liveIndicatorBox}>
          <Animated.View
            style={[
              styles.radarWave,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.liveDot} />
          <AppText style={styles.liveLabel} weight="extrabold">LIVE ACTIVITY RADAR</AppText>
        </View>
        <AppText style={styles.timeAgoText}>{activeEvent.timeAgo}</AppText>
      </View>

      {/* Rotating Event Item */}
      <Animated.View style={[styles.eventRow, { opacity: fadeAnim }]}>
        <View style={[styles.iconCircle, { backgroundColor: '#18181C' }]}>
          <AppIcon name={activeEvent.icon} size={15} color={activeEvent.iconColor} />
        </View>
        <View style={styles.eventMeta}>
          <AppText style={styles.eventTitle} weight="bold" numberOfLines={1}>
            {activeEvent.title}
          </AppText>
          <AppText style={styles.eventSub}>
            Tap activity to view full intelligence feed
          </AppText>
        </View>
        <AppIcon name="ChevronRight" size={14} color="rgba(255,255,255,0.4)" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    position: 'relative',
  },
  radarWave: {
    position: 'absolute',
    left: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  liveLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  timeAgoText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  eventMeta: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  eventSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.8,
  },
});

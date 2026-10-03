import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import IosScrollView from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const ACCENT = '#2596BE';
const SURFACE = '#111114';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA0';

const BAR_DATA = [
  { day: 'Mon', value: 58 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 44 },
  { day: 'Thu', value: 88 },
  { day: 'Fri', value: 96 },
  { day: 'Sat', value: 36 },
  { day: 'Sun', value: 21 },
];

interface TapEvent {
  time: string;
  location: string;
}

const TAP_EVENTS: TapEvent[] = [
  { time: 'Today, 10:42 AM',  location: 'San Francisco, CA'   },
  { time: 'Today, 09:18 AM',  location: 'Oakland, CA'         },
  { time: 'Yesterday, 4:51 PM', location: 'New York, NY'      },
  { time: 'Yesterday, 11:22 AM', location: 'Los Angeles, CA'  },
  { time: 'Oct 1, 3:04 PM',   location: 'Chicago, IL'         },
  { time: 'Oct 1, 9:30 AM',   location: 'Miami, FL'           },
];

function BarChart() {
  const maxVal = Math.max(...BAR_DATA.map((d) => d.value));
  return (
    <View style={styles.barChart}>
      {BAR_DATA.map((d) => (
        <View key={d.day} style={styles.barColumn}>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { height: `${(d.value / maxVal) * 100}%` as any }]} />
          </View>
          <AppText style={styles.barLabel}>{d.day}</AppText>
        </View>
      ))}
    </View>
  );
}

export default function NfcAnalyticsScreen() {
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
          <AppText style={styles.headerTitle}>NFC Analytics</AppText>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <AppText style={styles.heroLabel}>Total NFC Taps</AppText>
          <AppText style={styles.heroValue}>326</AppText>
          <View style={styles.heroBadge}>
            <AppIcon name="trending-up" size={13} color="#34C759" />
            <AppText style={styles.heroBadgeText}>+24.1% this week</AppText>
          </View>
          <BarChart />
        </View>

        {/* Recent tap events */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionLabel}>Recent Tap Events</AppText>
        </View>
        <View style={styles.eventsCard}>
          {TAP_EVENTS.map((event, idx) => (
            <React.Fragment key={`${event.time}-${idx}`}>
              <View style={styles.eventRow}>
                <View style={styles.eventDot} />
                <View style={styles.eventText}>
                  <AppText style={styles.eventTime}>{event.time}</AppText>
                  <View style={styles.eventLocationRow}>
                    <AppIcon name="map-pin" size={11} color={MUTED} />
                    <AppText style={styles.eventLocation}>{event.location}</AppText>
                  </View>
                </View>
                <View style={styles.tapBadge}>
                  <AppIcon name="wifi" size={12} color={ACCENT} />
                  <AppText style={styles.tapBadgeText}>NFC</AppText>
                </View>
              </View>
              {idx < TAP_EVENTS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
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
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.3,
  },
  heroCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  heroLabel: {
    fontSize: 13,
    color: MUTED,
  },
  heroValue: {
    fontSize: 52,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -1.5,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52,199,89,0.1)',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  barChart: {
    flexDirection: 'row',
    height: 80,
    gap: 6,
    alignItems: 'flex-end',
    marginTop: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    height: 100,
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(37,150,190,0.08)',
  },
  bar: {
    width: '100%',
    backgroundColor: ACCENT,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: MUTED,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventsCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  eventText: {
    flex: 1,
    gap: 3,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: MUTED,
  },
  tapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37,150,190,0.1)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tapBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: ACCENT,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
});

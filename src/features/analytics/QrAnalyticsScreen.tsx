import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceRaised: '#141418',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: '#A1A1AA',
  textDim: '#52525B',
  accent: '#2596BE',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BAR_DATA = [6, 12, 9, 18, 14, 22, 10];
const MAX_BAR = Math.max(...BAR_DATA);

type RecentScan = {
  id: string;
  time: string;
  device: string;
  location: string;
};

const RECENT_SCANS: RecentScan[] = [
  { id: '1', time: '2 min ago', device: 'iPhone 15 Pro', location: 'San Francisco, US' },
  { id: '2', time: '18 min ago', device: 'Samsung Galaxy S24', location: 'London, UK' },
  { id: '3', time: '1h ago', device: 'iPhone 14', location: 'New York, US' },
  { id: '4', time: '3h ago', device: 'Pixel 8', location: 'Berlin, DE' },
  { id: '5', time: '5h ago', device: 'iPad Pro', location: 'Tokyo, JP' },
  { id: '6', time: '8h ago', device: 'iPhone 13', location: 'Paris, FR' },
  { id: '7', time: '12h ago', device: 'OnePlus 12', location: 'Dubai, UAE' },
];

export default function QrAnalyticsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => { HapticTap.light(); router.back(); }}
          style={styles.backBtn}
          hitSlop={8}
        >
          <AppIcon name="chevron-left" size={22} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle}>QR Analytics</AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <AppIcon name="maximize" size={20} color={C.accent} />
          <AppText style={styles.heroNumber}>48</AppText>
          <AppText style={styles.heroLabel}>QR Scans</AppText>
          {/* Trend — plain muted text, no colored badge */}
          <AppText style={styles.heroTrend}>↑ +12% vs last week</AppText>
        </View>

        {/* Bar Chart */}
        <AppText style={styles.sectionLabel}>LAST 7 DAYS</AppText>
        <View style={styles.chartCard}>
          <View style={styles.barsRow}>
            {BAR_DATA.map((val, i) => {
              const heightPct = (val / MAX_BAR) * 100;
              return (
                <View key={DAYS[i]} style={styles.barColumn}>
                  <AppText style={styles.barCount}>{val}</AppText>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%` as any },
                        i === 5 && { backgroundColor: C.accent },
                      ]}
                    />
                  </View>
                  <AppText style={styles.barDay}>{DAYS[i]}</AppText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Scans */}
        <AppText style={styles.sectionLabel}>RECENT SCANS</AppText>
        <View style={styles.group}>
          {RECENT_SCANS.map((scan, index) => (
            <View key={scan.id}>
              <View style={styles.scanRow}>
                {/* Plain icon — no colored bubble background */}
                <AppIcon name="smartphone" size={16} color={C.muted} />
                <View style={styles.scanText}>
                  <AppText style={styles.scanDevice}>{scan.device}</AppText>
                  <AppText style={styles.scanLocation}>{scan.location}</AppText>
                </View>
                <AppText style={styles.scanTime}>{scan.time}</AppText>
              </View>
              {index < RECENT_SCANS.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  heroCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderColor: C.border,
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 28,
    gap: 4,
  },
  heroNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -3,
    marginTop: 8,
  },
  heroLabel: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '500',
  },
  heroTrend: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  chartCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    padding: 20,
    marginBottom: 28,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barCount: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 4,
  },
  barTrack: {
    width: 20,
    height: 90,
    backgroundColor: C.surfaceRaised,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(37,150,190,0.45)',
    borderRadius: 6,
  },
  barDay: {
    fontSize: 10,
    color: C.muted,
    marginTop: 6,
  },
  group: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 28,
    overflow: 'hidden',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  scanText: { flex: 1 },
  scanDevice: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  scanLocation: {
    fontSize: 12,
    color: C.muted,
    marginTop: 1,
  },
  scanTime: {
    fontSize: 12,
    color: C.muted,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 28,
  },
});

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'rgba(255,255,255,0.09)',
  text: '#FFFFFF',
  muted: '#9A9AA0',
  accent: '#799A85',
};

type Metric = 'Views' | 'Taps' | 'Scans';

const METRICS: Metric[] = ['Views', 'Taps', 'Scans'];

type DayData = {
  date: string;
  views: number;
  taps: number;
  scans: number;
};

const TIMELINE: DayData[] = [
  { date: 'Sep 20', views: 148, taps: 42, scans: 18 },
  { date: 'Sep 21', views: 192, taps: 56, scans: 24 },
  { date: 'Sep 22', views: 97, taps: 31, scans: 11 },
  { date: 'Sep 23', views: 214, taps: 68, scans: 29 },
  { date: 'Sep 24', views: 176, taps: 51, scans: 21 },
  { date: 'Sep 25', views: 312, taps: 84, scans: 36 },
  { date: 'Sep 26', views: 258, taps: 73, scans: 31 },
  { date: 'Sep 27', views: 189, taps: 49, scans: 20 },
  { date: 'Sep 28', views: 421, taps: 112, scans: 48 },
  { date: 'Sep 29', views: 360, taps: 95, scans: 40 },
  { date: 'Sep 30', views: 275, taps: 77, scans: 33 },
  { date: 'Oct 1', views: 198, taps: 54, scans: 23 },
  { date: 'Oct 2', views: 344, taps: 88, scans: 37 },
  { date: 'Oct 3', views: 412, taps: 106, scans: 44 },
];

const HERO_MAP: Record<Metric, number> = {
  Views: 3596,
  Taps: 986,
  Scans: 415,
};

const getVal = (day: DayData, metric: Metric): number => {
  if (metric === 'Views') return day.views;
  if (metric === 'Taps') return day.taps;
  return day.scans;
};

export default function AnalyticsDetailScreen() {
  const [selected, setSelected] = useState<Metric>('Views');

  const maxVal = useMemo(
    () => Math.max(...TIMELINE.map((d) => getVal(d, selected))),
    [selected],
  );

  const handleMetric = useCallback((m: Metric) => {
    HapticTap.softConfirmation();
    setSelected(m);
  }, []);

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
        <AppText style={styles.headerTitle}>Detail</AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Selector */}
        <View style={styles.pillRow}>
          {METRICS.map((m) => (
            <Pressable
              key={m}
              onPress={() => handleMetric(m)}
              style={[styles.pill, selected === m && styles.pillActive]}
              hitSlop={4}
            >
              <AppText
                style={[styles.pillText, selected === m && styles.pillTextActive]}
              >
                {m}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Hero Number */}
        <View style={styles.heroCard}>
          <AppText style={styles.heroNumber}>
            {HERO_MAP[selected].toLocaleString()}
          </AppText>
          <AppText style={styles.heroLabel}>Total {selected}</AppText>
          <View style={styles.heroBadge}>
            <AppIcon name="trending-up" size={12} color="#30D158" />
            <AppText style={styles.heroBadgeText}>Last 14 days</AppText>
          </View>
        </View>

        {/* Timeline */}
        <AppText style={styles.sectionLabel}>DAILY BREAKDOWN</AppText>
        <View style={styles.timelineCard}>
          {TIMELINE.map((day, index) => {
            const val = getVal(day, selected);
            const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <View key={day.date}>
                <View style={styles.timelineRow}>
                  <AppText style={styles.timelineDate}>{day.date}</AppText>
                  <View style={styles.timelineBarTrack}>
                    <View
                      style={[
                        styles.timelineBarFill,
                        { width: `${barPct}%` as any },
                      ]}
                    />
                  </View>
                  <AppText style={styles.timelineCount}>{val}</AppText>
                </View>
                {index < TIMELINE.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
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
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 99,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  pillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  pillText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  },
  heroLabel: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '500',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    color: '#30D158',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  timelineCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  timelineDate: {
    fontSize: 13,
    color: C.muted,
    width: 52,
  },
  timelineBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.surfaceRaised,
    borderRadius: 99,
    overflow: 'hidden',
  },
  timelineBarFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 99,
  },
  timelineCount: {
    fontSize: 13,
    color: C.text,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
});

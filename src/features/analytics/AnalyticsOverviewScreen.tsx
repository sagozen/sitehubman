/**
 * AnalyticsOverviewScreen — Screen 5: Analytics ("Track your performance")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'transparent',
  text: '#FFFFFF',
  textSecondary: '#E4E4E7',
  textMuted: '#8E8E93',
  accent: '#799A85',
  emerald: '#799A85',
} as const;

const PERIODS = ['7D', '30D', '90D', '1Y'] as const;
type Period = typeof PERIODS[number];

const CHART_POINTS = [
  { day: 'Mon', views: 40 },
  { day: 'Tue', views: 75 },
  { day: 'Wed', views: 120 },
  { day: 'Thu', views: 190 },
  { day: 'Fri', views: 240 },
  { day: 'Sat', views: 180 },
  { day: 'Sun', views: 280 },
];

const SOURCES = [
  { name: 'NFC Tap', pct: 42, color: '#FFFFFF' },
  { name: 'QR Code', pct: 28, color: '#9A9AA0' },
  { name: 'Direct Link', pct: 18, color: '#9A9AA0' },
  { name: 'Other', pct: 12, color: '#3F3F46' },
];

export default function AnalyticsOverviewScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7D');
  const [activePointIndex, setActivePointIndex] = useState<number>(6); // Default Sunday

  const activePoint = CHART_POINTS[activePointIndex] || CHART_POINTS[CHART_POINTS.length - 1];
  const maxVal = Math.max(...CHART_POINTS.map((p) => p.views));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="chevron-left" size={20} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="bold">
          Analytics
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* Time Filter Pills */}
          <View style={styles.periodRow}>
            {PERIODS.map((period) => (
              <Pressable
                key={period}
                style={[
                  styles.periodPill,
                  selectedPeriod === period && styles.periodPillActive,
                ]}
                onPress={() => {
                  HapticTap.light();
                  setSelectedPeriod(period);
                }}
              >
                <AppText
                  style={[
                    styles.periodText,
                    selectedPeriod === period && styles.periodTextActive,
                  ]}
                  weight={selectedPeriod === period ? 'bold' : undefined}
                >
                  {period}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* Top 2 Metric Cards */}
          <View style={styles.metricsRow}>
            {/* Card 1: Profile Views */}
            <View style={styles.metricCard}>
              <AppText style={styles.metricVal} weight="bold">1,284</AppText>
              <AppText style={styles.metricLbl}>Profile Views</AppText>
              <View style={styles.deltaBadge}>
                <AppText style={styles.deltaText}>+5.2% this week</AppText>
              </View>
            </View>

            {/* Card 2: NFC Taps */}
            <View style={styles.metricCard}>
              <AppText style={styles.metricVal} weight="bold">326</AppText>
              <AppText style={styles.metricLbl}>NFC Taps</AppText>
              <View style={styles.deltaBadge}>
                <AppText style={styles.deltaText}>+12.4% this week</AppText>
              </View>
            </View>
          </View>

          {/* Profile Views Chart Box */}
          <View style={styles.chartBox}>
            <View style={styles.chartHeader}>
              <View>
                <AppText style={styles.chartTitle} weight="bold">
                  Activity Velocity
                </AppText>
                <AppText style={styles.chartSubtitle}>
                  Tap any day to inspect velocity
                </AppText>
              </View>
              {/* Scrubbed Tooltip Pill */}
              <View style={styles.scrubTooltip}>
                <AppText style={styles.scrubDayText} weight="bold">
                  {activePoint.day}:
                </AppText>
                <AppText style={styles.scrubViewsText} weight="bold">
                  {activePoint.views} views
                </AppText>
              </View>
            </View>

            {/* Visual Interactive Bar Simulation */}
            <View style={styles.chartArea}>
              {CHART_POINTS.map((pt, idx) => {
                const heightPct = Math.round((pt.views / maxVal) * 100);
                const isSelected = idx === activePointIndex;
                return (
                  <Pressable
                    key={pt.day}
                    style={styles.barCol}
                    onPress={() => {
                      HapticTap.selection();
                      setActivePointIndex(idx);
                    }}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: isSelected ? C.emerald : 'rgba(255,255,255,0.25)',
                          },
                        ]}
                      />
                    </View>
                    <AppText
                      style={[
                        styles.barLabel,
                        isSelected && styles.barLabelActive,
                      ]}
                      weight={isSelected ? 'bold' : undefined}
                    >
                      {pt.day}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* TOP SOURCES Section */}
          <View style={styles.sourcesBox}>
            <AppText style={styles.sourcesHeaderTitle} weight="bold">
              Traffic Sources
            </AppText>

            <View style={styles.sourcesList}>
              {SOURCES.map((src) => (
                <View key={src.name} style={styles.sourceRow}>
                  <View style={styles.sourceTextRow}>
                    <AppText style={styles.sourceName}>{src.name}</AppText>
                    <AppText style={styles.sourcePct} weight="medium">{src.pct}%</AppText>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${src.pct}%`, backgroundColor: src.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: C.text,
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  periodPillActive: {
    backgroundColor: C.surfaceRaised,
  },
  periodText: {
    fontSize: 13,
    color: C.textMuted,
  },
  periodTextActive: {
    color: C.text,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
  },
  metricVal: {
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  chartBox: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  scrubTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(121, 154, 133, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scrubDayText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  scrubViewsText: {
    fontSize: 12,
    color: C.emerald,
  },
  chartTitle: {
    fontSize: 16,
    color: C.text,
  },
  chartSubtitle: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  chartArea: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  barLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sourcesBox: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
  },
  sourcesHeaderTitle: {
    fontSize: 16,
    color: C.text,
    marginBottom: 16,
  },
  sourcesList: {
    gap: 14,
  },
  sourceRow: {
    gap: 6,
  },
  sourceTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceName: {
    fontSize: 13,
    color: C.text,
  },
  sourcePct: {
    fontSize: 13,
    color: C.textSecondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

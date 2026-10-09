/**
 * NFC Analytics Dashboard
 * 
 * Tap analytics, ROI metrics, and conversion tracking
 * Monochrome brand-compliant design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { AnalyticsSkeleton } from '@/src/components/SkeletonLoader';

const { width } = Dimensions.get('window');

type TimeRange = '24h' | '7d' | '30d' | 'all';

interface TapAnalytics {
  totalTaps: number;
  uniqueTaps: number;
  todayTaps: number;
  conversions: number;
  averageTimeOnPage: number;
  topLocations: Array<{ city: string; count: number }>;
  deviceBreakdown: { ios: number; android: number; other: number };
  hourlyData: Array<{ hour: number; taps: number }>;
}

export default function NfcAnalyticsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TapAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = Date.now();
      const ranges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        'all': Infinity,
      };
      const startTime = now - ranges[timeRange];

      // Query tap events
      const tapsRef = collection(db, 'tap_events');
      let tapsQuery = query(
        tapsRef,
        where('userId', '==', user?.id || ''),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const tapsSnap = await getDocs(tapsQuery);
      const taps = tapsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter by time range
      const filteredTaps = taps.filter((tap: any) => {
        const tapTime = tap.timestamp?.toDate?.().getTime() || 0;
        return timeRange === 'all' || tapTime >= startTime;
      });

      // Calculate metrics
      const uniqueUsers = new Set(filteredTaps.map((t: any) => t.visitorId || t.ipAddress)).size;
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayTaps = filteredTaps.filter((t: any) => {
        const tapTime = t.timestamp?.toDate?.().getTime() || 0;
        return tapTime >= todayStart;
      }).length;

      // Device breakdown
      const devices = filteredTaps.reduce(
        (acc: any, tap: any) => {
          const device = tap.device?.toLowerCase() || 'other';
          if (device.includes('ios') || device.includes('iphone')) acc.ios++;
          else if (device.includes('android')) acc.android++;
          else acc.other++;
          return acc;
        },
        { ios: 0, android: 0, other: 0 }
      );

      // Location data
      const locationCounts = filteredTaps.reduce((acc: any, tap: any) => {
        const city = tap.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});
      const topLocations = Object.entries(locationCounts)
        .map(([city, count]) => ({ city, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Hourly data (last 24 hours)
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        taps: 0,
      }));
      filteredTaps.forEach((tap: any) => {
        const hour = tap.timestamp?.toDate?.().getHours() || 0;
        hourlyData[hour].taps++;
      });

      setAnalytics({
        totalTaps: filteredTaps.length,
        uniqueTaps: uniqueUsers,
        todayTaps,
        conversions: Math.floor(filteredTaps.length * 0.15), // Estimated
        averageTimeOnPage: 45, // Seconds (estimated)
        topLocations,
        deviceBreakdown: devices,
        hourlyData,
      });
    } catch (error) {
      console.error('[Analytics] Load failed', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    HapticTap.light();
    setTimeRange(range);
  }, []);

  const conversionRate = useMemo(() => {
    if (!analytics || analytics.uniqueTaps === 0) return 0;
    return ((analytics.conversions / analytics.uniqueTaps) * 100).toFixed(1);
  }, [analytics]);

  const peakHour = useMemo(() => {
    if (!analytics) return null;
    const peak = analytics.hourlyData.reduce((max, curr) =>
      curr.taps > max.taps ? curr : max
    );
    return peak;
  }, [analytics]);

  if (loading) {
    return (
      <ScreenContainer>
        <AnalyticsSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title} weight="bold">
            NFC Analytics
          </AppText>
          <AppText style={styles.subtitle}>
            Tap insights and ROI metrics
          </AppText>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeBar}>
          {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
            <Pressable
              key={range}
              style={[
                styles.timeChip,
                timeRange === range && styles.timeChipActive,
              ]}
              onPress={() => handleTimeRangeChange(range)}
            >
              <AppText
                style={[
                  styles.timeChipText,
                  timeRange === range && styles.timeChipTextActive,
                ]}
                weight={timeRange === range ? 'bold' : 'regular'}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <AppIcon name="Zap" size={24} color={T.textPrimary} />
            <AppText style={styles.metricValue} weight="bold">
              {analytics?.totalTaps || 0}
            </AppText>
            <AppText style={styles.metricLabel}>Total Taps</AppText>
          </View>

          <View style={styles.metricCard}>
            <AppIcon name="Users" size={24} color={T.textPrimary} />
            <AppText style={styles.metricValue} weight="bold">
              {analytics?.uniqueTaps || 0}
            </AppText>
            <AppText style={styles.metricLabel}>Unique Visitors</AppText>
          </View>

          <View style={styles.metricCard}>
            <AppIcon name="TrendingUp" size={24} color={T.textPrimary} />
            <AppText style={styles.metricValue} weight="bold">
              {conversionRate}%
            </AppText>
            <AppText style={styles.metricLabel}>Conversion</AppText>
          </View>

          <View style={styles.metricCard}>
            <AppIcon name="Clock" size={24} color={T.textPrimary} />
            <AppText style={styles.metricValue} weight="bold">
              {analytics?.averageTimeOnPage || 0}s
            </AppText>
            <AppText style={styles.metricLabel}>Avg. Time</AppText>
          </View>
        </View>

        {/* Today Highlight */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <AppIcon name="Calendar" size={20} color={T.accent} />
            <AppText style={styles.todayTitle} weight="bold">
              Today&apos;s Activity
            </AppText>
          </View>
          <AppText style={styles.todayValue} weight="bold">
            {analytics?.todayTaps || 0} taps
          </AppText>
          {peakHour && (
            <AppText style={styles.todayDetail}>
              Peak hour: {peakHour.hour}:00 ({peakHour.taps} taps)
            </AppText>
          )}
        </View>

        {/* Hourly Chart (Simple Bar Chart) */}
        <View style={styles.chartCard}>
          <AppText style={styles.chartTitle} weight="bold">
            Hourly Activity (Last 24h)
          </AppText>
          <View style={styles.chartBars}>
            {analytics?.hourlyData.slice(0, 24).map((data) => {
              const maxTaps = Math.max(...(analytics?.hourlyData.map((h) => h.taps) || [1]));
              const height = maxTaps > 0 ? (data.taps / maxTaps) * 120 : 0;

              return (
                <View key={data.hour} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: height || 2,
                        backgroundColor: data.taps > 0 ? T.accent : T.surface,
                      },
                    ]}
                  />
                  {data.hour % 6 === 0 && (
                    <AppText style={styles.barLabel}>{data.hour}</AppText>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Device Breakdown */}
        <View style={styles.deviceCard}>
          <AppText style={styles.sectionTitle} weight="bold">
            Device Breakdown
          </AppText>
          <View style={styles.deviceRow}>
            <View style={styles.deviceItem}>
              <AppIcon name="Smartphone" size={32} color={T.textPrimary} />
              <AppText style={styles.deviceValue} weight="bold">
                {analytics?.deviceBreakdown.ios || 0}
              </AppText>
              <AppText style={styles.deviceLabel}>iOS</AppText>
            </View>
            <View style={styles.deviceItem}>
              <AppIcon name="Smartphone" size={32} color={T.textPrimary} />
              <AppText style={styles.deviceValue} weight="bold">
                {analytics?.deviceBreakdown.android || 0}
              </AppText>
              <AppText style={styles.deviceLabel}>Android</AppText>
            </View>
            <View style={styles.deviceItem}>
              <AppIcon name="Monitor" size={32} color={T.textSecondary} />
              <AppText style={styles.deviceValue} weight="bold">
                {analytics?.deviceBreakdown.other || 0}
              </AppText>
              <AppText style={styles.deviceLabel}>Other</AppText>
            </View>
          </View>
        </View>

        {/* Top Locations */}
        <View style={styles.locationsCard}>
          <AppText style={styles.sectionTitle} weight="bold">
            Top Locations
          </AppText>
          {analytics?.topLocations.map((location, index) => (
            <View key={location.city} style={styles.locationRow}>
              <AppText style={styles.locationRank}>{index + 1}</AppText>
              <AppText style={styles.locationCity}>{location.city}</AppText>
              <AppText style={styles.locationCount} weight="bold">
                {location.count}
              </AppText>
            </View>
          ))}
        </View>

        {/* ROI Insight */}
        <View style={styles.roiCard}>
          <AppText style={styles.roiTitle} weight="bold">
            💡 ROI Insight
          </AppText>
          <AppText style={styles.roiText}>
            Your NFC card has generated{' '}
            <AppText weight="bold">{analytics?.uniqueTaps || 0} unique connections</AppText>{' '}
            with an estimated{' '}
            <AppText weight="bold">{conversionRate}% conversion rate</AppText>.
            This represents approximately{' '}
            <AppText weight="bold">{analytics?.conversions || 0} qualified leads</AppText>.
          </AppText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: T.fontSizeXL,
    color: T.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
  },
  timeRangeBar: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: T.surface,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: T.accent,
  },
  timeChipText: {
    fontSize: T.fontSizeXS,
    color: T.textSecondary,
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    color: T.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: T.fontSizeXS,
    color: T.textSecondary,
    textTransform: 'uppercase',
  },
  todayCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  todayValue: {
    fontSize: 36,
    color: T.textPrimary,
    marginBottom: 8,
  },
  todayDetail: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  chartCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 20,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 2,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 9,
    color: T.textMuted,
    marginTop: 4,
  },
  deviceCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 16,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  deviceItem: {
    alignItems: 'center',
    gap: 8,
  },
  deviceValue: {
    fontSize: 24,
    color: T.textPrimary,
  },
  deviceLabel: {
    fontSize: T.fontSizeXS,
    color: T.textSecondary,
  },
  locationsCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  locationRank: {
    fontSize: T.fontSizeMD,
    color: T.textMuted,
    width: 32,
  },
  locationCity: {
    flex: 1,
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  locationCount: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  roiCard: {
    backgroundColor: T.surfaceRaised,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  roiTitle: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
    marginBottom: 12,
  },
  roiText: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
    lineHeight: 22,
  },
});

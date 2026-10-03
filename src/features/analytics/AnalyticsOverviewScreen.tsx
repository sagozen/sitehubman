import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon, { type AppIconName } from '@/src/components/AppIcon';
import IosScrollView from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const ACCENT = '#2596BE';
const SURFACE = '#111114';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA0';

// 7-day mock data as percentages (0–100)
const BAR_DATA = [
  { day: 'Mon', value: 62 },
  { day: 'Tue', value: 78 },
  { day: 'Wed', value: 55 },
  { day: 'Thu', value: 90 },
  { day: 'Fri', value: 84 },
  { day: 'Sat', value: 45 },
  { day: 'Sun', value: 38 },
];

const QUICK_STATS = [
  { label: 'NFC Taps',    value: '326', icon: 'wifi'     as AppIconName },
  { label: 'QR Scans',    value: '48',  icon: 'grid'     as AppIconName },
  { label: 'Link Clicks', value: '142', icon: 'link'     as AppIconName },
];

interface SectionLink {
  label: string;
  route: string;
  icon: AppIconName;
}

const SECTION_LINKS: SectionLink[] = [
  { label: 'NFC Analytics',  route: '/analytics/nfc',   icon: 'wifi'        },
  { label: 'QR Analytics',   route: '/analytics/qr',    icon: 'grid'        },
  { label: 'Link Analytics', route: '/analytics/links',  icon: 'link'        },
  { label: 'Audience',       route: '/analytics/audience', icon: 'users'     },
];

function BarChart() {
  const maxVal = Math.max(...BAR_DATA.map((d) => d.value));
  return (
    <View style={styles.barChart}>
      {BAR_DATA.map((d) => {
        const heightPct = (d.value / maxVal) * 100;
        return (
          <View key={d.day} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${heightPct}%` as any },
                ]}
              />
            </View>
            <AppText style={styles.barLabel}>{d.day}</AppText>
          </View>
        );
      })}
    </View>
  );
}

export default function AnalyticsOverviewScreen() {
  const handleNavLink = useCallback((route: string) => {
    HapticTap.light();
    router.push(route as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>Analytics</AppText>
        </View>

        {/* Hero metric */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <AppText style={styles.heroMetricLabel}>Profile Views</AppText>
              <AppText style={styles.heroMetricValue}>1,284</AppText>
            </View>
            <View style={styles.trendBadge}>
              <AppIcon name="trending-up" size={13} color="#34C759" />
              <AppText style={styles.trendText}>+18.4%</AppText>
            </View>
          </View>
          <AppText style={styles.heroPeriod}>Last 7 days vs prior week</AppText>
          <BarChart />
        </View>

        {/* Quick stats strip */}
        <View style={styles.statsStrip}>
          {QUICK_STATS.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statCell}>
                <AppIcon name={stat.icon} size={18} color={ACCENT} />
                <AppText style={styles.statValue}>{stat.value}</AppText>
                <AppText style={styles.statLabel}>{stat.label}</AppText>
              </View>
              {idx < QUICK_STATS.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Section links */}
        <View style={styles.linksCard}>
          {SECTION_LINKS.map((link, idx) => (
            <React.Fragment key={link.label}>
              <Pressable
                style={styles.linkRow}
                onPress={() => handleNavLink(link.route)}
                hitSlop={4}
                android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
              >
                <View style={styles.linkIconWrap}>
                  <AppIcon name={link.icon} size={18} color={ACCENT} />
                </View>
                <AppText style={styles.linkLabel}>{link.label}</AppText>
                <AppIcon name="chevron-right" size={16} color={MUTED} />
              </Pressable>
              {idx < SECTION_LINKS.length - 1 && <View style={styles.divider} />}
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
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.5,
  },
  heroCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroMetricLabel: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
  },
  heroMetricValue: {
    fontSize: 42,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34C759',
  },
  heroPeriod: {
    fontSize: 12,
    color: MUTED,
  },
  barChart: {
    flexDirection: 'row',
    height: 80,
    gap: 6,
    alignItems: 'flex-end',
    marginTop: 4,
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
    textAlign: 'center',
  },
  statsStrip: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: BORDER,
    marginVertical: 6,
  },
  linksCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  linkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37,150,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: TEXT,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
});

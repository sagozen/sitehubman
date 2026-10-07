import React from 'react';
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

const ACCENT = '#799A85';
const SURFACE = '#242424';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#FFFFFF';
const MUTED = '#9A9AA0';

interface LinkStat {
  name: string;
  count: number;
  icon: AppIconName;
}

const LINK_STATS: LinkStat[] = [
  { name: 'Phone',     count: 42, icon: 'phone'    },
  { name: 'Website',   count: 38, icon: 'globe'    },
  { name: 'Instagram', count: 25, icon: 'instagram'},
  { name: 'Email',     count: 19, icon: 'mail'     },
];

const TOTAL = LINK_STATS.reduce((sum, s) => sum + s.count, 0);

export default function LinkAnalyticsScreen() {
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
          <AppText style={styles.headerTitle}>Link Analytics</AppText>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <AppText style={styles.heroLabel}>Total Link Clicks</AppText>
          <AppText style={styles.heroValue}>{TOTAL}</AppText>
          <View style={styles.heroBadge}>
            <AppIcon name="trending-up" size={13} color="#34C759" />
            <AppText style={styles.heroBadgeText}>+11.6% this week</AppText>
          </View>
        </View>

        {/* Link breakdown */}
        <View style={styles.sectionLabel}>
          <AppText style={styles.sectionLabelText}>Breakdown by Link</AppText>
        </View>

        <View style={styles.breakdownCard}>
          {LINK_STATS.map((link, idx) => {
            const widthPct = Math.round((link.count / LINK_STATS[0].count) * 100);
            return (
              <React.Fragment key={link.name}>
                <View style={styles.linkRow}>
                  <View style={styles.linkIconWrap}>
                    <AppIcon name={link.icon} size={16} color={ACCENT} />
                  </View>
                  <View style={styles.linkInfo}>
                    <View style={styles.linkTopRow}>
                      <AppText style={styles.linkName}>{link.name}</AppText>
                      <AppText style={styles.linkCount}>{link.count}</AppText>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${widthPct}%` as any }]} />
                    </View>
                  </View>
                </View>
                {idx < LINK_STATS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Most clicked</AppText>
            <View style={styles.summaryValue}>
              <AppIcon name={LINK_STATS[0].icon} size={14} color={ACCENT} />
              <AppText style={styles.summaryValueText}>
                {LINK_STATS[0].name} · {LINK_STATS[0].count} clicks
              </AppText>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Avg clicks/day</AppText>
            <AppText style={styles.summaryValueText}>
              {(TOTAL / 7).toFixed(1)}
            </AppText>
          </View>
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
    backgroundColor: '#242424',
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
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  sectionLabel: {
    marginTop: 4,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(37,150,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInfo: {
    flex: 1,
    gap: 7,
  },
  linkTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
  },
  linkCount: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  barTrack: {
    height: 5,
    backgroundColor: 'rgba(37,150,190,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: MUTED,
  },
  summaryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: BORDER,
  },
});

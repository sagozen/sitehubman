import React from 'react';
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
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: '#9A9AA0',
  textDim: '#52525B',
  accent: '#799A85',
};

type BarRowProps = {
  label: string;
  pct: number;
  color?: string;
};

const HorizBar: React.FC<BarRowProps> = ({ label, pct, color = '#FFFFFF' }) => (
  <View style={barStyles.row}>
    <AppText style={barStyles.label}>{label}</AppText>
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
    <AppText style={barStyles.pct}>{pct}%</AppText>
  </View>
);

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
    color: '#FFFFFF',
    width: 88,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#242424',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
  pct: {
    fontSize: 13,
    color: '#9A9AA0',
    width: 36,
    textAlign: 'right',
  },
});

const DEVICES = [
  { label: 'iPhone', pct: 58, color: '#FFFFFF' },
  { label: 'Android', pct: 32, color: '#9A9AA0' },
  { label: 'Desktop', pct: 10, color: '#52525B' },
];

const COUNTRIES = [
  { flag: '🇺🇸', name: 'United States', pct: 42 },
  { flag: '🇬🇧', name: 'United Kingdom', pct: 18 },
  { flag: '🇩🇪', name: 'Germany', pct: 14 },
  { flag: '🇯🇵', name: 'Japan', pct: 11 },
  { flag: '🇫🇷', name: 'France', pct: 9 },
];

const TIME_OF_VISIT = [
  { label: 'Morning', pct: 35, color: '#FFFFFF' },
  { label: 'Afternoon', pct: 42, color: '#9A9AA0' },
  { label: 'Evening', pct: 23, color: '#52525B' },
];

const TRAFFIC_SOURCES = [
  { label: 'NFC Tap', pct: 42, color: '#FFFFFF', icon: 'zap' as const },
  { label: 'QR Scan', pct: 28, color: '#9A9AA0', icon: 'maximize' as const },
  { label: 'Direct', pct: 18, color: '#9A9AA0', icon: 'link' as const },
  { label: 'Social', pct: 12, color: '#3F3F46', icon: 'share-2' as const },
];

export default function AudienceScreen() {
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
        <AppText style={styles.headerTitle}>Audience</AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Types */}
        <AppText style={styles.sectionLabel}>DEVICE TYPE</AppText>
        <View style={styles.card}>
          {DEVICES.map((d, i) => (
            <View key={d.label}>
              <HorizBar label={d.label} pct={d.pct} color={d.color} />
              {i < DEVICES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Countries */}
        <AppText style={styles.sectionLabel}>TOP COUNTRIES</AppText>
        <View style={styles.card}>
          {COUNTRIES.map((c, i) => (
            <View key={c.name}>
              <View style={styles.countryRow}>
                <AppText style={styles.flag}>{c.flag}</AppText>
                <AppText style={styles.countryName}>{c.name}</AppText>
                <View style={styles.countryBarTrack}>
                  <View
                    style={[
                      styles.countryBarFill,
                      { width: `${c.pct}%` as any },
                    ]}
                  />
                </View>
                <AppText style={styles.countryPct}>{c.pct}%</AppText>
              </View>
              {i < COUNTRIES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Time of Visit */}
        <AppText style={styles.sectionLabel}>TIME OF VISIT</AppText>
        <View style={styles.card}>
          {TIME_OF_VISIT.map((t, i) => (
            <View key={t.label}>
              <HorizBar label={t.label} pct={t.pct} color={t.color} />
              {i < TIME_OF_VISIT.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Traffic Sources */}
        <AppText style={styles.sectionLabel}>TRAFFIC SOURCE</AppText>
        <View style={styles.trafficGrid}>
          {TRAFFIC_SOURCES.map((src) => (
            <View key={src.label} style={styles.trafficCard}>
              <View style={styles.trafficIconWrap}>
                <AppIcon name={src.icon} size={18} color="#FFFFFF" />
              </View>
              <AppText style={styles.trafficPct}>{src.pct}%</AppText>
              <AppText style={styles.trafficLabel}>{src.label}</AppText>
              <View style={styles.trafficBarTrack}>
                <View
                  style={[
                    styles.trafficBarFill,
                    { width: `${src.pct}%` as any, backgroundColor: src.color },
                  ]}
                />
              </View>
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
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  flag: {
    fontSize: 18,
    width: 26,
  },
  countryName: {
    fontSize: 13,
    color: C.text,
    width: 110,
  },
  countryBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.surfaceRaised,
    borderRadius: 99,
    overflow: 'hidden',
  },
  countryBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
  },
  countryPct: {
    fontSize: 12,
    color: C.muted,
    width: 32,
    textAlign: 'right',
  },
  trafficGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  trafficCard: {
    width: '47%',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    padding: 16,
  },
  trafficIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  trafficPct: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -1,
  },
  trafficLabel: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 10,
    marginTop: 2,
  },
  trafficBarTrack: {
    height: 4,
    backgroundColor: C.surfaceRaised,
    borderRadius: 99,
    overflow: 'hidden',
  },
  trafficBarFill: {
    height: '100%',
    borderRadius: 99,
  },
});

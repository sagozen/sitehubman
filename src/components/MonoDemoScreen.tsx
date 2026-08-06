/**
 * MonoDemoScreen — showcase of the monochrome design system.
 * Demonstrates typography rhythm, card system, button states, list rows,
 * status chips, and the floating tab bar — all in pure black/white/grayscale.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import { MonoCard, MonoRow } from '@/src/components/MonoCard';
import { MonoScreen } from '@/src/components/MonoScreen';
import { MonoTabBar, type MonoTabItem } from '@/src/components/MonoTabBar';
import { MonoText } from '@/src/components/MonoText';
import { monoMotion, monoRadius, monoSpace } from '@/src/design-system/monochrome';
import { usePreferences } from '@/src/hooks/usePreferences';

const tabs: MonoTabItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'contacts', label: 'Contacts', icon: 'people' },
  { key: 'share', label: 'Share', icon: 'qr-code' },
  { key: 'profile', label: 'Profile', icon: 'heart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export function MonoDemoScreen() {
  const { isDark } = usePreferences();
  const [active, setActive] = useState('home');

  const ink = isDark ? '#FFFFFF' : '#000000';
  const surface = isDark ? '#131316' : '#FFFFFF';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,11,0.08)';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(60,60,67,0.6)';

  return (
    <MonoScreen
      eyebrow="Snap Tap"
      title="Identity, simplified."
      intro="A monochrome operating system for your contactless card. Built for speed, precision, and longevity."
      bottomGutter={120}
    >
      {/* ── Stat row ────────────────────────────── */}
      <View style={styles.statRow}>
        <StatTile label="Taps" value="1,284" caption="Lifetime" />
        <View style={[styles.statDivider, { backgroundColor: hairline }]} />
        <StatTile label="Active" value="42" caption="This week" />
        <View style={[styles.statDivider, { backgroundColor: hairline }]} />
        <StatTile label="Saved" value="$248" caption="This month" />
      </View>

      {/* ── Quick actions ───────────────────────── */}
      <View style={{ gap: monoSpace[3] }}>
        <AppButton label="Share your card" variant="primary" size="lg" fullWidth iconLeft="Share2" />
        <View style={styles.twoCol}>
          <AppButton label="Design" variant="secondary" size="md" fullWidth iconLeft="Palette" />
          <AppButton label="Analytics" variant="secondary" size="md" fullWidth iconRight="ChevronRight" />
        </View>
      </View>

      {/* ── Card list ───────────────────────────── */}
      <MonoCard variant="flat" bordered pad="sm" radius="xl">
        <MonoRow
          icon={<Ionicons name="person" size={20} color={muted} />}
          title="Profile"
          subtitle="Name, headline, links"
          showChevron
          divider
        />
        <MonoRow
          icon={<Ionicons name="card" size={20} color={muted} />}
          title="Cards"
          subtitle="Active, archived"
          showChevron
          divider
        />
        <MonoRow
          icon={<Ionicons name="notifications" size={20} color={muted} />}
          title="Notifications"
          subtitle="Taps, leads, system"
          trailing={
            <View style={[styles.chip, { backgroundColor: ink }]}>
              <MonoText variant="micro" weight="bold" color={isDark ? '#000' : '#FFF'}>3</MonoText>
            </View>
          }
          showChevron
          divider
        />
        <MonoRow
          icon={<Ionicons name="settings" size={20} color={muted} />}
          title="Settings"
          subtitle="Appearance, language, account"
          showChevron
        />
      </MonoCard>

      {/* ── Status chips ────────────────────────── */}
      <View>
        <MonoText variant="micro" tone="muted" style={styles.sectionLabel}>
          Status
        </MonoText>
        <View style={styles.chipRow}>
          <MonoText style={[styles.chipPill, { borderColor: hairline, color: ink }]}>Live</MonoText>
          <MonoText style={[styles.chipPill, { borderColor: hairline, color: ink }]}>Synced</MonoText>
          <MonoText style={[styles.chipPill, { borderColor: hairline, color: ink }]}>Verified</MonoText>
          <MonoText style={[styles.chipPill, { borderColor: hairline, color: muted }]}>Draft</MonoText>
        </View>
      </View>

      {/* ── Footer text ─────────────────────────── */}
      <View style={{ gap: monoSpace[2] }}>
        <MonoText variant="micro" tone="muted">MAINTENANCE</MonoText>
        <MonoText variant="bodySmall" tone="muted">
          All systems operational. Last sync 2 minutes ago.
        </MonoText>
      </View>

      {/* ── Floating tab bar ────────────────────── */}
      <View pointerEvents="box-none" style={{ marginTop: monoSpace[6] }}>
        <MonoTabBar items={tabs} activeKey={active} onChange={setActive} />
      </View>
    </MonoScreen>
  );
}

function StatTile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <View style={styles.statTile}>
      <MonoText variant="micro" tone="muted">{label.toUpperCase()}</MonoText>
      <MonoText variant="title1" weight="heavy" style={{ letterSpacing: -1 }}>{value}</MonoText>
      <MonoText variant="footnote" tone="muted">{caption}</MonoText>
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: monoSpace[4],
    gap: monoSpace[3],
  },
  statTile: {
    flex: 1,
    gap: monoSpace[1],
    minWidth: 0,
  },
  statDivider: {
    width: 0.5,
    alignSelf: 'stretch',
  },
  twoCol: {
    flexDirection: 'row',
    gap: monoSpace[2],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: monoSpace[2],
    marginTop: monoSpace[3],
  },
  chipPill: {
    paddingHorizontal: monoSpace[3],
    paddingVertical: monoSpace[1] + 2,
    borderRadius: monoRadius.full,
    borderWidth: 0.5,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  chip: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginBottom: monoSpace[2],
    letterSpacing: 0.6,
  },
});
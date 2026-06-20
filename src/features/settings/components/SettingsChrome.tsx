import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

// ─── Design tokens ────────────────────────────────────────────────────────────
const SURFACE = '#FFFFFF';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';

export type SettingsThemeColors = {
  background: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  systemBlue: string;
  danger: string;
};

// ─── Message banner ───────────────────────────────────────────────────────────
export function SettingsMessageBanner({
  colors,
  children,
  tone = 'info',
}: {
  colors: SettingsThemeColors;
  children: ReactNode;
  tone?: 'info' | 'error' | 'success';
}) {
  const p =
    tone === 'error'
      ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: 'CircleAlert' as AppIconName }
      : tone === 'success'
        ? { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', icon: 'CircleCheck' as AppIconName }
        : { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', icon: 'Info' as AppIconName };

  return (
    <View style={[banner.wrap, { backgroundColor: p.bg, borderColor: p.border }]}>
      <AppIcon name={p.icon} size={16} color={p.text} />
      <AppText style={[banner.text, { color: p.text }]}>{children}</AppText>
    </View>
  );
}

const banner = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  text: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18, fontFamily: 'Inter_500Medium' },
});

// ─── Section label ────────────────────────────────────────────────────────────
export function SettingsSectionLabel({ colors, children }: { colors: SettingsThemeColors; children: string }) {
  return (
    <AppText style={[sl.label, { color: colors.textMuted }]}>{children}</AppText>
  );
}

const sl = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 2, fontFamily: 'Inter_700Bold' },
});

// ─── Surface card (plain white, deep shadow) ──────────────────────────────────
export function SettingsSurfaceCard({
  colors: _colors,
  children,
  style,
}: {
  colors: SettingsThemeColors;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[sc.card, style]}>
      {children}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
});

// ─── Account card ─────────────────────────────────────────────────────────────
export function SettingsAccountCard({
  colors,
  displayName,
  email,
  roleLabel,
  roleAccent,
  avatar,
}: {
  colors: SettingsThemeColors;
  displayName: string;
  email: string;
  roleLabel: string;
  roleAccent: string;
  showBrandLogo?: boolean;
  avatar?: ReactNode;
}) {
  const initial = (displayName.trim() || 'G')[0].toUpperCase();

  return (
    <View style={ac.card}>
      {/* Avatar */}
      {avatar ?? (
        <View style={[ac.avatar, { backgroundColor: roleAccent }]}>
          <AppText style={ac.avatarT}>{initial}</AppText>
        </View>
      )}
      <View style={ac.copy}>
        <AppText style={ac.name} numberOfLines={1}>{displayName}</AppText>
        <AppText style={ac.email} numberOfLines={1}>{email}</AppText>
        <View style={[ac.pill, { backgroundColor: `${roleAccent}18` }]}>
          <AppText style={[ac.pillT, { color: roleAccent }]}>{roleLabel}</AppText>
        </View>
      </View>
      <AppIcon name="ChevronRight" size={18} color="#D1D5DB" />
    </View>
  );
}

const ac = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#2596BE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 5 },
  avatarT: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Inter_900Black' },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  name: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: -0.3, fontFamily: 'Inter_800ExtraBold' },
  email: { fontSize: 12, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  pillT: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, fontFamily: 'Inter_800ExtraBold' },
});

// ─── Settings tile ────────────────────────────────────────────────────────────
export function SettingsTile({
  colors,
  icon,
  title,
  description,
  value,
  onPress,
  accent = '#2596BE',
  destructive,
  disabled,
  last,
}: {
  colors: SettingsThemeColors;
  icon: AppIconName;
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  accent?: string;
  destructive?: boolean;
  disabled?: boolean;
  last?: boolean;
}) {
  const iconColor = destructive ? colors.danger : accent;
  const titleColor = destructive ? colors.danger : INK2;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        stile.row,
        !last && stile.border,
        pressed && onPress && stile.pressed,
        disabled && stile.disabled,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {/* Bare icon — no background tile */}
      <AppIcon name={icon} size={24} color={iconColor} />
      <View style={stile.copy}>
        <AppText style={[stile.title, { color: titleColor }]}>{title}</AppText>
        {description ? (
          <AppText style={[stile.desc, { color: colors.textMuted }]}>{description}</AppText>
        ) : null}
      </View>
      {value ? (
        <AppText style={stile.value} numberOfLines={1}>{value}</AppText>
      ) : onPress ? (
        <AppIcon name="ChevronRight" size={16} color="#D1D5DB" />
      ) : null}
    </Pressable>
  );
}

const stile = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 15, minHeight: 54 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  pressed: { opacity: 0.7, backgroundColor: '#F9F9F9' },
  disabled: { opacity: 0.4 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: INK2, fontFamily: 'Inter_600SemiBold' },
  desc: { fontSize: 12, fontWeight: '500', lineHeight: 16, fontFamily: 'Inter_500Medium' },
  value: { fontSize: 13, fontWeight: '600', color: MUTED, maxWidth: 110, fontFamily: 'Inter_600SemiBold' },
});

// ─── Capability row ───────────────────────────────────────────────────────────
export function SettingsCapabilityRow({
  colors,
  title,
  description,
  accent,
  last,
}: {
  colors: SettingsThemeColors;
  title: string;
  description: string;
  accent: string;
  last?: boolean;
}) {
  return (
    <View style={[cap.row, !last && cap.border]}>
      <View style={[cap.dot, { backgroundColor: accent }]} />
      <View style={cap.copy}>
        <AppText style={[cap.title, { color: colors.textPrimary }]}>{title}</AppText>
        <AppText style={[cap.desc, { color: colors.textMuted }]}>{description}</AppText>
      </View>
    </View>
  );
}

const cap = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  desc: { fontSize: 12, fontWeight: '500', lineHeight: 16, fontFamily: 'Inter_500Medium' },
});

// ─── Shared scroll styles ─────────────────────────────────────────────────────
export const settingsChromeStyles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 120, gap: 14 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -0.8, fontFamily: 'Inter_900Black' },
  pageSub: { fontSize: 13, fontWeight: '500', color: MUTED, marginTop: 2, fontFamily: 'Inter_500Medium' },
  // kept for compat — not used in new design
  banner: {},
  bannerText: {},
  sectionLabel: {},
  surfaceCardInner: {},
  surfaceCard: {},
  accountCard: {},
  accountRow: {},
  brandLogo: {},
  accountCopy: {},
  accountName: {},
  accountEmail: {},
  rolePill: {},
  rolePillText: {},
  tile: {},
  tilePressed: {},
  tileDisabled: {},
  tileIcon: {},
  tileCopy: {},
  tileTitle: {},
  tileDesc: {},
  tileValue: {},
  capabilityRow: {},
  capabilityCopy: {},
  capabilityDot: {},
  capabilityTitle: {},
  capabilityDesc: {},
  prefsBlock: { padding: 18, gap: 20 },
  appearanceBlock: { gap: 8 },
  appearanceTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  appearanceHint: { fontSize: 12, fontWeight: '500', lineHeight: 17, fontFamily: 'Inter_500Medium' },
  themeSwatch: { width: 14, height: 14, borderRadius: 7 },
  swatchDot: { width: 18, height: 18, borderRadius: 9 },
});

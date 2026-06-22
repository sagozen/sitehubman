/**
 * PrinterScreenUi — Apple-quality iOS design primitives for the Printer role.
 *
 * Palette: deep navy/slate backgrounds, pure white cards, cyan-blue accent.
 * Typography: SF-weight scale matching iOS Human Interface Guidelines.
 * Components: all memoised, no JS-thread animations.
 */
import { memo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GlassSurface } from '@/src/components/GlassSurface';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';

// ─── Design tokens ────────────────────────────────────────────────────────────

export const printerUi = {
  // Backgrounds
  bg:          '#F2F2F7',
  surface:     '#FFFFFF',
  surfaceAlt:  'rgba(255,255,255,0.82)',

  // Dark hero card
  dark:        '#0F172A',
  darkSurface: '#1E293B',
  darkBorder:  'rgba(255,255,255,0.10)',

  // Text
  text:        '#1C1C1E',
  textSecondary: 'rgba(60,60,67,0.60)',
  muted:       '#8E8E93',

  // Borders
  border:      'rgba(60,60,67,0.12)',
  separator:   'rgba(60,60,67,0.12)',

  // Accents
  accent:      '#007AFF',  // iOS blue — primary printer accent
  accentSoft:  '#EAF3FF',
  green:       '#34C759',
  greenSoft:   '#ECFDF3',
  orange:      '#FF9500',
  orangeSoft:  '#FFF3E0',
  red:         '#FF3B30',
  redSoft:     '#FFF0F0',
  purple:      '#5856D6',
  purpleSoft:  '#F0EEFF',

  // Radii
  radiusXl:    22,
  radiusLg:    18,
  radiusMd:    14,
  radiusSm:    10,
  radiusXs:    8,

  // Elevation
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  } as ViewStyle,
  shadowDark: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 5,
  } as ViewStyle,
} as const;

// ─── PrinterScreenHeader ──────────────────────────────────────────────────────

export const PrinterScreenHeader = memo(function PrinterScreenHeader({
  title, sub, right,
}: {
  title: string;
  sub: string;
  right?: ReactNode | string;
}) {
  return (
    <View style={header.wrap}>
      <View style={header.copy}>
        <AppText style={header.title}>{title}</AppText>
        <AppText style={header.sub}>{sub}</AppText>
      </View>
      {right ? (
        typeof right === 'string' ? (
          <View style={header.badge}>
            <AppText style={header.badgeText}>{right}</AppText>
          </View>
        ) : (
          <View style={header.rightSlot}>{right}</View>
        )
      ) : null}
    </View>
  );
});

const header = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  copy: { flex: 1, gap: 2 },
  title: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    color: printerUi.text,
    letterSpacing: 0.37,
  },
  sub: {
    fontSize: 13,
    fontWeight: '500',
    color: printerUi.muted,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    ...printerUi.shadow,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: printerUi.text,
  },
  rightSlot: { marginLeft: 12 },
});

// ─── PrinterSegment ───────────────────────────────────────────────────────────

export function PrinterSegment<T extends string>({
  items, active, onChange,
}: {
  items: T[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={seg.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={seg.scroll}
      >
        {items.map((item) => {
          const isActive = item === active;
          return (
            <Pressable
              key={item}
              onPress={() => onChange(item)}
              style={[seg.btn, isActive && seg.btnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <AppText style={[seg.text, isActive && seg.textActive]} numberOfLines={1}>
                {item}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const seg = StyleSheet.create({
  wrap: {
    backgroundColor: printerUi.surface,
    borderRadius: printerUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    padding: 3,
    ...printerUi.shadow,
  },
  scroll: { flexDirection: 'row', gap: 2, paddingHorizontal: 1 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: printerUi.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnActive: {
    backgroundColor: printerUi.accent,
    ...printerUi.shadow,
  },
  text: { fontSize: 13, fontWeight: '600', color: printerUi.muted },
  textActive: { color: '#FFFFFF', fontWeight: '700' },
});

// ─── PrinterSurfaceCard ───────────────────────────────────────────────────────

export const PrinterSurfaceCard = memo(function PrinterSurfaceCard({
  children, style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <GlassSurface
      intensity="medium"
      borderRadius={printerUi.radiusLg}
      elevated
      style={style}
      contentStyle={card.content}
    >
      {children}
    </GlassSurface>
  );
});

const card = StyleSheet.create({
  content: { overflow: 'hidden' },
});

// ─── PrinterInfoRow ───────────────────────────────────────────────────────────

export const PrinterInfoRow = memo(function PrinterInfoRow({
  icon, title, value, last,
}: {
  icon: AppIconName;
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[row.wrap, last && row.last]}>
      <SquircleIconTile name={icon} sizeKey="sm" iconColor={printerUi.accent} />
      <AppText style={row.title}>{title}</AppText>
      <AppText style={row.value} numberOfLines={1}>{value}</AppText>
    </View>
  );
});

const row = StyleSheet.create({
  wrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  last: { borderBottomWidth: 0 },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: printerUi.text },
  value: { maxWidth: 140, fontSize: 14, fontWeight: '500', color: printerUi.muted, textAlign: 'right' },
});

// ─── PrinterMenuRow ───────────────────────────────────────────────────────────

export const PrinterMenuRow = memo(function PrinterMenuRow({
  icon, title, onPress, last,
}: {
  icon: AppIconName;
  title: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [menu.wrap, last && menu.last, pressed && menu.pressed]}
    >
      <SquircleIconTile name={icon} sizeKey="sm" iconColor={printerUi.accent} />
      <AppText style={menu.title}>{title}</AppText>
      <AppIcon name="ChevronRight" size={16} color={printerUi.muted} />
    </Pressable>
  );
});

const menu = StyleSheet.create({
  wrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  last: { borderBottomWidth: 0 },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: printerUi.text },
  pressed: { opacity: 0.6 },
});

// ─── PrinterSettingsRow ───────────────────────────────────────────────────────

export const PrinterSettingsRow = memo(function PrinterSettingsRow({
  icon, title, subtitle, value, onPress, destructive, last, disabled,
}: {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        settings.wrap,
        last && settings.last,
        pressed && onPress && !disabled && settings.pressed,
        disabled && settings.disabled,
      ]}
    >
      <SquircleIconTile
        name={icon}
        sizeKey="sm"
        iconColor={destructive ? printerUi.red : printerUi.accent}
      />
      <View style={settings.copy}>
        <AppText style={[settings.title, destructive && settings.titleDestructive]}>
          {title}
        </AppText>
        {subtitle ? <AppText style={settings.sub}>{subtitle}</AppText> : null}
      </View>
      {value ? (
        <AppText style={[settings.value, destructive && settings.valueDestructive]}>
          {value}
        </AppText>
      ) : onPress ? (
        <AppIcon name="ChevronRight" size={16} color={printerUi.muted} />
      ) : null}
    </Pressable>
  );
});

const settings = StyleSheet.create({
  wrap: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  last: { borderBottomWidth: 0 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: printerUi.text },
  titleDestructive: { color: printerUi.red },
  sub: { fontSize: 12, fontWeight: '500', color: printerUi.muted },
  value: { fontSize: 14, fontWeight: '500', color: printerUi.muted },
  valueDestructive: { color: printerUi.red },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});

// ─── MiniStat ─────────────────────────────────────────────────────────────────

type MiniStatTone = 'default' | 'green' | 'blue' | 'orange';

const TONE: Record<MiniStatTone, { iconBg: string; iconColor: string; valueColor: string }> = {
  default: { iconBg: '#F2F2F7',        iconColor: printerUi.muted,   valueColor: printerUi.text   },
  green:   { iconBg: printerUi.greenSoft,  iconColor: printerUi.green,  valueColor: printerUi.green  },
  blue:    { iconBg: printerUi.accentSoft, iconColor: printerUi.accent, valueColor: printerUi.accent },
  orange:  { iconBg: printerUi.orangeSoft, iconColor: printerUi.orange, valueColor: printerUi.orange },
};

export const PrinterMiniStat = memo(function PrinterMiniStat({
  icon, value, label, tone = 'default',
}: {
  icon: AppIconName;
  value: string;
  label: string;
  tone?: MiniStatTone;
}) {
  const c = TONE[tone];
  return (
    <View style={mini.wrap}>
      <View style={[mini.icon, { backgroundColor: c.iconBg }]}>
        <AppIcon name={icon} size={16} color={c.iconColor} />
      </View>
      <AppText style={[mini.value, { color: c.valueColor }]} numberOfLines={1}>{value}</AppText>
      <AppText style={mini.label} numberOfLines={1}>{label}</AppText>
    </View>
  );
});

const mini = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 96,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...printerUi.shadow,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: printerUi.muted,
    textAlign: 'center',
  },
});

// ─── PrinterMiniStatGrid ──────────────────────────────────────────────────────

export function PrinterMiniStatGrid({
  children, style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[miniGrid.wrap, style]}>{children}</View>;
}

const miniGrid = StyleSheet.create({ wrap: { flexDirection: 'row', gap: 10 } });

// ─── StatsBand ────────────────────────────────────────────────────────────────

export type StatsBandItem = {
  icon: AppIconName;
  value: string;
  label: string;
  tone?: MiniStatTone;
};

export const PrinterStatsBand = memo(function PrinterStatsBand({
  title = 'Period snapshot',
  items,
  style,
  embedded,
}: {
  title?: string;
  items: StatsBandItem[];
  style?: ViewStyle;
  embedded?: boolean;
}) {
  return (
    <View style={[band.wrap, embedded && band.embedded, style]}>
      <View style={band.header}>
        <AppText style={band.headerTitle}>{title}</AppText>
        <View style={band.dots}>
          <View style={[band.dot, { backgroundColor: printerUi.accent }]} />
          <View style={[band.dot, { backgroundColor: printerUi.green }]} />
          <View style={[band.dot, { backgroundColor: printerUi.orange }]} />
        </View>
      </View>
      <View style={band.row}>
        {items.map((item, index) => {
          const c = TONE[item.tone ?? 'default'];
          const isLast = index === items.length - 1;
          return (
            <View key={`${item.label}-${index}`} style={[band.cell, isLast && band.cellLast]}>
              <View style={[band.cellIcon, { backgroundColor: c.iconBg }]}>
                <AppIcon name={item.icon} size={14} color={c.iconColor} />
              </View>
              <AppText style={[band.cellValue, { color: c.valueColor }]} numberOfLines={1}>
                {item.value}
              </AppText>
              <AppText style={band.cellLabel} numberOfLines={1}>{item.label}</AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const band = StyleSheet.create({
  wrap: {
    borderRadius: printerUi.radiusLg,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    overflow: 'hidden',
    ...printerUi.shadow,
  },
  embedded: {
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: printerUi.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: printerUi.border,
    gap: 5,
  },
  cellLast: { borderRightWidth: 0 },
  cellIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: printerUi.muted,
    textAlign: 'center',
  },
});

// ─── PrinterJobRow ────────────────────────────────────────────────────────────

export const PrinterJobRow = memo(function PrinterJobRow({
  id, status, onPress,
}: {
  id: string;
  status: 'Todo' | 'Doing' | 'Done';
  onPress?: () => void;
}) {
  const pill =
    status === 'Done'
      ? { bg: printerUi.greenSoft, color: printerUi.green }
      : status === 'Doing'
        ? { bg: printerUi.accentSoft, color: printerUi.accent }
        : { bg: printerUi.orangeSoft, color: printerUi.orange };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [jobRow.wrap, pressed && { opacity: 0.85 }]}
    >
      <View style={[jobRow.accentBar, { backgroundColor: pill.color }]} />
      <View style={jobRow.body}>
        <AppText style={jobRow.label}>JOB</AppText>
        <AppText style={jobRow.id}>{id}</AppText>
      </View>
      <View style={[jobRow.pill, { backgroundColor: pill.bg }]}>
        <AppText style={[jobRow.pillText, { color: pill.color }]}>{status}</AppText>
      </View>
    </Pressable>
  );
});

const jobRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    overflow: 'hidden',
    ...printerUi.shadow,
  },
  accentBar: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, paddingHorizontal: 14 },
  label: { fontSize: 10, fontWeight: '700', color: printerUi.muted, letterSpacing: 0.4 },
  id: { marginTop: 2, fontSize: 17, fontWeight: '700', color: printerUi.text },
  pill: {
    marginRight: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
});

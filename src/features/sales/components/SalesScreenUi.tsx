/**
 * Sales design tokens and UI primitives.
 * Fully independent from PrinterScreenUi — Apple iOS orange accent palette.
 *
 * Colour language:
 *   bg         #F2F2F7   — iOS system grouped background
 *   surface    #FFFFFF   — card surface
 *   border     rgba(60,60,67,0.12)  — iOS separator
 *   text       #1C1C1E   — iOS label
 *   secondary  #3C3C43   — iOS secondary label (60 % opacity approximation)
 *   muted      #8E8E93   — iOS tertiary label
 *   accent     #FF9500   — NFC Global orange
 *   accentSoft #FFF3E0   — tint behind orange icons
 *   blue       #007AFF   — iOS blue
 *   green      #34C759   — iOS green
 *   red        #FF3B30   — iOS red
 */

import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';

// ─── Tokens ──────────────────────────────────────────────────────────────────

export const salesUi = {
  // Backgrounds
  bg: '#F2F2F7',
  bgGrouped: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',

  // Borders & separators
  border: 'rgba(60,60,67,0.12)',
  separator: 'rgba(60,60,67,0.12)',

  // Text
  text: '#1C1C1E',
  textSecondary: 'rgba(60,60,67,0.6)',
  muted: '#8E8E93',

  // Accents
  accent: '#FF9500',
  accentSoft: '#FFF3E0',
  accentDark: '#E68600',

  // System colours
  blue: '#007AFF',
  blueSoft: '#EAF3FF',
  green: '#34C759',
  greenSoft: '#ECFDF3',
  red: '#FF3B30',
  redSoft: '#FFF0F0',
  orange: '#FF9500',
  orangeSoft: '#FFF3E0',
  purple: '#5856D6',
  purpleSoft: '#F0EEFF',

  // Radii (iOS-native feel)
  radiusXl: 22,
  radiusLg: 18,
  radiusMd: 14,
  radiusSm: 10,
  radiusXs: 8,

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
} as const;

// ─── SalesScreenHeader ────────────────────────────────────────────────────────

export function SalesScreenHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <View style={header.wrap}>
      <View style={header.copy}>
        <AppText style={header.title}>{title}</AppText>
        {sub ? <AppText style={header.sub}>{sub}</AppText> : null}
      </View>
      {right ? <View style={header.right}>{right}</View> : null}
    </View>
  );
}

const header = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  copy: { flex: 1, gap: 2 },
  title: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    color: salesUi.text,
    letterSpacing: 0.37,
  },
  sub: {
    fontSize: 13,
    fontWeight: '500',
    color: salesUi.muted,
  },
  right: {
    marginLeft: 12,
  },
});

// ─── SalesSegment (iOS-style pill segmented control) ─────────────────────────

export function SalesSegment<T extends string>({
  items,
  active,
  onChange,
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
    marginTop: 12,
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 3,
    ...salesUi.shadow,
  },
  scroll: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 1,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: salesUi.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnActive: {
    backgroundColor: salesUi.accent,
    ...salesUi.shadow,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: salesUi.muted,
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

// ─── SalesSurfaceCard ─────────────────────────────────────────────────────────

export function SalesSurfaceCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[card.wrap, style]}>
      {children}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    overflow: 'hidden',
    ...salesUi.shadow,
  },
});

// ─── SalesInfoRow ─────────────────────────────────────────────────────────────

export function SalesInfoRow({
  icon,
  title,
  value,
  last,
}: {
  icon: AppIconName;
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[row.wrap, last && row.last]}>
      <SquircleIconTile name={icon} sizeKey="sm" iconColor={salesUi.accent} />
      <AppText style={row.title}>{title}</AppText>
      <AppText style={row.value} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
  },
  last: { borderBottomWidth: 0 },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: salesUi.text,
  },
  value: {
    maxWidth: 140,
    fontSize: 14,
    fontWeight: '500',
    color: salesUi.muted,
    textAlign: 'right',
  },
});

// ─── SalesMenuRow ─────────────────────────────────────────────────────────────

export function SalesMenuRow({
  icon,
  title,
  onPress,
  last,
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
      <SquircleIconTile name={icon} sizeKey="sm" iconColor={salesUi.accent} />
      <AppText style={menu.title}>{title}</AppText>
      <AppIcon name="ChevronRight" size={16} color={salesUi.muted} />
    </Pressable>
  );
}

const menu = StyleSheet.create({
  wrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
  },
  last: { borderBottomWidth: 0 },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: salesUi.text,
  },
  pressed: { opacity: 0.6 },
});

// ─── SalesSettingsRow ─────────────────────────────────────────────────────────

export function SalesSettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive,
  last,
  disabled,
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
        iconColor={destructive ? salesUi.red : salesUi.accent}
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
        <AppIcon name="ChevronRight" size={16} color={salesUi.muted} />
      ) : null}
    </Pressable>
  );
}

const settings = StyleSheet.create({
  wrap: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
  },
  last: { borderBottomWidth: 0 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: salesUi.text },
  titleDestructive: { color: salesUi.red },
  sub: { fontSize: 12, fontWeight: '500', color: salesUi.muted },
  value: { fontSize: 14, fontWeight: '500', color: salesUi.muted },
  valueDestructive: { color: salesUi.red },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});

// ─── SalesMiniStat ────────────────────────────────────────────────────────────

type MiniStatTone = 'default' | 'green' | 'blue' | 'orange';

const TONE: Record<MiniStatTone, { iconBg: string; iconColor: string; valueColor: string }> = {
  default: { iconBg: '#F2F2F7', iconColor: salesUi.muted, valueColor: salesUi.text },
  green: { iconBg: salesUi.greenSoft, iconColor: salesUi.green, valueColor: salesUi.green },
  blue: { iconBg: salesUi.blueSoft, iconColor: salesUi.blue, valueColor: salesUi.blue },
  orange: { iconBg: salesUi.orangeSoft, iconColor: salesUi.accent, valueColor: salesUi.accent },
};

export function SalesMiniStat({
  icon,
  value,
  label,
  tone = 'default',
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
      <AppText style={[mini.value, { color: c.valueColor }]} numberOfLines={1}>
        {value}
      </AppText>
      <AppText style={mini.label} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const mini = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 96,
    borderRadius: salesUi.radiusMd,
    backgroundColor: salesUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...salesUi.shadow,
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
    color: salesUi.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: salesUi.muted,
    textAlign: 'center',
  },
});

// ─── SalesMiniStatGrid ────────────────────────────────────────────────────────

export function SalesMiniStatGrid({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[miniGrid.wrap, style]}>{children}</View>;
}

const miniGrid = StyleSheet.create({ wrap: { flexDirection: 'row', gap: 10 } });

// ─── SalesStatsBand ───────────────────────────────────────────────────────────

export type StatsBandItem = {
  icon: AppIconName;
  value: string;
  label: string;
  tone?: MiniStatTone;
};

export function SalesStatsBand({
  title = 'Summary',
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
          <View style={[band.dot, { backgroundColor: salesUi.blue }]} />
          <View style={[band.dot, { backgroundColor: salesUi.green }]} />
          <View style={[band.dot, { backgroundColor: salesUi.accent }]} />
        </View>
      </View>
      <View style={band.row}>
        {items.map((item, index) => {
          const c = TONE[item.tone ?? 'default'];
          const isLast = index === items.length - 1;
          return (
            <View
              key={`${item.label}-${index}`}
              style={[band.cell, isLast && band.cellLast]}
            >
              <View style={[band.cellIcon, { backgroundColor: c.iconBg }]}>
                <AppIcon name={item.icon} size={14} color={c.iconColor} />
              </View>
              <AppText style={[band.cellValue, { color: c.valueColor }]} numberOfLines={1}>
                {item.value}
              </AppText>
              <AppText style={band.cellLabel} numberOfLines={1}>
                {item.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const band = StyleSheet.create({
  wrap: {
    borderRadius: salesUi.radiusLg,
    backgroundColor: salesUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    overflow: 'hidden',
    ...salesUi.shadow,
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
    borderBottomColor: salesUi.border,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.muted,
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
    borderRightColor: salesUi.border,
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
    color: salesUi.muted,
    textAlign: 'center',
  },
});

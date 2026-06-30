import { useMemo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';
import { AppText } from '@/src/components/AppText';
import { SNAP_TAP_PAGE_BG } from '@/src/constants/brandAssets';
import { SNAP_TAP_BORDER, SNAP_TAP_BRAND, SNAP_TAP_BRAND_SOFT, SNAP_TAP_CARD_BORDER, SNAP_TAP_CARD_SURFACE, SNAP_TAP_GRAY, SNAP_TAP_TEXT, SNAP_TAP_WHITE } from '@/src/constants/snapTapBrand';
import { iosDesign } from '@/src/design-system/ios';
import { usePreferences } from '@/src/hooks/usePreferences';

/** Guest consumer UI — aligned with sales/printer premium tokens. */
export const guestUi = {
  bg: SNAP_TAP_PAGE_BG,
  surface: SNAP_TAP_WHITE,
  surfaceSoft: '#F5F5F7',
  border: SNAP_TAP_BORDER,
  text: SNAP_TAP_TEXT,
  muted: SNAP_TAP_GRAY,
  accent: SNAP_TAP_BRAND,
  accentSoft: SNAP_TAP_BRAND_SOFT,
  charcoal: SNAP_TAP_TEXT,
  radiusLg: iosDesign.radius.lg,
  radiusMd: iosDesign.radius.md,
  radiusSm: iosDesign.radius.sm,
  shadow: iosDesign.shadows.card,
  shadowFloating: iosDesign.shadows.floating,
} as const;

export function useGuestUi() {
  const { colors } = usePreferences();

  return useMemo(
    () => ({
      bg: SNAP_TAP_PAGE_BG,
      surface: colors.surface,
      surfaceSoft: colors.surfaceSoft,
      border: colors.border,
      text: colors.textPrimary,
      muted: colors.textMuted,
      accent: colors.primary,
      accentSoft: colors.primarySoft,
      charcoal: colors.textPrimary,
      radiusLg: iosDesign.radius.lg,
      radiusMd: iosDesign.radius.md,
      radiusSm: iosDesign.radius.sm,
      shadow: iosDesign.shadows.card,
      shadowFloating: iosDesign.shadows.floating,
    }),
    [colors]
  );
}

export function GuestDemoPill({ label = 'DEMO' }: { label?: string }) {
  return (
    <View style={ui.demoPill}>
      <AppText style={ui.demoPillText}>{label}</AppText>
    </View>
  );
}

export function GuestHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <LinearGradient
      colors={['#1C1C1E', '#2C2C2E', '#1C1C1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={ui.hero}
    >
      <GuestDemoPill label="GUEST PREVIEW" />
      <AppText style={ui.heroEyebrow}>{eyebrow}</AppText>
      <AppText style={ui.heroTitle}>{title}</AppText>
      <AppText style={ui.heroSub}>{subtitle}</AppText>
    </LinearGradient>
  );
}

/** Default squircle size for guest list tiles (profile, settings rows, etc.). */
export const GUEST_TILE_ICON_SIZE = 'md' as const;

/** Locked action — squircle icon + plain lock indicator on the right. */
export function GuestLockedTile({
  icon,
  title,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  onPress: () => void;
  accent?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [ui.quickTile, pressed && ui.quickTilePressed]}
      accessibilityRole="button"
    >
      <SquircleIconTile name={icon} sizeKey={GUEST_TILE_ICON_SIZE} />
      <AppText style={ui.lockedTileTitle}>{title}</AppText>
      <AppIcon name="ShieldCheck" size={18} color={guestUi.muted} />
    </Pressable>
  );
}

export function GuestQuickTile({
  icon,
  title,
  description,
  onPress,
  style,
}: {
  icon: AppIconName;
  title: string;
  description: string;
  onPress: () => void;
  accent?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [ui.quickTile, style, pressed && ui.quickTilePressed]}
      accessibilityRole="button"
    >
      <SquircleIconTile name={icon} sizeKey={GUEST_TILE_ICON_SIZE} />
      <View style={ui.quickCopy}>
        <AppText style={ui.quickTitle}>{title}</AppText>
        <AppText style={ui.quickDesc}>{description}</AppText>
      </View>
      <AppIcon name="ChevronRight" size={18} color={guestUi.muted} />
    </Pressable>
  );
}

export function GuestSurfaceCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={ui.surfaceCard}>
      {title ? <AppText style={ui.surfaceTitle}>{title}</AppText> : null}
      {children}
    </View>
  );
}

export function GuestHintBanner({ children }: { children: ReactNode }) {
  return (
    <View style={ui.hintBanner}>
      <AppIcon name="Info" size={16} color={SNAP_TAP_GRAY} />
      <View style={ui.hintCopy}>{children}</View>
    </View>
  );
}

/** Centered title + back — Veloxpay-style choose-card header. */
export function GuestCenteredHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <View style={ui.centeredHeader}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={({ pressed }) => [ui.centeredBack, pressed && ui.centeredBackPressed]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <AppIcon name="ChevronLeft" size={24} color={guestUi.text} />
      </Pressable>
      <AppText style={ui.centeredTitle}>{title}</AppText>
      <View style={ui.centeredSpacer} />
    </View>
  );
}

export type GuestFormTab = 'customer' | 'product' | 'payment';

const GUEST_FORM_TAB_META: { key: GuestFormTab; label: string; icon: AppIconName }[] = [
  { key: 'customer', label: 'Customer', icon: 'User' },
  { key: 'product', label: 'Product', icon: 'Package' },
  { key: 'payment', label: 'Payment', icon: 'Wallet' },
];

/** Customer | Product | Payment — navy active pill, grey inactive (printer/sales reference). */
export function GuestFormStepTabs({
  active,
  activeStepIndex,
  onChange,
  canSwitchTo,
  compact,
}: {
  active: GuestFormTab;
  activeStepIndex: number;
  onChange: (tab: GuestFormTab) => void;
  /** When set, only these tabs are tappable (step-by-step). */
  canSwitchTo?: (tab: GuestFormTab) => boolean;
  compact?: boolean;
}) {
  return (
    <View style={[ui.formTabTrack, compact && ui.formTabTrackCompact]}>
      {GUEST_FORM_TAB_META.map((tab, index) => {
        const isActive = tab.key === active;
        const isDone = index < activeStepIndex;
        const enabled = canSwitchTo ? canSwitchTo(tab.key) : true;
        return (
          <Pressable
            key={tab.key}
            onPress={() => enabled && onChange(tab.key)}
            disabled={!enabled}
            style={[
              ui.formTabItem,
              isActive && ui.formTabItemActive,
              !enabled && !isActive && ui.formTabItemDisabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: !enabled }}
          >
            {isDone || isActive ? (
              <View
                style={[
                  ui.formTabDot,
                  isDone && ui.formTabDotDone,
                  isActive && ui.formTabDotActive,
                ]}
              />
            ) : null}
            <AppIcon name={tab.icon} size={12} color={isActive ? '#FFFFFF' : '#94A3B8'} />
            <AppText style={[ui.formTabLabel, isActive && ui.formTabLabelActive]}>{tab.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GuestFormIconCard({
  children,
  style,
  flat,
  inset,
}: {
  children: ReactNode;
  style?: ViewStyle;
  /** No outer box — hairline rows only. */
  flat?: boolean;
  /** Soft grouped fields — iOS Settings-style unified card. */
  inset?: boolean;
}) {
  const shellStyle = inset ? ui.formIconCardInset : flat ? ui.formIconCardFlat : ui.formIconCard;
  return <View style={[shellStyle, style]}>{children}</View>;
}

export function GuestFormIconRow({
  icon,
  value,
  onChangeText,
  placeholder,
  last,
  compact,
  inset,
  ...inputProps
}: {
  icon: AppIconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  last?: boolean;
  compact?: boolean;
  inset?: boolean;
} & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoCorrect'>) {
  const rowStyle = inset
    ? ui.formIconRowInset
    : compact
      ? ui.formIconRowCompact
      : ui.formIconRow;

  return (
    <View style={[rowStyle, last && ui.formIconRowLast]}>
      <View style={ui.formIconGlyph}>
        <AppIcon name={icon} size={16} color={SNAP_TAP_BRAND} />
      </View>
      <TextInput
        style={ui.formIconInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B0B8C1"
        {...inputProps}
      />
    </View>
  );
}

export function GuestFormSummaryRow({
  icon,
  label,
  value,
  last,
  compact,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  last?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[compact ? ui.formSummaryRowCompact : ui.formSummaryRow, last && ui.formIconRowLast]}>
      {compact ? (
        <AppIcon name={icon} size={14} color={SNAP_TAP_BRAND} />
      ) : (
        <SquircleIconTile name={icon} sizeKey="sm" />
      )}
      <AppText style={[ui.formSummaryLabel, compact && ui.formSummaryLabelCompact]}>{label}</AppText>
      <AppText style={ui.formSummaryValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

export function GuestSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={ui.segmentTrack}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[ui.segmentItem, active && ui.segmentItemActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <AppText style={[ui.segmentLabel, active && ui.segmentLabelActive]}>{opt.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const ui = StyleSheet.create({
  demoPill: {
    alignSelf: 'flex-start',
    backgroundColor: SNAP_TAP_BRAND_SOFT,
    borderRadius: iosDesign.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37,150,190,0.28)',
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: SNAP_TAP_BRAND,
  },
  hero: {
    borderRadius: guestUi.radiusLg,
    padding: iosDesign.spacing.lg,
    gap: 6,
    ...guestUi.shadowFloating,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    marginTop: 2,
  },
  quickTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.md,
    backgroundColor: SNAP_TAP_CARD_SURFACE,
    borderRadius: guestUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_CARD_BORDER,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  quickTilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  quickCopy: {
    flex: 1,
    gap: 2,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: guestUi.text,
  },
  quickDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: guestUi.muted,
    lineHeight: 16,
  },
  lockedTileTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: guestUi.text,
  },
  surfaceCard: {
    backgroundColor: SNAP_TAP_CARD_SURFACE,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_CARD_BORDER,
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.sm,
    ...guestUi.shadow,
  },
  surfaceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: guestUi.text,
    letterSpacing: -0.1,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: iosDesign.spacing.sm,
    backgroundColor: SNAP_TAP_WHITE,
    borderRadius: guestUi.radiusMd,
    padding: iosDesign.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_BORDER,
    ...guestUi.shadow,
  },
  hintCopy: {
    flex: 1,
    gap: 2,
  },
  centeredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosDesign.spacing.xs,
    paddingVertical: iosDesign.spacing.sm,
  },
  centeredBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredBackPressed: { opacity: 0.55 },
  centeredTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: guestUi.text,
    letterSpacing: -0.2,
  },
  centeredSpacer: { width: 40 },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: guestUi.surfaceSoft,
    borderRadius: iosDesign.radius.pill,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: iosDesign.radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: guestUi.surface,
    ...guestUi.shadow,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: guestUi.muted,
  },
  segmentLabelActive: {
    color: guestUi.text,
    fontWeight: '700',
  },
  formTabTrack: {
    height: 40,
    borderRadius: 14,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    ...guestUi.shadow,
  },
  formTabTrackCompact: {
    height: 34,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
    gap: 6,
  },
  formTabItem: {
    flex: 1,
    height: '100%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  formTabItemActive: {
    backgroundColor: SNAP_TAP_BRAND,
  },
  formTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
  },
  formTabDotDone: {
    backgroundColor: '#30D158',
  },
  formTabDotActive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#AEAEB2',
  },
  formTabItemDisabled: {
    opacity: 0.45,
  },
  formTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  formTabLabelActive: {
    color: '#FFFFFF',
  },
  formIconCard: {
    borderRadius: guestUi.radiusLg,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    overflow: 'hidden',
    ...guestUi.shadow,
  },
  formIconCardFlat: {
    overflow: 'hidden',
  },
  // Unified iOS-style grouped card — one surface, dividers between rows only
  formIconCardInset: {
    borderRadius: guestUi.radiusLg,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    overflow: 'hidden',
    ...guestUi.shadow,
  },
  formIconGlyph: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formIconRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: iosDesign.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  formIconRowCompact: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8ED',
  },
  // Inset row — sits inside the unified card, uses internal dividers only
  formIconRowInset: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
    backgroundColor: 'transparent',
  },
  formIconRowLast: {
    borderBottomWidth: 0,
  },
  formIconInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    padding: 0,
  },
  formIconInputInset: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  formSummaryRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: iosDesign.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  formSummaryRowCompact: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8ED',
  },
  formSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    width: 72,
  },
  formSummaryLabelCompact: {
    fontSize: 12,
    width: 64,
  },
  formSummaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
});

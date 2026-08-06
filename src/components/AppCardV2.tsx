/**
 * AppCardV2 — Premium Card Component
 * Redesigned with world-class elevation system
 * Uses new design token system for consistency
 * 
 * Features:
 * - 4 elevation levels (flat, subtle, elevated, floating)
 * - Token-based spacing and radius (8pt grid)
 * - Semantic color system with theme awareness
 * - Platform-optimized shadows
 * - Flexible padding and border options
 * - Accessible by default
 */

import React, { memo, type PropsWithChildren, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle, Pressable } from 'react-native';

import { tokens } from '@/src/design-system/tokens';
import {
  card,
  getShadow,
  getColor,
  padding as getPadding,
  rounded,
  type ColorMode,
  type ShadowToken,
  type RadiusToken,
  type SpacingToken,
} from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CardElevation = 'flat' | 'subtle' | 'elevated' | 'floating';

export interface AppCardV2Props {
  /** Card content */
  children?: ReactNode;
  /** Elevation level - controls shadow */
  elevation?: CardElevation;
  /** Border radius token */
  radius?: RadiusToken;
  /** Padding token */
  padding?: SpacingToken;
  /** Show border (only for flat elevation) */
  bordered?: boolean;
  /** Background color override */
  backgroundColor?: string;
  /** Make card pressable */
  onPress?: () => void;
  /** Custom container styles */
  style?: StyleProp<ViewStyle>;
  /** Custom content wrapper styles */
  contentStyle?: StyleProp<ViewStyle>;
  /** Header section */
  header?: ReactNode;
  /** Footer section */
  footer?: ReactNode;
  /** Test ID for testing */
  testID?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ELEVATION_CONFIG: Record<CardElevation, { shadow: ShadowToken; bordered: boolean }> = {
  flat: { shadow: 'none', bordered: true },
  subtle: { shadow: 'sm', bordered: false },
  elevated: { shadow: 'md', bordered: false },
  floating: { shadow: 'lg', bordered: false },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AppCardV2Raw({
  children,
  elevation = 'flat',
  radius = 'xxl',
  padding = 5,
  bordered,
  backgroundColor,
  onPress,
  style,
  contentStyle,
  header,
  footer,
  testID,
}: PropsWithChildren<AppCardV2Props>) {
  // ─── Theme ───────────────────────────────────────────────────────────────
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  // ─── Configuration ───────────────────────────────────────────────────────
  const elevationConfig = ELEVATION_CONFIG[elevation];
  const shouldShowBorder = bordered ?? elevationConfig.bordered;

  // ─── Styles ──────────────────────────────────────────────────────────────
  const containerStyle: ViewStyle = {
    backgroundColor: backgroundColor || getColor('surface', mode),
    borderRadius: tokens.radius[radius],
    ...(shouldShowBorder && {
      borderWidth: 0.5,
      borderColor: getColor('border', mode),
    }),
    ...getShadow(elevationConfig.shadow),
  };

  const paddingStyle = getPadding(padding, padding, padding, padding);

  // ─── Render ──────────────────────────────────────────────────────────────
  const content = (
    <>
      {header && (
        <View style={[paddingStyle, { paddingBottom: tokens.spacing[3] }]}>
          {header}
        </View>
      )}
      
      <View style={[paddingStyle, contentStyle]}>
        {children}
      </View>

      {footer && (
        <View style={[paddingStyle, { paddingTop: tokens.spacing[3] }]}>
          {footer}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={null}
        accessibilityRole="button"
        testID={testID}
        style={[containerStyle, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {content}
    </View>
  );
}

export const AppCardV2 = memo(AppCardV2Raw);

// ═══════════════════════════════════════════════════════════════════════════
// PRESET CARDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compact Card - Smaller padding, tighter spacing
 */
export function CompactCard(props: AppCardV2Props) {
  return <AppCardV2 elevation="flat" radius="xl" padding={3} {...props} />;
}

/**
 * Standard Card - Default spacing
 */
export function StandardCard(props: AppCardV2Props) {
  return <AppCardV2 elevation="subtle" radius="xxl" padding={5} {...props} />;
}

/**
 * Hero Card - Large, prominent card
 */
export function HeroCard(props: AppCardV2Props) {
  return <AppCardV2 elevation="elevated" radius="xxxl" padding={6} {...props} />;
}

/**
 * Floating Card - Maximum elevation, for overlays
 */
export function FloatingCard(props: AppCardV2Props) {
  return <AppCardV2 elevation="floating" radius="xxl" padding={6} {...props} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALIZED CARDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Metric Card - For displaying statistics
 */
export function MetricCardV2({
  label,
  value,
  trend,
  icon,
  onPress,
}: {
  label: string;
  value: string | number;
  trend?: ReactNode;
  icon?: ReactNode;
  onPress?: () => void;
}) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  return (
    <AppCardV2 elevation="subtle" radius="xl" padding={4} onPress={onPress}>
      <View style={{ gap: tokens.spacing[3] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            {/* Label would go here with proper Text component */}
          </View>
          {icon}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: tokens.spacing[2] }}>
          <View>{/* Value with large typography */}</View>
          {trend}
        </View>
      </View>
    </AppCardV2>
  );
}

/**
 * Info Card - For informational messages
 */
export function InfoCardV2({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  return (
    <AppCardV2
      elevation="flat"
      radius="xl"
      padding={4}
      backgroundColor={getColor('primarySoft', mode)}
      bordered={false}
    >
      <View style={{ gap: tokens.spacing[3] }}>
        <View style={{ flexDirection: 'row', gap: tokens.spacing[3] }}>
          {icon}
          <View style={{ flex: 1, gap: tokens.spacing[1] }}>
            {/* Title and message with proper Text components */}
          </View>
        </View>
        {action && <View>{action}</View>}
      </View>
    </AppCardV2>
  );
}

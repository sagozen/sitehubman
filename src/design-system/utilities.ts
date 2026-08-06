/**
 * Design System Utilities
 * Helper functions for working with design tokens
 * Intentional, precise, production-ready
 */

import { type TextStyle, type ViewStyle } from 'react-native';
import { tokens } from './tokens';

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type TypographyVariant = keyof typeof tokens.typography.scale;
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

/**
 * Get typography styles for a specific variant
 */
export function getTypography(
  variant: TypographyVariant,
  weight?: FontWeight,
): TextStyle {
  const scale = tokens.typography.scale[variant];
  const fontFamily = weight
    ? tokens.typography.fontFamily[weight]
    : tokens.typography.fontFamily.regular;

  return {
    fontFamily,
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    letterSpacing: scale.letterSpacing,
    fontWeight: scale.fontWeight,
  };
}

/**
 * Create custom typography with overrides
 */
export function createTypography(
  variant: TypographyVariant,
  overrides?: Partial<TextStyle>,
): TextStyle {
  return {
    ...getTypography(variant),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type ColorMode = 'light' | 'dark';
export type ColorToken = keyof typeof tokens.colors.light;

/**
 * Get color value based on theme mode
 */
export function getColor(
  token: ColorToken,
  mode: ColorMode = 'light',
): string {
  return tokens.colors[mode][token];
}

/**
 * Get semantic status color
 */
export function getStatusColor(
  status: 'success' | 'warning' | 'error' | 'info',
  mode: ColorMode = 'light',
  variant: 'base' | 'soft' | 'dark' | 'text' = 'base',
): string {
  const suffix = variant === 'base' ? '' : variant.charAt(0).toUpperCase() + variant.slice(1);
  const key = `${status}${suffix}` as ColorToken;
  return getColor(key, mode);
}

/**
 * Get role-based color
 */
export function getRoleColor(
  role: 'sales' | 'production' | 'admin' | 'customer',
  variant: 'base' | 'soft' = 'base',
): string {
  const key = variant === 'base' ? role : `${role}Soft`;
  return tokens.colors.roles[key as keyof typeof tokens.colors.roles];
}

/**
 * Adjust color opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Handle rgba
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  
  // Handle rgb
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  // Handle hex
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return color;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPACING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type SpacingToken = keyof typeof tokens.spacing;

/**
 * Get spacing value
 */
export function getSpacing(...values: SpacingToken[]): number[] {
  return values.map((v) => tokens.spacing[v]);
}

/**
 * Create margin styles
 */
export function margin(
  top?: SpacingToken,
  right?: SpacingToken,
  bottom?: SpacingToken,
  left?: SpacingToken,
): ViewStyle {
  return {
    marginTop: top !== undefined ? tokens.spacing[top] : undefined,
    marginRight: right !== undefined ? tokens.spacing[right] : undefined,
    marginBottom: bottom !== undefined ? tokens.spacing[bottom] : undefined,
    marginLeft: left !== undefined ? tokens.spacing[left] : undefined,
  };
}

/**
 * Create padding styles
 */
export function padding(
  top?: SpacingToken,
  right?: SpacingToken,
  bottom?: SpacingToken,
  left?: SpacingToken,
): ViewStyle {
  return {
    paddingTop: top !== undefined ? tokens.spacing[top] : undefined,
    paddingRight: right !== undefined ? tokens.spacing[right] : undefined,
    paddingBottom: bottom !== undefined ? tokens.spacing[bottom] : undefined,
    paddingLeft: left !== undefined ? tokens.spacing[left] : undefined,
  };
}

/**
 * Create uniform spacing
 */
export function space(value: SpacingToken): ViewStyle {
  return {
    padding: tokens.spacing[value],
  };
}

/**
 * Create horizontal spacing
 */
export function spaceX(value: SpacingToken): ViewStyle {
  return {
    paddingHorizontal: tokens.spacing[value],
  };
}

/**
 * Create vertical spacing
 */
export function spaceY(value: SpacingToken): ViewStyle {
  return {
    paddingVertical: tokens.spacing[value],
  };
}

/**
 * Create gap between flex children
 */
export function gap(value: SpacingToken): ViewStyle {
  return {
    gap: tokens.spacing[value],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BORDER & RADIUS UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type RadiusToken = keyof typeof tokens.radius;

/**
 * Get border radius value
 */
export function getRadius(token: RadiusToken): number {
  return tokens.radius[token];
}

/**
 * Create border radius styles
 */
export function rounded(token: RadiusToken): ViewStyle {
  return {
    borderRadius: tokens.radius[token],
  };
}

/**
 * Create border styles
 */
export function border(
  width: number = 1,
  color: string,
  radius?: RadiusToken,
): ViewStyle {
  return {
    borderWidth: width,
    borderColor: color,
    ...(radius ? { borderRadius: tokens.radius[radius] } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SHADOW UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type ShadowToken = keyof typeof tokens.shadows;

/**
 * Get shadow styles
 */
export function getShadow(token: ShadowToken): ViewStyle {
  return tokens.shadows[token];
}

/**
 * Combine multiple shadows (web only, returns last on native)
 */
export function combineShadows(...shadows: ShadowToken[]): ViewStyle {
  // On native, only the last shadow applies
  return tokens.shadows[shadows[shadows.length - 1]];
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create flex container
 */
export function flex(
  direction: 'row' | 'column' = 'column',
  align?: ViewStyle['alignItems'],
  justify?: ViewStyle['justifyContent'],
  wrap?: ViewStyle['flexWrap'],
): ViewStyle {
  return {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap,
  };
}

/**
 * Center content
 */
export function center(): ViewStyle {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/**
 * Stack layout (vertical)
 */
export function stack(gap?: SpacingToken): ViewStyle {
  return {
    display: 'flex',
    flexDirection: 'column',
    ...(gap ? { gap: tokens.spacing[gap] } : {}),
  };
}

/**
 * Row layout (horizontal)
 */
export function row(gap?: SpacingToken, align?: ViewStyle['alignItems']): ViewStyle {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: align || 'center',
    ...(gap ? { gap: tokens.spacing[gap] } : {}),
  };
}

/**
 * Create absolute positioning
 */
export function absolute(
  top?: DimensionValue,
  right?: DimensionValue,
  bottom?: DimensionValue,
  left?: DimensionValue,
): ViewStyle {
  return {
    position: 'absolute',
    top,
    right,
    bottom,
    left,
  };
}

/**
 * Full width/height
 */
export function fullSize(): ViewStyle {
  return {
    width: '100%',
    height: '100%',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type IconSizeToken = keyof typeof tokens.iconSize;

/**
 * Get icon size value
 */
export function getIconSize(token: IconSizeToken): number {
  return tokens.iconSize[token];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type ControlSizeToken = keyof typeof tokens.controlHeight;

/**
 * Get control height value
 */
export function getControlHeight(token: ControlSizeToken): number {
  return tokens.controlHeight[token];
}

/**
 * Create button size styles
 */
export function buttonSize(
  size: ControlSizeToken,
  paddingX: SpacingToken = 4,
  radius: RadiusToken = 'lg',
): ViewStyle {
  return {
    height: tokens.controlHeight[size],
    paddingHorizontal: tokens.spacing[paddingX],
    borderRadius: tokens.radius[radius],
  };
}

/**
 * Create input size styles
 */
export function inputSize(
  size: ControlSizeToken,
  paddingX: SpacingToken = 4,
  radius: RadiusToken = 'lg',
): ViewStyle {
  return {
    minHeight: tokens.controlHeight[size],
    paddingHorizontal: tokens.spacing[paddingX],
    borderRadius: tokens.radius[radius],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export type AnimationDuration = keyof typeof tokens.animation.duration;
export type AnimationEasing = keyof typeof tokens.animation.easing;

/**
 * Get animation duration
 */
export function getDuration(token: AnimationDuration): number {
  return tokens.animation.duration[token];
}

/**
 * Get animation easing
 */
export function getEasing(token: AnimationEasing): readonly number[] {
  return tokens.animation.easing[token];
}

/**
 * Get spring configuration
 */
export function getSpring(preset: 'gentle' | 'snappy' | 'bouncy') {
  return tokens.animation.spring[preset];
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create minimum touch target (44x44 iOS, 48x48 Android)
 */
export function touchTarget(size: number = 44): ViewStyle {
  return {
    minWidth: size,
    minHeight: size,
  };
}

/**
 * Create accessible focus ring
 */
export function focusRing(color: string, width: number = 2, offset: number = 2): ViewStyle {
  return {
    borderWidth: width,
    borderColor: color,
    // Note: outline offset not supported on React Native, use margin workaround
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if viewport is above breakpoint (web only)
 */
export function isAboveBreakpoint(
  width: number,
  breakpoint: keyof typeof tokens.breakpoints,
): boolean {
  return width >= tokens.breakpoints[breakpoint];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create card styles
 */
export function card(
  mode: ColorMode = 'light',
  shadow: ShadowToken = 'none',
  radius: RadiusToken = 'xxl',
  padding: SpacingToken = 5,
): ViewStyle {
  return {
    backgroundColor: getColor('surface', mode),
    borderRadius: tokens.radius[radius],
    padding: tokens.spacing[padding],
    borderWidth: shadow === 'none' ? 0.5 : 0,
    borderColor: getColor('border', mode),
    ...tokens.shadows[shadow],
  };
}

/**
 * Create glass morphism effect
 */
export function glass(
  mode: ColorMode = 'light',
  blur: number = 20,
): ViewStyle {
  return {
    backgroundColor: mode === 'light' 
      ? 'rgba(255,255,255,0.7)' 
      : 'rgba(24,24,27,0.7)',
    borderWidth: 0.5,
    borderColor: mode === 'light'
      ? 'rgba(255,255,255,0.3)'
      : 'rgba(255,255,255,0.1)',
    // Note: Actual blur requires platform-specific implementation
  };
}

/**
 * Create overlay backdrop
 */
export function overlay(opacity: number = 0.5): ViewStyle {
  return {
    ...absolute(0, 0, 0, 0),
    backgroundColor: `rgba(0,0,0,${opacity})`,
  };
}

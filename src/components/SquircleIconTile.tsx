import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';

import { SNAP_TAP_BRAND, SNAP_TAP_SQUIRCLE_ICON, SNAP_TAP_WHITE } from '@/src/constants/snapTapBrand';
import { glassTheme } from '@/src/design-system/glass';

/** White squircle tile; icons default to brand #2596BE on guest UI. */
export const SQUIRCLE_ICON_FILL = SNAP_TAP_SQUIRCLE_ICON;
export const SQUIRCLE_TILE_BG = SNAP_TAP_WHITE;

export const squircleSizes = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 52,
} as const;

type SquircleSizeKey = keyof typeof squircleSizes;

function tileMetrics(size: number) {
  return {
    borderRadius: Math.round(size * (52 / 220)),
    iconSize: Math.round(size * (140 / 220)),
    shadowOffsetY: Math.max(2, Math.round(size * (10 / 220))),
    shadowRadius: Math.max(4, Math.round(size * (30 / 220))),
  };
}

export function squircleTileStyle(size: number): ViewStyle {
  const { borderRadius, shadowOffsetY, shadowRadius } = tileMetrics(size);
  return {
    width: size,
    height: size,
    borderRadius,
    backgroundColor: SQUIRCLE_TILE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: shadowOffsetY },
    shadowOpacity: 0.08,
    shadowRadius,
    elevation: Platform.OS === 'android' ? 4 : undefined,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glassTheme.border.lightHairline,
  };
}

type SquircleIconTileProps = {
  name: AppIconName;
  /** Pixel size of the squircle tile (width = height). */
  size?: number;
  /** Preset size key. */
  sizeKey?: SquircleSizeKey;
  iconColor?: string;
  /** Use #111 for rare neutral-only tiles (default: brand blue). */
  neutral?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * White squircle icon container — homepage / guest UI (not tab bar).
 */
export function SquircleIconTile({
  name,
  size,
  sizeKey = 'md',
  iconColor,
  neutral = false,
  style,
}: SquircleIconTileProps) {
  const resolvedColor = iconColor ?? (neutral ? '#111111' : SNAP_TAP_BRAND);
  const tileSize = size ?? squircleSizes[sizeKey];
  const { iconSize, borderRadius } = tileMetrics(tileSize);

  return (
    <View style={[squircleTileStyle(tileSize), styles.wrap, style]}>
      <View style={[styles.insetHighlight, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} />
      <AppIcon name={name} size={iconSize} color={resolvedColor} />
    </View>
  );
}

type SquircleIconShellProps = {
  size?: number;
  sizeKey?: SquircleSizeKey;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** White squircle container for logos or custom content. */
export function SquircleIconShell({
  children,
  size,
  sizeKey = 'md',
  style,
}: SquircleIconShellProps) {
  const tileSize = size ?? squircleSizes[sizeKey];
  const { borderRadius } = tileMetrics(tileSize);

  return (
    <View style={[squircleTileStyle(tileSize), styles.wrap, style]}>
      <View style={[styles.insetHighlight, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  insetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    pointerEvents: 'none',
  },
});

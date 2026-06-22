import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';

type Props = {
  /** Unused for now; kept so call sites don't break. Falls back to fallbackIcon. */
  realIcon?: string;
  fallbackIcon: AppIconName;
  tint: string;
  size?: number;
  /** Soft color wash behind the icon — Apple Settings-style tinted tile. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Apple Settings-style line tile — monochrome icon on a soft tinted circle.
 * No brand photos, no glow rings, no per-flow rainbow. One calm color.
 */
export function FlowIcon({
  fallbackIcon,
  tint,
  size = 44,
  glow = false,
  style,
}: Props) {
  const iconSize = Math.round(size * 0.5);

  if (!glow) {
    return (
      <View style={[styles.plain, { width: size, height: size }, style]}>
        <AppIcon name={fallbackIcon} size={iconSize} color={tint} />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <View
        style={[
          styles.glow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `${tint}1A`,
          },
        ]}
      />
      <AppIcon name={fallbackIcon} size={iconSize} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
});

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { RealIcon } from '@/src/components/RealIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';

type Props = {
  realIcon: FlowRealIconId;
  fallbackIcon: AppIconName;
  tint: string;
  size?: number;
  /** Soft color wash — no border, no squircle. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Bare icon for flow hubs — no boxes, optional soft glow only. */
export function FlowIcon({
  realIcon,
  fallbackIcon,
  tint,
  size = 44,
  glow = false,
  style,
}: Props) {
  const iconSize = Math.round(size * 0.58);

  if (!glow) {
    return (
      <View style={[styles.plain, { width: size, height: size }, style]}>
        <RealIcon id={realIcon} size={iconSize} color={tint} fallbackIcon={fallbackIcon} />
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
            backgroundColor: `${tint}12`,
          },
        ]}
      />
      <RealIcon id={realIcon} size={iconSize} color={tint} fallbackIcon={fallbackIcon} />
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

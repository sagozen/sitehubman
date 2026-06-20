import { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FlowIcon } from '@/src/components/FlowIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';

type Props = {
  image: ImageSourcePropType;
  realIcon: FlowRealIconId;
  fallbackIcon: AppIconName;
  tint: string;
  size?: number;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Custom connection hub artwork with FlowIcon fallback if image fails. */
export function ConnectionFlowIcon({
  image,
  realIcon,
  fallbackIcon,
  tint,
  size = 48,
  glow = true,
  style,
}: Props) {
  const [failed, setFailed] = useState(false);
  const radius = Math.round(size * 0.28);
  const imageSize = Math.round(size * 0.88);

  if (failed) {
    return (
      <FlowIcon
        realIcon={realIcon}
        fallbackIcon={fallbackIcon}
        tint={tint}
        size={size}
        glow={glow}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      {glow ? (
        <View
          style={[
            styles.glow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: `${tint}14`,
            },
          ]}
        />
      ) : null}
      <Image
        source={image}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: radius,
        }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
});

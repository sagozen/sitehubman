import { BrandImage } from '@/src/components/BrandImage';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BRAND_NAME, brandAssets } from '@/src/constants/brandAssets';
import { SNAP_TAP_BRAND, SNAP_TAP_BRAND_SOFT } from '@/src/constants/snapTapBrand';

type BrandLogoCircleProps = {
  size?: number;
  /** White ring + shadow (login / header). */
  shell?: boolean;
  /** Brand blue ring around the logo (header / home). */
  brandRing?: boolean;
  /** Zoom logo slightly so it fills the circle edge-to-edge. */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Snap Tap logo clipped to a circle — fills the frame without inner padding gaps.
 */
export function BrandLogoCircle({
  size = 56,
  shell = false,
  brandRing = false,
  fill = true,
  style,
}: BrandLogoCircleProps) {
  const radius = size / 2;
  const imageSize = fill ? size * 1.14 : size;

  const logo = (
    <View style={[styles.clip, { width: size, height: size, borderRadius: radius }]}>
      <BrandImage
        source={brandAssets.logo}
        style={[
          styles.image,
          {
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize / 2,
            marginLeft: (size - imageSize) / 2,
            marginTop: (size - imageSize) / 2,
          },
        ]}
        contentFit="cover"
        recyclingKey="snap-tap-logo"
        accessibilityLabel={BRAND_NAME}
      />
    </View>
  );

  if (shell) {
    return (
      <View
        style={[
          styles.shell,
          brandRing && styles.shellBrandRing,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}
      >
        {brandRing ? <View style={[styles.brandGlow, { borderRadius: radius }]} /> : null}
        {logo}
      </View>
    );
  }

  return <View style={style}>{logo}</View>;
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  shellBrandRing: {
    borderWidth: 2,
    borderColor: SNAP_TAP_BRAND,
    shadowColor: SNAP_TAP_BRAND,
    shadowOpacity: 0.22,
  },
  brandGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SNAP_TAP_BRAND_SOFT,
    opacity: 0.55,
  },
  clip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
});

import { StyleProp, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { BrandImage } from '@/src/components/BrandImage';
import { CloudinaryImage } from '@/src/components/CloudinaryImage';
import {
  getMarketingSceneBundled,
  getMarketingSceneCloudUrl,
  type MarketingSceneId,
} from '@/src/constants/marketingScenes';

type Props = {
  sceneId: MarketingSceneId;
  width: number;
  height: number;
  /** Prefer bundled PNG over Cloudinary (recommended until final art is uploaded). */
  preferBundled?: boolean;
  contentFit?: 'cover' | 'contain';
  lazy?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

/**
 * Loads a marketing scene — bundled asset first, Cloudinary optional fallback.
 */
export function MarketingSceneImage({
  sceneId,
  width,
  height,
  preferBundled = true,
  contentFit = 'cover',
  lazy = true,
  accessibilityLabel,
  style,
  imageStyle,
}: Props) {
  const bundled = getMarketingSceneBundled(sceneId);
  const cloudUrl = getMarketingSceneCloudUrl(sceneId, width);
  const useBundled = preferBundled && Boolean(bundled);
  const useCloud = !useBundled && Boolean(cloudUrl);

  return (
    <View style={[styles.wrap, { width, height }, style]}>
      {useBundled && bundled ? (
        <BrandImage
          source={bundled}
          style={[StyleSheet.absoluteFill, imageStyle]}
          contentFit={contentFit}
          recyclingKey={`marketing-${sceneId}`}
        />
      ) : useCloud ? (
        <CloudinaryImage
          uri={cloudUrl}
          width={width}
          height={height}
          crop="cover"
          contentFit={contentFit}
          lazy={lazy}
          accessibilityLabel={accessibilityLabel ?? sceneId}
          style={[StyleSheet.absoluteFill, imageStyle]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  placeholder: {
    backgroundColor: '#E2E8F0',
  },
});

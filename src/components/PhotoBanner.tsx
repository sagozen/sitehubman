import type { ReactNode } from 'react';
import { ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandImage } from '@/src/components/BrandImage';
import { CloudinaryImage } from '@/src/components/CloudinaryImage';
import type { MarketingSceneId } from '@/src/constants/marketingScenes';
import {
  getMarketingSceneBundled,
  getMarketingSceneCloudUrl,
} from '@/src/constants/marketingScenes';
import type { ProductPhotoId } from '@/src/constants/productPhotoCatalog';
import {
  getProductPhotoFallback,
  getProductPhotoUrl,
} from '@/src/constants/productPhotoCatalog';
import { iosDesign } from '@/src/design-system/ios';

type Variant = 'hero' | 'compact' | 'strip';

/** Dark text overlay (default) vs lighter overlay for product photography. */
type OverlayMode = 'text' | 'product' | 'none';

type Props = {
  /** Production marketing scene — bundled PNG preferred over CDN. */
  marketingSceneId?: MarketingSceneId;
  /** Legacy Cloudinary product photo ID. */
  productPhotoId?: ProductPhotoId;
  /** Direct HTTPS URL (Cloudinary or legacy). */
  uri?: string | null;
  /** Bundled fallback when Cloudinary is not configured. */
  source?: ImageSourcePropType;
  cacheKey: string;
  height?: number;
  width?: number;
  variant?: Variant;
  overlay?: OverlayMode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT: Record<Variant, number> = {
  hero: 220,
  compact: 160,
  strip: 112,
};

const WIDTH: Record<Variant, number> = {
  hero: 900,
  compact: 720,
  strip: 480,
};

const OVERLAY_GRADIENTS: Record<OverlayMode, { horizontal: string[]; vertical: string[] }> = {
  text: {
    horizontal: ['rgba(15, 23, 42, 0.82)', 'rgba(15, 23, 42, 0.52)', 'rgba(15, 23, 42, 0.15)'],
    vertical: ['transparent', 'rgba(0,0,0,0.25)'],
  },
  product: {
    horizontal: ['rgba(15, 23, 42, 0.55)', 'rgba(15, 23, 42, 0.28)', 'rgba(15, 23, 42, 0.08)'],
    vertical: ['transparent', 'rgba(0,0,0,0.12)'],
  },
  none: {
    horizontal: ['transparent', 'transparent', 'transparent'],
    vertical: ['transparent', 'transparent'],
  },
};

/** Marketing / product photo banner — bundled assets preferred over Cloudinary. */
export function PhotoBanner({
  marketingSceneId,
  productPhotoId,
  uri,
  source,
  cacheKey,
  height,
  width,
  variant = 'hero',
  overlay = 'text',
  children,
  style,
}: Props) {
  const resolvedHeight = height ?? HEIGHT[variant];
  const resolvedWidth = width ?? WIDTH[variant];
  const radius = variant === 'strip' ? iosDesign.radius.md : iosDesign.radius.lg;

  const sceneBundled = marketingSceneId ? getMarketingSceneBundled(marketingSceneId) : undefined;
  const productBundled = productPhotoId ? getProductPhotoFallback(productPhotoId) : undefined;
  const bundled = sceneBundled ?? productBundled ?? source;

  const sceneCloud = marketingSceneId ? getMarketingSceneCloudUrl(marketingSceneId, resolvedWidth) : '';
  const productCloud = productPhotoId ? getProductPhotoUrl(productPhotoId, resolvedWidth) : '';
  const remoteUri = bundled ? '' : uri?.trim() || sceneCloud || productCloud || '';

  const overlayMode: OverlayMode = children ? overlay : overlay === 'none' ? 'none' : 'product';
  const gradients = OVERLAY_GRADIENTS[overlayMode];
  const stripOverlay =
    variant === 'strip' && overlayMode === 'text'
      ? ['rgba(15, 23, 42, 0.78)', 'rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.2)']
      : gradients.horizontal;

  return (
    <View style={[styles.wrap, { height: resolvedHeight, borderRadius: radius }, style]}>
      {bundled ? (
        <BrandImage
          source={bundled}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={cacheKey}
        />
      ) : remoteUri ? (
        <CloudinaryImage
          uri={remoteUri}
          width={resolvedWidth}
          height={resolvedHeight}
          crop="cover"
          contentFit="cover"
          lazy={variant !== 'hero'}
          accessibilityLabel={cacheKey}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBg]} />
      )}
      {overlayMode !== 'none' ? (
        <>
          <LinearGradient
            colors={stripOverlay as [string, string, ...string[]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={gradients.vertical as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    ...iosDesign.shadows.card,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: iosDesign.spacing.lg,
  },
  fallbackBg: {
    backgroundColor: '#0F172A',
  },
});

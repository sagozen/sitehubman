import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageStyle,
} from 'react-native';
import type { CloudinaryTransformOptions } from '@/src/services/cloudinaryService';
import { pickResponsiveWidth } from '@/src/services/cloudinaryService';
import { getCachedOptimizedUrl } from '@/src/services/cloudinaryUrlCache';

type Props = {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  thumbnail?: boolean;
  crop?: CloudinaryTransformOptions['crop'];
  contentFit?: 'cover' | 'contain';
  lazy?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
  placeholderColor?: string;
};

/**
 * Lazy-loaded image using Cloudinary-optimized URLs (WebP/AVIF, responsive width).
 * Caches delivery URLs in AsyncStorage — never stores original image files locally.
 */
export function CloudinaryImage({
  uri,
  width,
  height,
  thumbnail,
  crop = 'limit',
  contentFit = 'cover',
  lazy = true,
  accessibilityLabel,
  style,
  placeholderColor = '#1C1C1E',
}: Props) {
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const responsiveWidth = pickResponsiveWidth(width);

  useEffect(() => {
    if (!lazy) return;
    const task = InteractionManager.runAfterInteractions(() => setShouldLoad(true));
    return () => task.cancel();
  }, [lazy]);

  useEffect(() => {
    let cancelled = false;
    const raw = uri?.trim();
    if (!raw || !shouldLoad) {
      setResolvedUri(null);
      setFailed(false);
      return;
    }

    void (async () => {
      try {
        const optimized = await getCachedOptimizedUrl(raw, {
          width: thumbnail ? (width ?? 200) : responsiveWidth,
          height: thumbnail ? (height ?? width ?? 200) : height,
          crop: thumbnail ? 'fill' : crop,
          thumbnail,
          format: 'auto',
          quality: 'auto',
        });
        if (!cancelled) {
          setResolvedUri(optimized);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setResolvedUri(raw);
          setFailed(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, shouldLoad, responsiveWidth, width, height, thumbnail, crop]);

  const resizeMode: ImageResizeMode = contentFit === 'contain' ? 'contain' : 'cover';

  if (!uri?.trim()) return null;

  if (!shouldLoad || !resolvedUri) {
    return (
      <View style={[styles.placeholder, { backgroundColor: placeholderColor }, style]}>
        {shouldLoad ? <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" /> : null}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      accessibilityIgnoresInvertColors
      onError={() => {
        if (Platform.OS === 'web') return;
        setFailed(true);
      }}
      {...(failed ? { opacity: 0.72 } : null)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

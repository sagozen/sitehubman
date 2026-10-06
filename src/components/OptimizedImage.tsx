/**
 * Optimized Image Component
 * Uses react-native-fast-image for lazy loading and caching
 */

import React from 'react';
import { StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import FastImage, { FastImageProps, Priority, ResizeMode } from 'react-native-fast-image';

interface OptimizedImageProps extends Omit<FastImageProps, 'source'> {
  uri: string;
  style?: ImageStyle | ViewStyle;
  priority?: 'low' | 'normal' | 'high';
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  fallback?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  priority = 'normal',
  resizeMode = 'cover',
  fallback,
  ...props
}) => {
  const priorityMap: Record<string, Priority> = {
    low: FastImage.priority.low,
    normal: FastImage.priority.normal,
    high: FastImage.priority.high,
  };

  const resizeModeMap: Record<string, ResizeMode> = {
    contain: FastImage.resizeMode.contain,
    cover: FastImage.resizeMode.cover,
    stretch: FastImage.resizeMode.stretch,
    center: FastImage.resizeMode.center,
  };

  const source = {
    uri,
    priority: priorityMap[priority],
    cache: FastImage.cacheControl.immutable,
  };

  return (
    <FastImage
      source={source}
      style={[styles.image, style]}
      resizeMode={resizeModeMap[resizeMode]}
      {...props}
      onError={() => {
        if (fallback) {
          // TODO: Set fallback image
        }
      }}
    />
  );
};

// Preload images for better UX
export const preloadImages = (uris: string[]) => {
  FastImage.preload(
    uris.map((uri) => ({
      uri,
      priority: FastImage.priority.normal,
    }))
  );
};

// Clear image cache (for memory management)
export const clearImageCache = async () => {
  await FastImage.clearMemoryCache();
  await FastImage.clearDiskCache();
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

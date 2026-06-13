import { forwardRef, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/** Bottom inset so content clears tab bars / home indicator (Wallet / Instagram style). */
export const IOS_SCROLL_BOTTOM_INSET = 120;

export function mergeIosScrollContentStyle(
  style?: StyleProp<ViewStyle>,
  options?: { bottomInset?: boolean; horizontal?: boolean }
): StyleProp<ViewStyle> {
  const useBottom = options?.bottomInset !== false && !options?.horizontal;
  if (!useBottom) return style;

  const flat = StyleSheet.flatten(style) ?? {};
  const existing =
    typeof flat.paddingBottom === 'number' ? flat.paddingBottom : 0;

  return [
    style,
    { paddingBottom: Math.max(IOS_SCROLL_BOTTOM_INSET, existing) },
  ];
}

export const IosScrollView = forwardRef<ScrollView, ScrollViewProps>(function IosScrollView(
  {
    horizontal,
    bounces = true,
    alwaysBounceVertical,
    alwaysBounceHorizontal,
    decelerationRate = 'normal',
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator,
    contentInsetAdjustmentBehavior = 'automatic',
    contentContainerStyle,
    overScrollMode,
    ...rest
  },
  ref
) {
  const isHorizontal = horizontal === true;

  const mergedContentStyle = useMemo(
    () => mergeIosScrollContentStyle(contentContainerStyle, { horizontal: isHorizontal }),
    [contentContainerStyle, isHorizontal]
  );

  return (
    <ScrollView
      ref={ref}
      horizontal={horizontal}
      bounces={bounces}
      alwaysBounceVertical={isHorizontal ? alwaysBounceVertical : (alwaysBounceVertical ?? true)}
      alwaysBounceHorizontal={isHorizontal ? (alwaysBounceHorizontal ?? true) : alwaysBounceHorizontal}
      decelerationRate={decelerationRate}
      showsVerticalScrollIndicator={isHorizontal ? showsVerticalScrollIndicator : showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={
        isHorizontal ? (showsHorizontalScrollIndicator ?? false) : showsHorizontalScrollIndicator
      }
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      overScrollMode={Platform.OS === 'android' ? (overScrollMode ?? 'always') : overScrollMode}
      contentContainerStyle={mergedContentStyle}
      {...rest}
    />
  );
});

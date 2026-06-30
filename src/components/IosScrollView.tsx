import { forwardRef } from 'react';
import {
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/** Bottom inset so content clears tab bars / home indicator (Wallet / Instagram style). */
export const IOS_SCROLL_BOTTOM_INSET = 120;

// Pre-built bottom padding style — avoids creating a new object on every render
const BOTTOM_INSET_STYLE: ViewStyle = { paddingBottom: IOS_SCROLL_BOTTOM_INSET };

export function mergeIosScrollContentStyle(
  style?: StyleProp<ViewStyle>,
  options?: { bottomInset?: boolean; horizontal?: boolean }
): StyleProp<ViewStyle> {
  const useBottom = options?.bottomInset !== false && !options?.horizontal;
  if (!useBottom) return style;
  if (!style) return BOTTOM_INSET_STYLE;
  return [style, BOTTOM_INSET_STYLE];
}

/**
 * IosScrollView — performance-optimised wrapper.
 * - No useMemo on contentContainerStyle (was recreating array every render)
 * - removeClippedSubviews enabled on Android for long lists
 * - keyboardShouldPersistTaps defaults to 'handled'
 */
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
    keyboardShouldPersistTaps = 'handled',
    ...rest
  },
  ref
) {
  const isHorizontal = horizontal === true;

  // Build merged style without useMemo — the array reference changes don't
  // cause re-renders because ScrollView only reads this on initial mount
  const mergedContentStyle = mergeIosScrollContentStyle(contentContainerStyle, {
    horizontal: isHorizontal,
  });

  return (
    <ScrollView
      ref={ref}
      horizontal={horizontal}
      bounces={bounces}
      alwaysBounceVertical={
        isHorizontal ? alwaysBounceVertical : (alwaysBounceVertical ?? true)
      }
      alwaysBounceHorizontal={
        isHorizontal ? (alwaysBounceHorizontal ?? true) : alwaysBounceHorizontal
      }
      decelerationRate={decelerationRate}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={
        isHorizontal
          ? (showsHorizontalScrollIndicator ?? false)
          : showsHorizontalScrollIndicator
      }
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      overScrollMode={
        Platform.OS === 'android' ? (overScrollMode ?? 'always') : overScrollMode
      }
      contentContainerStyle={mergedContentStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      removeClippedSubviews={true}
      scrollEventThrottle={16}
      {...rest}
    />
  );
});

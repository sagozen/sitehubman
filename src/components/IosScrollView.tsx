import { forwardRef } from 'react';
import {
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Extra buffer above the OS safe-area bottom to clear floating tab bars
 * and FABs (Wallet / Instagram style).
 */
export const IOS_SCROLL_BOTTOM_INSET = 100;

export function mergeIosScrollContentStyle(
  style?: StyleProp<ViewStyle>,
  options?: { bottomInset?: boolean; horizontal?: boolean; extraBottom?: number }
): StyleProp<ViewStyle> {
  const useBottom = options?.bottomInset !== false && !options?.horizontal;
  if (!useBottom) return style;
  const paddingBottomStyle: ViewStyle = {
    paddingBottom: IOS_SCROLL_BOTTOM_INSET + (options?.extraBottom ?? 0),
  };
  if (!style) return paddingBottomStyle;
  return [style, paddingBottomStyle];
}

/**
 * IosScrollView — performance-optimised wrapper.
 *
 * Safe-area: uses `useSafeAreaInsets` to add the device's bottom inset
 * (home indicator / nav bar) dynamically on top of the fixed buffer so
 * content is always reachable on every device.
 *
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
    contentInsetAdjustmentBehavior = 'never',
    contentContainerStyle,
    overScrollMode,
    keyboardShouldPersistTaps = 'handled',
    ...rest
  },
  ref
) {
  const isHorizontal = horizontal === true;
  const insets = useSafeAreaInsets();

  const mergedContentStyle = mergeIosScrollContentStyle(contentContainerStyle, {
    horizontal: isHorizontal,
    extraBottom: insets.bottom,
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
      canCancelContentTouches={true}
      removeClippedSubviews={Platform.OS === 'android'}
      scrollEventThrottle={16}
      {...rest}
    />
  );
});

export default IosScrollView;


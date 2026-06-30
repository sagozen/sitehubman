import { forwardRef, useMemo, type Ref, type ReactElement } from 'react';
import {
  FlatList,
  Platform,
  type FlatListProps,
} from 'react-native';
import { mergeIosScrollContentStyle } from '@/src/components/IosScrollView';

function IosFlatListInner<ItemT>(
  {
    horizontal,
    bounces = true,
    alwaysBounceVertical,
    alwaysBounceHorizontal,
    decelerationRate = 'normal',
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator,
    contentContainerStyle,
    contentInsetAdjustmentBehavior = 'automatic',
    overScrollMode,
    ...rest
  }: FlatListProps<ItemT>,
  ref: Ref<FlatList<ItemT>> | null
) {
  const isHorizontal = horizontal === true;

  const mergedContentStyle = useMemo(
    () => mergeIosScrollContentStyle(contentContainerStyle, { horizontal: isHorizontal }),
    [contentContainerStyle, isHorizontal]
  );

  return (
    <FlatList
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
      overScrollMode={Platform.OS === 'android' ? (overScrollMode ?? 'always') : overScrollMode}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      contentContainerStyle={mergedContentStyle}
      removeClippedSubviews={true}
      scrollEventThrottle={16}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      {...rest}
    />
  );
}

export const IosFlatList = forwardRef(IosFlatListInner) as <ItemT>(
  props: FlatListProps<ItemT> & { ref?: Ref<FlatList<ItemT>> }
) => ReactElement;

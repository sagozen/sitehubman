import React, { memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Haptics } from '@/src/utils/haptics';

export interface SegmentOption<T extends string | number> {
  label: string;
  value: T;
  badge?: string | number;
}

export interface AnimatedSegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 260,
  mass: 0.7,
};

function AnimatedSegmentedControlRaw<T extends string | number>({
  options,
  value,
  onChange,
  style,
  height = 40,
}: AnimatedSegmentedControlProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const segmentWidth = containerWidth > 0 ? (containerWidth - 6) / options.length : 0;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
    const segW = (width - 6) / options.length;
    const initialIndex = options.findIndex((opt) => opt.value === value);
    translateX.value = (initialIndex >= 0 ? initialIndex : 0) * segW;
  };

  const handleSelect = useCallback(
    (index: number, optValue: T) => {
      if (optValue === value) return;
      Haptics.selection();
      if (segmentWidth > 0) {
        translateX.value = withSpring(index * segmentWidth, SPRING_CONFIG);
      }
      onChange(optValue);
    },
    [value, segmentWidth, onChange, translateX]
  );

  // Keep spring in sync if value changes externally
  React.useEffect(() => {
    if (segmentWidth > 0 && selectedIndex >= 0) {
      translateX.value = withSpring(selectedIndex * segmentWidth, SPRING_CONFIG);
    }
  }, [selectedIndex, segmentWidth, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.container, { height }, style]} onLayout={handleLayout}>
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.activePill,
            { width: segmentWidth, height: height - 6 },
            pillStyle,
          ]}
        />
      )}
      <View style={styles.segmentsRow}>
        {options.map((option, idx) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              style={styles.segment}
              onPress={() => handleSelect(idx, option.value)}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.label,
                  isSelected ? styles.labelActive : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
              {option.badge !== undefined && (
                <View
                  style={[
                    styles.badge,
                    isSelected ? styles.badgeActive : styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected ? styles.badgeTextActive : styles.badgeTextInactive,
                    ]}
                  >
                    {option.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 3,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activePill: {
    position: 'absolute',
    left: 3,
    top: 3,
    backgroundColor: '#2C2C2C',
    borderRadius: 17,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: '#9A9AA0',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: '#FFFFFF',
  },
  badgeInactive: {
    backgroundColor: '#2A2A2A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#000000',
  },
  badgeTextInactive: {
    color: '#9A9AA0',
  },
});

export const AnimatedSegmentedControl = memo(
  AnimatedSegmentedControlRaw
) as typeof AnimatedSegmentedControlRaw;

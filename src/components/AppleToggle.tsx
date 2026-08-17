/**
 * AppleToggle — Authentic Apple HIG Switch Component.
 *
 * Dimensions & Specs:
 *  - Outer Track: 51 × 31 px, borderRadius: 15.5 px
 *  - ON Track Color: Apple System Green (#34C759)
 *  - OFF Track Color: #39393D (rgba(120, 120, 128, 0.32))
 *  - Knob: 27 × 27 px, solid white (#FFFFFF), borderRadius: 13.5 px
 *  - Margin/Padding: 2px inset on all sides
 *  - Horizontal Travel: 0 to 20px
 *  - Soft iOS shadow: natural elevation without sharp borders
 *  - Smooth 200ms spring/timing curve
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AppleToggleProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const KNOB_SIZE = 27;
const KNOB_PADDING = 2;
const TRAVEL_DISTANCE = TRACK_WIDTH - KNOB_SIZE - KNOB_PADDING * 2; // 20px

export function AppleToggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: AppleToggleProps) {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animValue]);

  const handlePress = () => {
    if (disabled) return;
    void Haptics.selectionAsync();
    onValueChange(!value);
  };

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(120, 120, 128, 0.32)', '#34C759'],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL_DISTANCE],
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={styles.pressable}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.knob,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: KNOB_PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    elevation: 3,
  },
});

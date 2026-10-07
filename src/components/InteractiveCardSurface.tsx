import React, { memo, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Haptics } from '@/src/utils/haptics';

export interface InteractiveCardSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

const SPRING_OUT = { damping: 18, stiffness: 220, mass: 0.8 };

/**
 * InteractiveCardSurface — Apple Wallet-grade 3D card tactile interaction.
 * Gives digital business cards restrained physical depth, slight tilt, scale, and spring release.
 */
function InteractiveCardSurfaceRaw({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
}: InteractiveCardSurfaceProps) {
  const scale = useSharedValue(1);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;
      scale.value = withTiming(0.978, { duration: 120 });
      // Subtle tilt based on touch location
      const { locationX, locationY } = e.nativeEvent;
      // Normalizing small tilt angle (-1.8deg to +1.8deg)
      const tiltY = (locationX > 160 ? 1 : -1) * 1.5;
      const tiltX = (locationY > 100 ? -1 : 1) * 1.5;
      rotateY.value = withTiming(tiltY, { duration: 120 });
      rotateX.value = withTiming(tiltX, { duration: 120 });
    },
    [disabled, scale, rotateX, rotateY]
  );

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, SPRING_OUT);
    rotateX.value = withSpring(0, SPRING_OUT);
    rotateY.value = withSpring(0, SPRING_OUT);
  }, [disabled, scale, rotateX, rotateY]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.selection();
    onPress?.();
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { scale: scale.value },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        disabled={disabled}
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  pressable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
});

export const InteractiveCardSurface = memo(InteractiveCardSurfaceRaw);

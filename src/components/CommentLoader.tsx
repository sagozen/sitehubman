import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/src/constants/theme';

/** Duration for one full bounce cycle (ms) */
const CYCLE = 1200;
/** How long the scale-up takes */
const UP_DURATION = 300;
/** How long it stays at peak */
const HOLD_DURATION = 100;
/** How long the scale-down takes */
const DOWN_DURATION = 300;
/** Idle time before next dot fires */
const IDLE_DURATION = CYCLE - UP_DURATION - HOLD_DURATION - DOWN_DURATION;
/** Stagger between dots */
const STAGGER = 200;

const AnimatedView = Animated.View;

type Props = {
  size?: number;
  /** Color of the bouncing dots */
  color?: string;
  /** Fill color of the speech bubble shell */
  bubbleColor?: string;
  style?: ViewStyle;
};

/**
 * Speech-bubble loader modelled after the loading.io "comment" spinner.
 * Three dots bounce in sequence inside a rounded speech bubble.
 */
export function CommentLoader({
  size = 60,
  color = theme.colors.primary,
  bubbleColor = '#FFFFFF',
  style,
}: Props) {
  const scale1 = useSharedValue(0.4);
  const scale2 = useSharedValue(0.4);
  const scale3 = useSharedValue(0.4);

  const bounceTiming = {
    up: withTiming(1, { duration: UP_DURATION, easing: Easing.out(Easing.back(1.8)) }),
    hold: withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear }),
    down: withTiming(0.4, { duration: DOWN_DURATION, easing: Easing.in(Easing.cubic) }),
    idle: withTiming(0.4, { duration: IDLE_DURATION, easing: Easing.linear }),
  };

  function startBounce(sv: Animated.SharedValue<number>, delayMs: number) {
    sv.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(bounceTiming.up, bounceTiming.hold, bounceTiming.down, bounceTiming.idle),
        -1,
        false
      )
    );
  }

  useEffect(() => {
    startBounce(scale1, 0);
    startBounce(scale2, STAGGER);
    startBounce(scale3, STAGGER * 2);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }] }));
  const dot2Style = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }] }));
  const dot3Style = useAnimatedStyle(() => ({ transform: [{ scale: scale3.value }] }));

  // Dot radius relative to size: ~9% of size
  const dotR = Math.max(4, size * 0.09);

  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {/* Speech bubble shell — path mirrors the loading.io comment shape */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
        style={{ position: 'absolute' }}
      >
        <Path
          d="M78,19H22c-6.6,0-12,5.4-12,12v31c0,6.6,5.4,12,12,12h37.2
             c0.4,3,1.8,5.6,3.7,7.6c2.4,2.5,5.1,4.1,9.1,4
             c-1.4-2.1-2-7.2-2-10.3c0-0.4,0-0.8,0-1.3H78
             c6.6,0,12-5.4,12-12V31C90,24.4,84.6,19,78,19z"
          fill={bubbleColor}
        />
        {/* Subtle border/shadow ring so it's visible on light backgrounds */}
        <Path
          d="M78,19H22c-6.6,0-12,5.4-12,12v31c0,6.6,5.4,12,12,12h37.2
             c0.4,3,1.8,5.6,3.7,7.6c2.4,2.5,5.1,4.1,9.1,4
             c-1.4-2.1-2-7.2-2-10.3c0-0.4,0-0.8,0-1.3H78
             c6.6,0,12-5.4,12-12V31C90,24.4,84.6,19,78,19z"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeOpacity={0.18}
        />
      </Svg>

      {/* Animated dots rendered as plain Views so Reanimated style works cleanly */}
      <View
        style={{
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: size * 0.12,
          // Vertically centre inside the bubble body (top ~35%, tail ~20%)
          top: size * 0.3,
          height: size * 0.4,
          width: '100%',
        }}
      >
        {([dot1Style, dot2Style, dot3Style] as const).map((dotStyle, i) => (
          <AnimatedView
            key={i}
            style={[
              {
                width: dotR * 2,
                height: dotR * 2,
                borderRadius: dotR,
                backgroundColor: color,
              },
              dotStyle,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { glassTheme } from '@/src/design-system/glass';

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

/** Standard press feedback — subtle scale, shared across glass UI. */
export function GlassPressable({
  children,
  style,
  scaleTo = glassTheme.motion.pressScale,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        Animated.spring(scale, {
          toValue: scaleTo,
          useNativeDriver: true,
          speed: 28,
          bounciness: 0,
        }).start();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 24,
          bounciness: 4,
        }).start();
        onPressOut?.(event);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

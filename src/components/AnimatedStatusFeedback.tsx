import React, { memo, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { Haptics } from '@/src/utils/haptics';

export type StatusFeedbackType = 'idle' | 'loading' | 'success' | 'error';

export interface AnimatedStatusFeedbackProps {
  status: StatusFeedbackType;
  title?: string;
  subtitle?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  onAnimationComplete?: () => void;
}

const SPRING_POP = { damping: 14, stiffness: 220, mass: 0.6 };

function AnimatedStatusFeedbackRaw({
  status,
  title,
  subtitle,
  loadingMessage = 'Processing...',
  successMessage = 'Completed successfully',
  errorMessage = 'An error occurred',
  size = 'md',
  onAnimationComplete,
}: AnimatedStatusFeedbackProps) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (status === 'success') {
      Haptics.success();
      scale.value = withSequence(
        withTiming(0.6, { duration: 50 }),
        withSpring(1, SPRING_POP)
      );
      opacity.value = withTiming(1, { duration: 180 });
      if (onAnimationComplete) {
        const t = setTimeout(onAnimationComplete, 1600);
        return () => clearTimeout(t);
      }
    } else if (status === 'error') {
      Haptics.error();
      scale.value = withSequence(
        withTiming(1.1, { duration: 80 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
      opacity.value = withTiming(1, { duration: 180 });
    } else if (status === 'loading') {
      scale.value = 1;
      opacity.value = withTiming(1, { duration: 150 });
    }
    return undefined;
  }, [status, scale, opacity, onAnimationComplete]);

  const badgeSize = size === 'lg' ? 72 : size === 'md' ? 56 : 40;
  const iconSize = size === 'lg' ? 36 : size === 'md' ? 28 : 20;

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (status === 'idle') return null;

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.center}>
          <View style={[styles.spinnerCircle, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
            <ActivityIndicator size={size === 'lg' ? 'large' : 'small'} color="#FFFFFF" />
          </View>
          <AppText style={styles.messageText} weight="medium">
            {loadingMessage}
          </AppText>
        </Animated.View>
      )}

      {status === 'success' && (
        <Animated.View style={[styles.center, animatedBadgeStyle]}>
          <View
            style={[
              styles.successCircle,
              { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 },
            ]}
          >
            <AppIcon name="CircleCheck" size={iconSize} color="#FFFFFF" />
          </View>
          <AppText style={styles.titleText} weight="bold">
            {title || successMessage}
          </AppText>
          {subtitle && (
            <AppText style={styles.subtitleText} weight="regular">
              {subtitle}
            </AppText>
          )}
        </Animated.View>
      )}

      {status === 'error' && (
        <Animated.View style={[styles.center, animatedBadgeStyle]}>
          <View
            style={[
              styles.errorCircle,
              { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 },
            ]}
          >
            <AppIcon name="AlertCircle" size={iconSize} color="#FFFFFF" />
          </View>
          <AppText style={styles.errorText} weight="bold">
            {title || errorMessage}
          </AppText>
          {subtitle && (
            <AppText style={styles.subtitleText} weight="regular">
              {subtitle}
            </AppText>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  spinnerCircle: {
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    backgroundColor: '#799A85',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#799A85',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  errorCircle: {
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  messageText: {
    color: '#9A9AA0',
    fontSize: 14,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: '#9A9AA0',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 16,
    textAlign: 'center',
  },
});

export const AnimatedStatusFeedback = memo(AnimatedStatusFeedbackRaw);

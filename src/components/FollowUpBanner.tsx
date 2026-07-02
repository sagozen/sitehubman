/**
 * FollowUpBanner — Phase 2 "Intelligent Follow-ups"
 *
 * Slides in from the top to remind the user: "You met [Name] 2h ago. Follow up?"
 * Auto-dismisses after 6 seconds. Swipe-up to dismiss manually.
 * Stacks multiple nudges with a dot-counter badge.
 */

import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';
import type { FollowUpNudge } from '@/src/services/connectionsIntelligenceService';

interface FollowUpBannerProps {
  nudge: FollowUpNudge | null;
  totalCount: number;
  onDismiss: (momentId: string) => void;
  onAction: (momentId: string) => void;
}

export function FollowUpBanner({ nudge, totalCount, onDismiss, onAction }: FollowUpBannerProps) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 260 });
    opacity.value = withTiming(1, { duration: 220 });
  }, [translateY, opacity]);

  const animateOut = useCallback((cb?: () => void) => {
    translateY.value = withTiming(-120, { duration: 260 }, (finished) => {
      if (finished && cb) runOnJS(cb)();
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [translateY, opacity]);

  useEffect(() => {
    if (nudge) {
      HapticTap.light();
      animateIn();

      const timer = setTimeout(() => {
        animateOut(() => onDismiss(nudge.momentId));
      }, 6000);

      return () => clearTimeout(timer);
    } else {
      animateOut();
    }
  }, [nudge?.momentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!nudge) return null;

  function handleAction() {
    HapticPattern.followUpDone();
    animateOut(() => onAction(nudge!.momentId));
  }

  function handleDismiss() {
    HapticTap.light();
    animateOut(() => onDismiss(nudge!.momentId));
  }

  const firstName = nudge.name.split(' ')[0] ?? nudge.name;

  return (
    <Animated.View style={[styles.banner, containerStyle]} pointerEvents="box-none">
      <View style={styles.inner}>
        {/* Left icon */}
        <View style={styles.iconWrap}>
          <AppIcon name="Bell" size={20} color="#FF9F0A" />
        </View>

        {/* Copy */}
        <View style={styles.copy}>
          <AppText style={styles.title} numberOfLines={1}>
            You met{' '}
            <AppText style={styles.titleBold}>{firstName}</AppText>
            {' '}{nudge.relativeLabel}
          </AppText>
          <AppText style={styles.sub} numberOfLines={1}>
            {nudge.subtitle
              ? `${nudge.subtitle} — tap to follow up`
              : 'Tap to send a follow-up message'}
          </AppText>
        </View>

        {/* Count badge */}
        {totalCount > 1 && (
          <View style={styles.countBadge}>
            <AppText style={styles.countText}>{totalCount}</AppText>
          </View>
        )}

        {/* Actions */}
        <Pressable onPress={handleAction} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Follow up">
          <AppText style={styles.actionText}>Follow up</AppText>
        </Pressable>
        <Pressable onPress={handleDismiss} style={styles.dismissBtn} accessibilityRole="button" accessibilityLabel="Dismiss">
          <AppIcon name="X" size={16} color="rgba(255,255,255,0.54)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,159,10,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '600',
  },
  titleBold: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sub: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '500',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF375F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF9F0A',
  },
  actionText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  dismissBtn: {
    padding: 4,
  },
});

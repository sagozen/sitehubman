import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { SNAP_TAP_BRAND } from '@/src/constants/snapTapBrand';

type Props = {
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  previewHeight?: number;
  title?: string;
  hintShow?: string;
  hintHide?: string;
};

/** Compact show/hide row — no boxes, small chevron only. */
export function GuestDesignPreviewPanel({
  expanded,
  onToggle,
  children,
  previewHeight = 160,
  title = 'Card preview',
  hintShow = 'Show',
  hintHide = 'Hide',
}: Props) {
  const heightAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: expanded ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: expanded ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, heightAnim, rotateAnim]);

  const bodyHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, previewHeight],
  });

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.toggleRow, pressed && styles.togglePressed]}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide card preview' : 'Show card preview'}
        accessibilityState={{ expanded }}
      >
        <AppText style={styles.toggleTitle}>{title}</AppText>
        <AppText style={styles.toggleHint}>{expanded ? hintHide : hintShow}</AppText>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={16} color={SNAP_TAP_BRAND} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.body, { height: bodyHeight, opacity: heightAnim }]}>
        <View style={styles.bodyInner}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  togglePressed: {
    opacity: 0.65,
  },
  toggleTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: guestUi.text,
  },
  toggleHint: {
    fontSize: 12,
    fontWeight: '500',
    color: guestUi.muted,
  },
  body: {
    overflow: 'hidden',
  },
  bodyInner: {
    flex: 1,
  },
});

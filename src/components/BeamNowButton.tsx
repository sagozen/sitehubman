/**
 * BeamNowButton — #1 primary action for businessmen at networking events.
 * Pulsating NFC aura rings + spring press + heavy haptic.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface BeamNowButtonProps {
  onPress: () => void;
  tapsCount?: number;
  disabled?: boolean;
}

export function BeamNowButton({ onPress, tapsCount = 0, disabled = false }: BeamNowButtonProps) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring1, { toValue: 1, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(ring2, { toValue: 1, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop1.start();
    loop2.start();
    return () => { loop1.stop(); loop2.stop(); };
  }, [ring1, ring2]);

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
    opacity.value = withTiming(0.88, { duration: 100 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300, mass: 0.8 });
    opacity.value = withTiming(1, { duration: 180 });
  };
  const handlePress = () => { HapticTap.heavy(); onPress(); };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const r1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const r1Opacity = ring1.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.35, 0.12, 0] });
  const r2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const r2Opacity = ring2.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.25, 0.08, 0] });

  return (
    <View style={styles.wrapper}>
      <Animated.View pointerEvents="none" style={[styles.ring, { opacity: r1Opacity, transform: [{ scale: r1Scale }] }]} />
      <Animated.View pointerEvents="none" style={[styles.ring, styles.ring2, { opacity: r2Opacity, transform: [{ scale: r2Scale }] }]} />
      <Reanimated.View style={[styles.fullWidth, animStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Beam your NFC card now"
          style={[styles.btn, disabled && { opacity: 0.4 }]}
        >
          <View style={styles.iconWrap}>
            <AppIcon name="Nfc" size={22} color="#000000" />
          </View>
          <View style={styles.textCol}>
            <AppText style={styles.label} weight="extrabold">BEAM NOW</AppText>
            <AppText style={styles.sublabel}>
              {tapsCount > 0 ? `${tapsCount} total taps · Instant share` : 'NFC · QR · AirDrop · Link'}
            </AppText>
          </View>
          <AppIcon name="ChevronRight" size={18} color="rgba(0,0,0,0.5)" />
        </Pressable>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fullWidth: { width: '100%' },
  ring: {
    position: 'absolute',
    alignSelf: 'center',
    width: '120%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  ring2: { borderColor: 'rgba(255,255,255,0.5)' },
  btn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
    width: '100%',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 1 },
  label: { fontSize: 16, color: '#000000', letterSpacing: 1.5 },
  sublabel: { fontSize: 11, color: 'rgba(0,0,0,0.55)' },
});

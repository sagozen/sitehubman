import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated, View, Platform } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { usePreferences } from '@/src/hooks/usePreferences';

interface FABProps {
  onPress: () => void;
  iconName?: string;
  label?: string;
}

export const FAB = React.memo(function FAB({ onPress, iconName = 'Plus', label }: FABProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const resolvedIconName = (iconName === 'Plus' || iconName === '!' || iconName === 'Sparkles') ? 'Sparkles' : iconName;

  return (
    <Animated.View style={[styles.fabWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pillContainer}
        hitSlop={12}
      >
        <AppIcon name={resolvedIconName as any} size={28} color="#0A84FF" />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    bottom: 96,
    right: 18,
    zIndex: 999,
  },
  pillContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

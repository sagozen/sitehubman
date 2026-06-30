import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';

interface FABProps {
  onPress: () => void;
  iconName?: string;
}

export function FAB({ onPress, iconName = 'Plus' }: FABProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Animated.View style={[styles.fabWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.fab}
        hitSlop={8}
      >
        <AppIcon name={iconName as any} size={28} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});

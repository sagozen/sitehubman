/**
 * MonoTabBar — premium monochrome navigation.
 * Apple-style slim capsule with sharp iconography. Spring-animated
 * indicator on native driver. 120fps target.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { MonoText } from '@/src/components/MonoText';
import { monoMotion, monoRadius, monoShadow, monoSpace } from '@/src/design-system/monochrome';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface MonoTabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string | number;
}

interface MonoTabBarProps {
  items: MonoTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

const BAR_HEIGHT = 60;
const PADDING = 6;

function MonoTabBarRaw({ items, activeKey, onChange }: MonoTabBarProps) {
  const { isDark } = usePreferences();
  const activeIndex = useMemo(
    () => Math.max(0, items.findIndex((i) => i.key === activeKey)),
    [items, activeKey],
  );

  const tabCount = items.length;
  const progress = useSharedValue(activeIndex / Math.max(1, tabCount - 1));

  useEffect(() => {
    progress.value = withSpring(activeIndex / Math.max(1, tabCount - 1), monoMotion.spring);
  }, [activeIndex, tabCount, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
    width: `${100 / tabCount}%`,
  }));

  const ink = isDark ? '#FFFFFF' : '#000000';
  const surface = isDark ? 'rgba(20,20,22,0.92)' : 'rgba(255,255,255,0.92)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,11,0.08)';

  const handlePress = (key: string) => {
    HapticTap.selection();
    onChange(key);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: surface, borderColor: hairline }]}>
      <View style={styles.bar}>
        {tabCount > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              isDark ? styles.indicatorDark : styles.indicatorLight,
              indicatorStyle,
            ]}
          />
        )}
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <TabButton
              key={item.key}
              item={item}
              isActive={isActive}
              ink={ink}
              onPress={() => handlePress(item.key)}
            />
          );
        })}
      </View>
    </View>
  );
}

export const MonoTabBar = memo(MonoTabBarRaw);

interface TabButtonProps {
  item: MonoTabItem;
  isActive: boolean;
  ink: string;
  onPress: () => void;
}

const TabButton = memo(function TabButton({ item, isActive, ink, onPress }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.tab,
        pressed && { opacity: monoMotion.pressOpacity },
        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
      ]}
    >
      <View style={styles.tabInner}>
        <Ionicons
          name={item.icon}
          size={22}
          color={isActive ? ink : 'rgba(120,120,128,0.6)'}
        />
        <MonoText
          variant="caption"
          weight={isActive ? 'semibold' : 'medium'}
          align="center"
          style={{
            color: isActive ? ink : 'rgba(120,120,128,0.85)',
            fontSize: 10,
            letterSpacing: 0,
          }}
          numberOfLines={1}
        >
          {item.label}
        </MonoText>
        {item.badge ? (
          <View style={styles.badge}>
            <MonoText variant="micro" weight="bold" color="#FFFFFF" style={{ fontSize: 9, letterSpacing: 0 }}>
              {String(item.badge)}
            </MonoText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: monoRadius['3xl'],
    borderWidth: 0.5,
    overflow: 'hidden',
    ...monoShadow.floating,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    paddingHorizontal: PADDING,
    paddingVertical: PADDING,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    borderRadius: monoRadius.xl,
  },
  indicatorLight: {
    backgroundColor: '#F4F4F5',
  },
  indicatorDark: {
    backgroundColor: '#26262B',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: monoSpace[1],
    gap: monoSpace[1],
    minWidth: 56,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
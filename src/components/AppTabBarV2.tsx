/**
 * AppTabBarV2 — Premium SaaS Quality Bottom Tab Bar
 * Replaces standard expo-router bottom tabs with a highly polished, 
 * animated custom tab bar that adheres to the V2 design system.
 * 
 * Features:
 * - Safe area handling at the bottom edge
 * - Custom animated active/inactive states
 * - Scale & opacity micro-animations
 * - Semantic coloring & themes
 */

import React, { memo } from 'react';
import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, getDuration, getSpring, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TabItem {
  name: string;
  label: string;
  icon: AppIconName;
  onPress: () => void;
}

export interface AppTabBarV2Props {
  /** Array of tabs to display */
  tabs?: TabItem[];
  /** The 'name' of the currently active tab */
  activeTab?: string;
  /** Custom container styling */
  style?: StyleProp<ViewStyle>;

  // React Navigation props
  state?: any;
  navigation?: any;
  descriptors?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TabButton({ item, isActive, mode }: { item: TabItem; isActive: boolean; mode: ColorMode }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(tokens.animation.scale.pressed, { duration: getDuration('fast') });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, getSpring('snappy'));
  };

  const handlePress = () => {
    if (!isActive) {
      HapticTap.selection();
      item.onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeColor = getColor('primary', mode);
  const inactiveColor = getColor('inkTertiary', mode);
  const tintColor = isActive ? activeColor : inactiveColor;
  const labelStyle = isActive
    ? getTypography('caption', 'bold')
    : getTypography('caption', 'medium');

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={item.label}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <View style={styles.iconContainer}>
          <AppIcon name={item.icon} size={24} color={tintColor} />
          {isActive && (
            <Animated.View 
              entering={ZoomIn.springify().damping(14).stiffness(200)}
              style={[styles.activeIndicator, { backgroundColor: activeColor }]} 
            />
          )}
        </View>
        <MonoText
          style={[
            labelStyle,
            { color: tintColor, marginTop: tokens.spacing[1] },
          ]}
        >
          {item.label}
        </MonoText>
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AppTabBarV2Raw({ tabs, activeTab, style, state, navigation, descriptors }: AppTabBarV2Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  let finalTabs = tabs;
  let finalActiveTab = activeTab;

  if (state && navigation) {
    const tabRoutes = state.routes;
    const activeRoute = tabRoutes[state.index];
    finalActiveTab = activeRoute?.name;

    const visibleRoutes = tabRoutes.filter((route: any) => {
      const options = descriptors?.[route.key]?.options ?? {};
      return options.href !== null && options.tabBarStyle?.display !== 'none';
    });

    const iconMap: Record<string, AppIconName> = {
      index: 'Home',
      connections: 'Users',
      attendance: 'Users',
      share: 'QrCode',
      profile: 'User',
      settings: 'Settings',
    };

    finalTabs = visibleRoutes.map((route: any) => {
      const options = descriptors?.[route.key]?.options ?? {};
      const label = options.title ?? options.tabBarLabel ?? route.name;
      const icon = iconMap[route.name] || 'HelpCircle';

      return {
        name: route.name,
        label,
        icon,
        onPress: () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (activeRoute?.key !== route.key && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        },
      };
    });
  }

  const renderTabs = finalTabs || [];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, tokens.spacing[2]),
          backgroundColor: getColor('surface', mode),
          borderTopColor: getColor('border', mode),
        },
        style,
      ]}
    >
      {renderTabs.map((tab) => (
        <TabButton
          key={tab.name}
          item={tab}
          isActive={finalActiveTab === tab.name}
          mode={mode}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    paddingTop: tokens.spacing[2],
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Android Elevation
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[1],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 28,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export const AppTabBarV2 = memo(AppTabBarV2Raw);

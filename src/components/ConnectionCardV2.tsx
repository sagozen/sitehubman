/**
 * ConnectionCardV2 — Premium SaaS Quality Connection Card
 * Displays contact info in a sleek card format.
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Image, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/src/components/AppText';
import { MonoText } from '@/src/components/MonoText';
import { AppIcon } from '@/src/components/AppIcon';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, getDuration, getSpring, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface ConnectionCardV2Props {
  name: string;
  title?: string;
  company?: string;
  avatarUrl?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function ConnectionCardV2Raw({
  name,
  title,
  company,
  avatarUrl,
  onPress,
  style,
}: ConnectionCardV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withTiming(0.96, { duration: getDuration('fast') });
    }
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, getSpring('snappy'));
    }
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (onPress) {
      HapticTap.light();
      onPress();
    }
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[
          styles.container,
          { 
            backgroundColor: getColor('surface', mode),
            borderColor: getColor('border', mode),
          },
        ]}
      >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: getColor('surfaceSubdued', mode) }]}>
          <AppText style={[getTypography('h3', 'bold'), { color: getColor('inkSecondary', mode) }]}>
            {name.charAt(0).toUpperCase()}
          </AppText>
        </View>
      )}

      <View style={styles.infoContainer}>
        <AppText style={[getTypography('bodyEmphasis', 'bold'), { color: getColor('ink', mode) }]} numberOfLines={1}>
          {name}
        </AppText>
        
        {(title || company) && (
          <MonoText style={[getTypography('caption', 'regular'), { color: getColor('inkSecondary', mode), marginTop: 2 }]} numberOfLines={1}>
            {title}{title && company ? ' @ ' : ''}{company}
          </MonoText>
        )}
      </View>

      {onPress && (
        <AppIcon name="ChevronRight" size={20} color={getColor('inkTertiary', mode)} />
      )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[4],
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: tokens.spacing[3],
    marginRight: tokens.spacing[2],
  },
});

export const ConnectionCardV2 = memo(ConnectionCardV2Raw);

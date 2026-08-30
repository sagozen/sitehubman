/**
 * AppHeaderV2 — Premium SaaS Quality Header Component
 * Full support for dark/light tokens, custom back navigation, and actions.
 */
import { router } from 'expo-router';
import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface AppHeaderV2Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  actionIcon?: AppIconName;
  onActionPress?: () => void;
  avatarName?: string;
  rightComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noDivider?: boolean;
}

function AppHeaderV2Raw({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  actionIcon,
  onActionPress,
  avatarName,
  rightComponent,
  style,
  noDivider = false,
}: AppHeaderV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  const handleBack = () => {
    HapticTap.light();
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as any);
    }
  };

  const handleAction = () => {
    HapticTap.light();
    onActionPress?.();
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: getColor('surface', mode),
          borderBottomColor: noDivider ? 'transparent' : getColor('border', mode),
          borderBottomWidth: noDivider ? 0 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: getColor('surfaceSubdued', mode) },
            pressed && { opacity: 0.7 },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
        >
          <AppIcon name="ChevronLeft" size={20} color={getColor('ink', mode)} />
        </Pressable>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}

      <View style={styles.copy}>
        {subtitle ? (
          <MonoText style={[getTypography('caption', 'medium'), { color: getColor('inkTertiary', mode), textTransform: 'uppercase' }]}>
            {subtitle}
          </MonoText>
        ) : null}
        <AppText
          style={[getTypography('h3', 'bold'), { color: getColor('ink', mode) }]}
          numberOfLines={1}
        >
          {title}
        </AppText>
      </View>

      {rightComponent ? (
        rightComponent
      ) : actionIcon && onActionPress ? (
        <Pressable
          onPress={handleAction}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Action"
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: getColor('surfaceSubdued', mode) },
            pressed && { opacity: 0.7 },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
        >
          <AppIcon name={actionIcon} size={20} color={getColor('ink', mode)} />
        </Pressable>
      ) : avatarName ? (
        <AppAvatar name={avatarName} size={36} />
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[3],
    paddingBottom: tokens.spacing[3],
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: tokens.spacing[2],
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
});

export const AppHeaderV2 = memo(AppHeaderV2Raw);

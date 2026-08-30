/**
 * AppHeader — minimal, monochrome navigation header.
 * Sharp edges, hairline divider, system back chevron. No glass blur by default —
 * blur is reserved for floating contexts. Hairline 1px border reads sharper
 * than blur on translucent backgrounds.
 */
import { router } from 'expo-router';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { monoMotion, monoSpace } from '@/src/design-system/monochrome';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  actionIcon?: AppIconName;
  onActionPress?: () => void;
  avatarName?: string;
  style?: StyleProp<ViewStyle>;
  /** Hide the bottom hairline (for floating/scroll-overlap contexts) */
  noDivider?: boolean;
}

const AppHeaderRaw = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  actionIcon,
  onActionPress,
  avatarName,
  style,
  noDivider = false,
}: AppHeaderProps) => {
  return (
    <View style={[styles.header, !noDivider && styles.divider, style]}>
      {showBack ? (
        <Pressable
          onPress={onBackPress ?? (() => {
            if (router.canGoBack()) router.back();
            else router.replace('/' as any);
          })}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={null}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: monoMotion.pressOpacity },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
        >
          <AppIcon name="ChevronLeft" size={22} />
        </Pressable>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}

      <View style={styles.copy}>
        {subtitle ? (
          <MonoText variant="micro" tone="muted">
            {subtitle.toUpperCase()}
          </MonoText>
        ) : null}
        <MonoText
          variant="title2"
          weight="bold"
          numberOfLines={1}
          style={styles.title}
        >
          {title}
        </MonoText>
      </View>

      {actionIcon && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Action"
          android_ripple={null}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: monoMotion.pressOpacity },
          ]}
        >
          <AppIcon name={actionIcon} />
        </Pressable>
      ) : avatarName ? (
        <AppAvatar name={avatarName} size={36} />
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}
    </View>
  );
};

export const AppHeader = memo(AppHeaderRaw);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: monoSpace[4],
    paddingTop: monoSpace[3],
    paddingBottom: monoSpace[3],
    backgroundColor: 'transparent',
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(10,10,11,0.06)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: monoSpace[1],
    paddingHorizontal: monoSpace[2],
  },
  title: {
    letterSpacing: -0.5,
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

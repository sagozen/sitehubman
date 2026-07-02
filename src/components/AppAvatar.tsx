import { CachedImage } from '@/src/components/CachedImage';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, RoleThemeKey, TextVariant, theme } from '@/src/constants/theme';

interface AppAvatarProps {
  name?: string;
  source?: ImageSourcePropType;
  iconName?: AppIconName;
  role?: RoleThemeKey;
  size?: number;
  isOnline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppAvatar({
  name,
  source,
  iconName,
  role = 'default',
  size = theme.avatarSize.chat,
  isOnline = false,
  style,
}: AppAvatarProps) {
  const roleTheme = getRoleTheme(role);
  const initial = (name?.trim() || 'U').charAt(0).toUpperCase();
  const avatarSize = Math.max(theme.avatarSize.sm, Math.min(theme.avatarSize.logo, size));
  const initialVariant: TextVariant =
    avatarSize >= theme.avatarSize.largeProfile
      ? 'display'
      : avatarSize >= theme.avatarSize.profile
        ? 'h1'
        : avatarSize >= theme.avatarSize.chat
          ? 'h2'
          : 'body';
  const iconSize =
    avatarSize >= theme.avatarSize.largeProfile
      ? theme.iconSize.feature
      : avatarSize >= theme.avatarSize.profile
        ? theme.iconSize.hero
        : avatarSize >= theme.avatarSize.chat
          ? theme.iconSize.md
          : theme.iconSize.sm;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: roleTheme.primary,
          },
          style,
        ]}
      >
        {source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string' ? (
          <CachedImage uri={source.uri} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : source ? (
          <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : iconName ? (
          <AppIcon name={iconName} color={theme.colors.textInverse} size={iconSize} />
        ) : (
          <AppText variant={initialVariant} tone="inverse" weight="bold" style={styles.initial}>
            {initial}
          </AppText>
        )}
      </View>
      {isOnline && (
        <View style={[styles.onlineIndicator, { width: avatarSize * 0.25, height: avatarSize * 0.25, borderRadius: (avatarSize * 0.25) / 2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...theme.shadows.control,
  },
  initial: {
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF', // Or theme.colors.background if preferred
  },
});

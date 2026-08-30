/**
 * ProfileCardV2 — Premium SaaS Quality Profile Card
 * High-impact user profile display for dashboards.
 */

import React, { memo } from 'react';
import { View, StyleSheet, Image, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { MonoText } from '@/src/components/MonoText';
import { AppIcon } from '@/src/components/AppIcon';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';

export interface ProfileCardV2Props {
  name: string;
  role?: string;
  company?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  style?: StyleProp<ViewStyle>;
}

function ProfileCardV2Raw({
  name,
  role,
  company,
  avatarUrl,
  isVerified = false,
  style,
}: ProfileCardV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  return (
    <View style={[styles.container, { backgroundColor: getColor('surface', mode), borderColor: getColor('border', mode) }, style]}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: getColor('surfaceSubdued', mode) }]}>
            <AppIcon name="User" size={32} color={getColor('inkTertiary', mode)} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <AppText style={[getTypography('h3', 'bold'), { color: getColor('ink', mode) }]}>
            {name}
          </AppText>
          {isVerified && (
            <AppIcon name="CheckCircle" size={16} color={getColor('primary', mode)} style={styles.verifiedIcon} />
          )}
        </View>

        {(role || company) && (
          <MonoText style={[getTypography('body', 'regular'), { color: getColor('inkSecondary', mode), marginTop: tokens.spacing[1] }]}>
            {role}{role && company ? ' at ' : ''}{company}
          </MonoText>
        )}
      </View>
    </View>
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
  avatarContainer: {
    marginRight: tokens.spacing[4],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginLeft: tokens.spacing[2],
  },
});

export const ProfileCardV2 = memo(ProfileCardV2Raw);

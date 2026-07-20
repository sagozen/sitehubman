import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, theme } from '@/src/constants/theme';

export type BadgeTone = 'success' | 'active' | 'warning' | 'error' | 'info' | 'pending' | 'neutral' | 'role';

interface AppBadgeProps {
  label?: string;
  tone?: BadgeTone;
  role?: string;
  style?: StyleProp<ViewStyle>;
}

function resolveColors(tone: BadgeTone, role?: string) {
  if (tone === 'role') {
    const roleTheme = getRoleTheme(role as any);
    return {
      backgroundColor: roleTheme.soft,
      color: roleTheme.primary,
    };
  }

  return {
    backgroundColor: theme.statusTint[tone as keyof typeof theme.statusTint] || theme.statusTint.neutral,
    color: theme.statusText[tone as keyof typeof theme.statusText] || theme.statusText.neutral,
  };
}

export function AppBadge({
  label,
  tone = 'neutral',
  role,
  style,
  children,
}: PropsWithChildren<AppBadgeProps>) {
  const colors = resolveColors(tone, role);

  return (
    <View style={[styles.badge, { backgroundColor: colors.backgroundColor }, style]}>
      <AppText variant="caption" weight="bold" style={[styles.label, { color: colors.color }]}>
        {label ?? children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
});

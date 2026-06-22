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

const TONE_BG_MAP: Record<string, string> = {
  success: 'rgba(52, 199, 89, 0.12)',
  warning: 'rgba(245, 165, 36, 0.12)',
  error: 'rgba(229, 72, 77, 0.12)',
  info: 'rgba(37, 211, 102, 0.12)',
  active: 'rgba(37, 211, 102, 0.12)',
  pending: 'rgba(142, 142, 147, 0.12)',
  neutral: 'rgba(142, 142, 147, 0.12)',
};

const TONE_TEXT_MAP: Record<string, string> = {
  success: theme.status.success,
  warning: theme.status.warning,
  error: theme.status.error,
  info: theme.status.info,
  active: theme.status.active,
  pending: theme.status.pending,
  neutral: theme.status.neutral,
};

function resolveColors(tone: BadgeTone, role?: string) {
  if (tone === 'role') {
    const roleTheme = getRoleTheme(role as any);
    return {
      backgroundColor: roleTheme.soft,
      color: roleTheme.primary,
    };
  }

  return {
    backgroundColor: TONE_BG_MAP[tone] || TONE_BG_MAP.neutral,
    color: TONE_TEXT_MAP[tone] || TONE_TEXT_MAP.neutral,
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

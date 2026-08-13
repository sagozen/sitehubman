import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import type { PageTheme } from '@/src/constants/pageThemes';
import { HapticTap } from '@/src/utils/haptics';

type PageHeaderProps = {
  theme: PageTheme;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: AppIconName;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  compact?: boolean;
};

import { usePreferences } from '@/src/hooks/usePreferences';

export function PageHeader({
  theme: themeProp,
  eyebrow,
  title,
  subtitle,
  icon,
  showBack = false,
  onBack,
  right,
  compact = false,
}: PageHeaderProps) {
  const { colors } = usePreferences();
  const theme = {
    surface: colors?.surface ?? themeProp.surface,
    border: colors?.border ?? themeProp.border,
    text: colors?.textPrimary ?? themeProp.text,
    muted: colors?.textMuted ?? themeProp.muted,
    accent: colors?.primary ?? themeProp.accent,
    accentSoft: colors?.primarySoft ?? themeProp.accentSoft,
  };
  return (
    <View style={[styles.root, compact && styles.rootCompact]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => {
              HapticTap.selection();
              if (onBack) {
                onBack();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="ChevronLeft" size={21} color={theme.text} />
          </Pressable>
        ) : null}

        {eyebrow ? (
          <View style={styles.eyebrowWrap}>
            <View style={[styles.accentRail, { backgroundColor: theme.accent }]} />
            <AppText style={[styles.eyebrow, { color: theme.accent }]} weight="regular">{eyebrow}</AppText>
          </View>
        ) : (
          <View style={styles.iconSpacer} />
        )}

        {right ??
          (icon ? (
            <View style={[styles.iconButton, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}>
              <AppIcon name={icon} size={21} color={theme.accent} />
            </View>
          ) : (
            <View style={styles.iconSpacer} />
          ))}
      </View>

      <View style={styles.copy}>
        <AppText style={[styles.title, compact && styles.titleCompact, { color: theme.text }]} weight="regular">
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={[styles.subtitle, { color: theme.muted }]} weight="regular">{subtitle}</AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  rootCompact: { gap: 8 },
  topRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eyebrowWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentRail: { width: 18, height: 3, borderRadius: 2 },
  eyebrow: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: { width: 44, height: 44 },
  copy: { gap: 5 },
  title: {
    maxWidth: 520,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: 0,
  },
  titleCompact: { fontSize: 32, lineHeight: 36 },
  subtitle: {
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: 0,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.95 }] },
});

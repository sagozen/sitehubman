/**
 * PageHeader — Apple HIG-compliant screen header.
 * - Navigation bar: 44pt height, Title 3 (20pt/600) or Large Title (34pt/700)
 * - Back button: 44x44pt hit target, chevron-left icon only
 * - Separator line: Apple system separator color
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import type { PageTheme } from '@/src/constants/pageThemes';
import { HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

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
  /** Use 'largeTitle' for top-of-screen scrolling headers, 'navBar' for inline nav */
  style?: 'largeTitle' | 'navBar';
};

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
  style: headerStyle = 'largeTitle',
}: PageHeaderProps) {
  const { isDark } = usePreferences();

  const textColor  = themeProp.text  || (isDark ? '#FFFFFF' : '#000000');
  const muteColor  = themeProp.muted || (isDark ? 'rgba(235,235,245,0.60)' : 'rgba(60,60,67,0.60)');
  const accentColor = themeProp.accent || (isDark ? '#0A84FF' : '#007AFF');
  const borderColor = isDark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.29)';

  const isNavBar = headerStyle === 'navBar' || compact;

  return (
    <View style={[styles.root, isNavBar && styles.rootNavBar]}>
      {/* Top row: back button + optional right slot */}
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
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
          >
            <AppIcon name="ChevronLeft" size={22} color={accentColor} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {eyebrow ? (
          <View style={styles.eyebrowWrap}>
            <Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {right ?? (
          icon ? (
            <View style={[styles.iconBtn, { borderColor }]}>
              <AppIcon name={icon} size={20} color={accentColor} />
            </View>
          ) : (
            <View style={styles.backPlaceholder} />
          )
        )}
      </View>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text
          style={[
            isNavBar ? styles.titleNavBar : styles.titleLarge,
            { color: textColor },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: muteColor }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  rootNavBar: {
    gap: 4,
  },
  topRow: {
    // Apple HIG: nav bar row is 44pt
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Apple HIG: back button must be 44x44pt touch area
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginLeft: -8,
  },
  backBtnPressed: {
    opacity: 0.5,
  },
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  eyebrowWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  eyebrow: {
    // Apple HIG Caption 2 (uppercase label)
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.06,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: 4,
  },
  // Apple HIG Large Title: 34pt/700
  titleLarge: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  // Apple HIG Title 3 for inline nav bars: 20pt/600
  titleNavBar: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  // Apple HIG Body (17pt)
  subtitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});

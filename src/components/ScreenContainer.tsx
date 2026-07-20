import { PropsWithChildren, useContext, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassScreenBackdrop } from '@/src/components/GlassScreenBackdrop';
import { IosScrollView } from '@/src/components/IosScrollView';
import { RoleThemeKey, theme } from '@/src/constants/theme';
import { PreferencesContext } from '@/src/providers/PreferencesProvider';
import { resolveAppColors } from '@/src/constants/themeResolver';

interface ScreenContainerProps {
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  role?: RoleThemeKey;
  padding?: 'default' | 'compact';
  isDark?: boolean;
}

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  role: _role = 'default',
  padding = 'default',
  isDark: isDarkProp,
}: PropsWithChildren<ScreenContainerProps>) {
  void _role;

  const parentPreferences = useContext(PreferencesContext);
  const resolvedIsDark = isDarkProp ?? parentPreferences?.isDark ?? false;

  const overriddenContextValue = useMemo(() => {
    if (isDarkProp === undefined || !parentPreferences) return parentPreferences;

    const resolvedMode = (isDarkProp ? 'dark' : 'light') as 'light' | 'dark';
    const resolvedColors = resolveAppColors(parentPreferences.preferences, resolvedMode);

    return {
      ...parentPreferences,
      isDark: isDarkProp,
      resolvedColorMode: resolvedMode,
      colors: resolvedColors,
    };
  }, [parentPreferences, isDarkProp]);

  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  const horizontalPadding = padding === 'compact' ? theme.spacing.md : theme.spacing.lg;

  const layout = (
    <GlassScreenBackdrop isDark={resolvedIsDark}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {scroll ? (
          <IosScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </IosScrollView>
        ) : (
          <View style={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}>{content}</View>
        )}
      </SafeAreaView>
    </GlassScreenBackdrop>
  );

  if (overriddenContextValue) {
    return (
      <PreferencesContext.Provider value={overriddenContextValue}>
        {layout}
      </PreferencesContext.Provider>
    );
  }

  return layout;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  content: {
    gap: theme.spacing.xl,
  },
});

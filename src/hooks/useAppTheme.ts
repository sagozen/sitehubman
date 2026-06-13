import { usePreferences } from '@/src/hooks/usePreferences';

export function useAppTheme() {
  const { preferences, colors, resolvedColorMode, isDark, isReady, updatePreferences, resetPreferences } =
    usePreferences();

  return {
    preferences,
    colors,
    colorMode: preferences.colorMode,
    resolvedColorMode,
    isDark,
    isReady,
    updatePreferences,
    resetPreferences,
  };
}

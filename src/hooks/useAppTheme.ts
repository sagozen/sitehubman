import { useMemo } from 'react';
import { usePreferences } from '@/src/hooks/usePreferences';

export function useAppTheme() {
  const { preferences, colors, resolvedColorMode, isDark, isReady, updatePreferences, resetPreferences } =
    usePreferences();

  // FIX: Memoize return value to prevent creating a new object on every
  // render. When GuestHomeScreen calls useAppTheme() at the top of its
  // render, a new object reference would cascade through React's
  // reconciler and contribute to the "maximum update depth" loop.
  return useMemo(() => ({
    preferences,
    colors,
    colorMode: preferences.colorMode,
    resolvedColorMode,
    isDark,
    isReady,
    updatePreferences,
    resetPreferences,
  }), [preferences, colors, resolvedColorMode, isDark, isReady, updatePreferences, resetPreferences]);
}

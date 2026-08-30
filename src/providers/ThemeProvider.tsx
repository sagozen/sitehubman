import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { glassTheme } from '@/src/design-system/glass';
import { appleHIG, appleColors } from '@/src/design-system/apple-hig';

interface ThemeContextProps {
  isDark: boolean;
  toggleTheme: () => void;
  // Legacy colors shape — kept for backward compat
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textPrimary: string;
    textMuted: string;
    textSecondary: string;
    textInverse: string;
    textTertiary: string;
    border: string;
    disabled: string;
    success: string;
    warning: string;
    error: string;
    gradient: readonly [string, string];
  };
  spacing: typeof glassTheme.spacing;
  glass: typeof glassTheme;
  // Apple HIG resolved palette for current mode
  apple: typeof appleColors.dark | typeof appleColors.light;
  // Apple HIG rulebook (static)
  hig: typeof appleHIG;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

function buildColors(isDark: boolean) {
  const a = isDark ? appleColors.dark : appleColors.light;
  return {
    primary:         a.tint,
    accent:          isDark ? '#FF375F' : '#FF2D55',
    background:      a.background,
    surface:         a.backgroundSecondary,
    surfaceElevated: a.backgroundTertiary,
    text:            a.label,
    textPrimary:     a.label,
    textMuted:       a.labelSecondary,
    textSecondary:   a.labelSecondary,
    textInverse:     isDark ? '#000000' : '#FFFFFF',
    textTertiary:    a.labelTertiary,
    border:          a.separator,
    disabled:        isDark ? '#48484A' : '#C7C7CC',
    success:         a.success,
    warning:         a.warning,
    error:           a.destructive,
    gradient:        [a.tint, isDark ? '#5E5CE6' : '#5AC8FA'] as const,
  } as const;
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark' || systemScheme === null);
  const toggleTheme = () => setIsDark(prev => !prev);

  const value = useMemo<ThemeContextProps>(() => ({
    isDark,
    toggleTheme,
    colors:  buildColors(isDark),
    spacing: glassTheme.spacing,
    glass:   glassTheme,
    apple:   isDark ? appleColors.dark : appleColors.light,
    hig:     appleHIG,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// Convenience hook: resolves Apple HIG colors for current mode
export function useAppleTheme() {
  const { isDark, apple, hig } = useTheme();
  return { isDark, colors: apple, hig };
}

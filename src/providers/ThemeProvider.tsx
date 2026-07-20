import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { glassTheme } from '@/src/design-system/glass';

interface ThemeContextProps {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textSecondary: string;
    disabled: string;
    success: string;
    warning: string;
    error: string;
    gradient: readonly [string, string];
  };
  spacing: typeof glassTheme.spacing;
  glass: typeof glassTheme;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const LIGHT_COLORS = {
  primary: '#0A84FF',
  accent: '#FF2D55',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: 'rgba(255,255,255,0.85)',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  disabled: '#C7C7CC',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  gradient: ['#0A84FF', '#5AC8FA'] as const,
} as const;

const DARK_COLORS = {
  primary: '#0A84FF',
  accent: '#FF375F',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: 'rgba(44,44,46,0.55)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  disabled: '#48484A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  gradient: ['#0A84FF', '#5E5CE6'] as const,
} as const;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        colors: isDark ? DARK_COLORS : LIGHT_COLORS,
        spacing: glassTheme.spacing,
        glass: glassTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

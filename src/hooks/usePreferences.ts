import { useContext } from 'react';
import { PreferencesContext } from '@/src/providers/PreferencesProvider';
import { defaultUiPreferences } from '@/src/services/preferencesService';
import { resolveAppColors } from '@/src/constants/themeResolver';

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    return {
      preferences: defaultUiPreferences,
      colors: resolveAppColors(defaultUiPreferences, 'light'),
      resolvedColorMode: 'light' as const,
      isDark: false,
      isReady: false,
      updatePreferences: async () => {},
      resetPreferences: async () => {},
    };
  }
  return context;
}


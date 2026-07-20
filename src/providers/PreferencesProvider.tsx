import { PropsWithChildren, createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  resolveAppColors,
  resolveThemeMode,
  type ResolvedAppColors,
  type ResolvedThemeMode,
} from '@/src/constants/themeResolver';
import {
  defaultUiPreferences,
  getUiPreferences,
  resetUiPreferences,
  setUiPreferences,
} from '@/src/services/preferencesService';
import { UiPreferences } from '@/src/types/models';

interface PreferencesContextValue {
  preferences: UiPreferences;
  colors: ResolvedAppColors;
  resolvedColorMode: ResolvedThemeMode;
  isDark: boolean;
  isReady: boolean;
  updatePreferences: (next: Partial<UiPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] = useState<UiPreferences>(defaultUiPreferences);
  const [isReady, setIsReady] = useState(false);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const persistQueueRef = useRef(Promise.resolve());
  const resolvedColorMode = useMemo(
    () => resolveThemeMode(preferences.colorMode, systemScheme),
    [preferences.colorMode, systemScheme]
  );
  const colors = useMemo(
    () => resolveAppColors(preferences, resolvedColorMode),
    [preferences, resolvedColorMode]
  );
  const isDark = resolvedColorMode === 'dark';

  useEffect(() => {
    getUiPreferences()
      .then((stored) => {
        preferencesRef.current = stored;
        setPreferences(stored);
      })
      .finally(() => setIsReady(true));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      colors,
      resolvedColorMode,
      isDark,
      isReady,
      async updatePreferences(next) {
        const previous = preferencesRef.current;
        const updated = { ...preferencesRef.current, ...next };
        preferencesRef.current = updated;
        setPreferences(updated);

        const persist = persistQueueRef.current.then(() => setUiPreferences(preferencesRef.current));
        persistQueueRef.current = persist.catch(() => undefined);

        try {
          await persist;
        } catch (error) {
          preferencesRef.current = previous;
          setPreferences(previous);
          throw error;
        }
      },
      async resetPreferences() {
        const previous = preferencesRef.current;
        preferencesRef.current = defaultUiPreferences;
        setPreferences(defaultUiPreferences);

        const persist = persistQueueRef.current.then(() => resetUiPreferences());
        persistQueueRef.current = persist.catch(() => undefined);

        try {
          await persist;
        } catch (error) {
          preferencesRef.current = previous;
          setPreferences(previous);
          throw error;
        }
      },
    }),
    [colors, isDark, isReady, preferences, resolvedColorMode]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export { PreferencesContext };

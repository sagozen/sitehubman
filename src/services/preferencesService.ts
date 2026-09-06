import { FastStorage } from '@/src/utils/storage';
import { normalizeUiPreferences } from '@/src/constants/themeResolver';
import { UiPreferences } from '@/src/types/models';

const PREFERENCE_KEY = 'ui_preferences_v2';

export const defaultUiPreferences: UiPreferences = normalizeUiPreferences({
  language: 'en',
  profileTheme: 'mono',
  colorMode: 'dark',
  typographyColor: 'deep_teal',
});

export async function getUiPreferences(): Promise<UiPreferences> {
  try {
    const raw = await FastStorage.getItem(PREFERENCE_KEY);
    if (!raw) {
      // Migrate from legacy key if it exists
      const legacy = await FastStorage.getItem('ui_preferences_v1');
      if (legacy) {
        const parsed = normalizeUiPreferences(JSON.parse(legacy) as Partial<UiPreferences>);
        await setUiPreferences(parsed);
        return parsed;
      }
      return defaultUiPreferences;
    }
    return normalizeUiPreferences(JSON.parse(raw) as Partial<UiPreferences>);
  } catch {
    return defaultUiPreferences;
  }
}

export async function setUiPreferences(preferences: UiPreferences): Promise<void> {
  await FastStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
}

export async function resetUiPreferences(): Promise<void> {
  await FastStorage.removeItem(PREFERENCE_KEY);
}

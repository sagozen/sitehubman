import * as Updates from 'expo-updates';

/**
 * Optional background update check — does not block first paint.
 * Startup must not call reloadAsync(); expo-updates + fallbackToCacheTimeout handles loads.
 */
export async function checkAndApplyEasUpdate(): Promise<void> {
  if (__DEV__) return;
  if (!Updates.isEnabled) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    // Apply on next cold start; avoid reload loop on launch.
  } catch {
    // Offline or channel mismatch — use embedded bundle.
  }
}

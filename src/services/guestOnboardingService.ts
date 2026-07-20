import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sitehub/guest_onboarding_v1';

export async function hasSeenGuestOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markGuestOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

export async function resetGuestOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

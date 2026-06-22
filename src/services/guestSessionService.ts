/**
 * guestSessionService — standalone AsyncStorage helpers.
 * Does NOT import from guestCardDraftService to avoid circular dependency.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the key in sync with guestCardDraftService without importing from it
export const GUEST_CARD_ID_STORAGE_KEY = 'currentCardId';

export async function getStoredGuestCardId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(GUEST_CARD_ID_STORAGE_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

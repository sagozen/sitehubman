import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_CARD_ID_KEY } from '@/src/services/guestCardDraftService';

export async function getStoredGuestCardId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(CURRENT_CARD_ID_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

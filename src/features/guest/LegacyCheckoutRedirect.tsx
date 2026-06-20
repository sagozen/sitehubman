import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appRoutes } from '@/src/constants/navigation';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { CURRENT_CARD_ID_KEY } from '@/src/services/guestCardDraftService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Legacy routes forward to unified cloud checkout. */
export function LegacyCheckoutRedirect() {
  useEffect(() => {
    void (async () => {
      const cardId = await AsyncStorage.getItem(CURRENT_CARD_ID_KEY);
      if (cardId?.trim()) {
        router.replace(`/checkout/${encodeURIComponent(cardId.trim())}` as Href);
        return;
      }
      router.replace(appRoutes.guestDesign);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator color={guestUi.accent} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

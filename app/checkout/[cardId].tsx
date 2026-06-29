import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyCheckoutRedirect() {
  const { cardId } = useLocalSearchParams();
  return <Redirect href={`/payments/checkout/${cardId}`} />;
}

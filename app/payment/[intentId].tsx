import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyPaymentRedirect() {
  const { intentId } = useLocalSearchParams();
  return <Redirect href={`/payments/${intentId}`} />;
}

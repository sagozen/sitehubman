import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyOrderReceiptRedirect() {
  const { orderId } = useLocalSearchParams();
  return <Redirect href={`/orders/receipt/${orderId}`} />;
}

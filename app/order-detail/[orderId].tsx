import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyOrderDetailRedirect() {
  const { orderId } = useLocalSearchParams();
  return <Redirect href={`/orders/detail/${orderId}`} />;
}

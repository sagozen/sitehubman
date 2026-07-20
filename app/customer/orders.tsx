import { Redirect } from 'expo-router';

export default function LegacyCustomerOrdersRedirect() {
  return <Redirect href="/orders/track" />;
}

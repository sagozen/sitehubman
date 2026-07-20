import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function OrdersLayout() {
  return (
    <AuthGate allowedRoles={['guest', 'customer', 'sales', 'printer', 'admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

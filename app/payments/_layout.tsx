import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function PaymentsLayout() {
  return (
    <AuthGate allowedRoles={['guest', 'customer', 'sales', 'admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

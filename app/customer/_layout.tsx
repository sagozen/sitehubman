import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function CustomerLayout() {
  return (
    <AuthGate allowedRoles={['customer']} requireCustomer>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}


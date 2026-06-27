import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function CustomerLayout() {
  return (
    <AuthGate allowedRoles={['guest', 'customer']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

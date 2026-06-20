import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function AccountLayout() {
  return (
    <AuthGate allowedRoles={['customer']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

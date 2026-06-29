import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function SalesLayout() {
  return (
    <AuthGate allowedRoles={['sales', 'admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

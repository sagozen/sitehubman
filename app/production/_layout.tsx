import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function ProductionLayout() {
  return (
    <AuthGate allowedRoles={['printer', 'qa', 'admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

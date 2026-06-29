import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function ProductionLayout() {
  return (
    <AuthGate allowedRoles={['printer', 'qa_inspector', 'admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

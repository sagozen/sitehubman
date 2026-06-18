import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function FinanceLayout() {
  return (
    <AuthGate allowedRoles={['finance', 'admin', 'super_admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}

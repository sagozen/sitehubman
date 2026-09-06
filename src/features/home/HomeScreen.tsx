/**
 * HomeScreen entry — routes authenticated users to the premium dashboard,
 * guests to the original GuestHomeScreen.
 */
import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { PremiumHomeScreen } from '@/src/features/home/PremiumHomeScreen';

const GuestHomeScreen = lazy(() =>
  import('@/src/features/guest/GuestHomeScreen').then((m) => ({ default: m.GuestHomeScreen }))
);

function Spinner() {
  return (
    <View style={s.center}>
      <ActivityIndicator color="#0A84FF" />
    </View>
  );
}

export function HomeScreen() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  // Authenticated users get the premium dashboard; guests get the marketing home
  if (user && user.role !== 'guest') return <PremiumHomeScreen />;
  return (
    <Suspense fallback={<Spinner />}>
      <GuestHomeScreen />
    </Suspense>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
});

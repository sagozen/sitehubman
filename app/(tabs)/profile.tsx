import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { lazy, Suspense, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const GuestProfileScreen = lazy(() =>
  import('@/src/features/guest/GuestProfileScreen').then((m) => ({
    default: m.GuestProfileScreen,
  }))
);

const CustomerProfileScreen = lazy(() =>
  import('@/src/features/customer/CustomerProfileScreen').then((m) => ({
    default: m.CustomerProfileScreen,
  }))
);

const PayoutsProfileScreen = lazy(() =>
  import('@/src/features/payouts/PayoutsProfileScreen').then((m) => ({
    default: m.PayoutsProfileScreen,
  }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator />
    </View>
  );
}

export default function PayoutsProfileTabRoute() {
  const isGuest = useIsGuest();
  const { user } = useAuth();

  const Screen = useMemo(() => {
    if (isGuest) return GuestProfileScreen;
    if (user?.role === 'customer') return CustomerProfileScreen;
    return PayoutsProfileScreen;
  }, [isGuest, user?.role]);

  return (
    <Suspense fallback={<TabFallback />}>
      <Screen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

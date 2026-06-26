import { useIsGuest } from '@/src/hooks/useIsGuest';
import { lazy, Suspense, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const GuestProfileScreen = lazy(() =>
  import('@/src/features/guest/GuestProfileScreen').then((m) => ({
    default: m.GuestProfileScreen,
  }))
);

const CustomerProfileScreen = lazy(() =>
  import('@/src/features/customer/CustomerAnalysisScreen').then((m) => ({
    default: m.CustomerAnalysisScreen,
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

  const Screen = useMemo(() => {
    if (isGuest) return GuestProfileScreen;
    return CustomerProfileScreen;
  }, [isGuest]);

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

import { useIsGuest } from '@/src/hooks/useIsGuest';
import { lazy, Suspense, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const GuestConnectionsScreen = lazy(() =>
  import('@/src/features/guest/GuestConnectionsScreen').then((m) => ({
    default: m.GuestConnectionsScreen,
  }))
);

const CustomerConnectionsScreen = lazy(() =>
  import('@/src/features/customer/CustomerConnectionsScreen').then((m) => ({
    default: m.CustomerConnectionsScreen,
  }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator />
    </View>
  );
}

export default function ConnectionsTabRoute() {
  const isGuest = useIsGuest();
  const Screen = useMemo(() => (isGuest ? GuestConnectionsScreen : CustomerConnectionsScreen), [isGuest]);

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

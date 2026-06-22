import { useIsGuest } from '@/src/hooks/useIsGuest';
import { lazy, Suspense, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const GuestConnectionsScreen = lazy(() =>
  import('@/src/features/guest/GuestConnectionsScreen').then((m) => ({
    default: m.GuestConnectionsScreen,
  }))
);

const ConnectionsMomentsScreen = lazy(() =>
  import('@/src/features/customer/ConnectionsMomentsScreen').then((m) => ({
    default: m.ConnectionsMomentsScreen,
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
  const Screen = useMemo(
    () => (isGuest ? GuestConnectionsScreen : ConnectionsMomentsScreen),
    [isGuest],
  );

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

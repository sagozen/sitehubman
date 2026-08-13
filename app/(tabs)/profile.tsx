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

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

import { SeoHead } from '@/src/components/SeoHead';

export default function PayoutsProfileTabRoute() {
  const isGuest = useIsGuest();

  const Screen = useMemo(() => {
    if (isGuest) return GuestProfileScreen;
    return CustomerProfileScreen;
  }, [isGuest]);

  return (
    <>
      <SeoHead title="Profile" description="Edit your digital business card profile, update bio, and manage your professional presence." noIndex />
      <Suspense fallback={<TabFallback />}>
        <Screen />
      </Suspense>
    </>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});

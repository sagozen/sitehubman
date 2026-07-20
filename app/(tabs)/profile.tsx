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

import { Platform } from 'react-native';
import Head from 'expo-router/head';

export default function PayoutsProfileTabRoute() {
  const isGuest = useIsGuest();

  const Screen = useMemo(() => {
    if (isGuest) return GuestProfileScreen;
    return CustomerProfileScreen;
  }, [isGuest]);

  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>Digital Business Profile | Snap Tap NFC</title>
          <meta name="description" content="View and customize your digital business card profile, manage links, and update your personal bio." />
        </Head>
      )}
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

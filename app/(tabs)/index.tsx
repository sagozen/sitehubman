import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const HomeScreen = lazy(() =>
  import('@/src/features/home/HomeScreen').then((m) => ({ default: m.HomeScreen }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

import { SeoHead } from '@/src/components/SeoHead';

export default function HomeTabRoute() {
  return (
    <>
      <SeoHead title="Dashboard" description="Manage your NFC digital business cards, view recent activity, and track card interactions." noIndex />
      <Suspense fallback={<TabFallback />}>
        <HomeScreen />
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

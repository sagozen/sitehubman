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

import { Platform } from 'react-native';
import Head from 'expo-router/head';

export default function HomeTabRoute() {
  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>Home | Snap Tap NFC Global</title>
          <meta name="description" content="Manage your premium contactless identity, order custom NFC business cards, and track your interactions." />
        </Head>
      )}
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

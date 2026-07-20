import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const GuestConnectionsScreen = lazy(() =>
  import('@/src/features/guest/GuestConnectionsScreen').then((m) => ({
    default: m.GuestConnectionsScreen,
  }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

export default function ConnectionsTabRoute() {
  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>Moments & Connections | Snap Tap NFC</title>
          <meta name="description" content="View your contacts, log interaction moments, and view timeline logs of scanned cards." />
        </Head>
      )}
      <Suspense fallback={<TabFallback />}>
        <GuestConnectionsScreen />
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

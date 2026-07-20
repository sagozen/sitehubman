import { lazy, Suspense } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Head from 'expo-router/head';

const SettingsScreen = lazy(() =>
  import('@/src/features/settings/SettingsScreen').then((m) => ({
    default: m.SettingsScreen,
  }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

export default function SettingsTabRoute() {
  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>Settings | Snap Tap NFC</title>
          <meta
            name="description"
            content="Manage Snap Tap NFC account settings, card preferences, appearance, language, and privacy links."
          />
        </Head>
      ) : null}
      <Suspense fallback={<TabFallback />}>
        <SettingsScreen />
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

import { lazy, Suspense } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SeoHead } from '@/src/components/SeoHead';

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
      <SeoHead title="Settings" description="Manage account settings, card preferences, appearance, language, and privacy." noIndex />
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

import { SeoHead } from '@/src/components/SeoHead';
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
      <SeoHead title="Connections" description="View and manage your NFC card connections, interaction moments, and contact timeline." noIndex />
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

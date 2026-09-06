import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SeoHead } from '@/src/components/SeoHead';

const CustomerNotificationsScreen = lazy(() =>
  import('@/src/features/customer/CustomerNotificationsScreen').then((m) => ({
    default: m.CustomerNotificationsScreen,
  }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

export default function NotificationsTabRoute() {
  return (
    <>
      <SeoHead title="Notifications" description="Your NFC tap alerts, contact exchanges, and updates." noIndex />
      <Suspense fallback={<TabFallback />}>
        <CustomerNotificationsScreen />
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

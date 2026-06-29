import { Tabs, useRouter, useSegments } from 'expo-router';
import { PanResponder, View, StyleSheet } from 'react-native';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

const SALES_TABS = ['dashboard', 'orders', 'payouts', 'settings'];

export default function SalesLayout() {
  const router = useRouter();
  const segments = useSegments();

  const currentTab = segments[segments.length - 1] || 'dashboard';

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      const { dx, dy } = gestureState;
      return Math.abs(dx) > 40 && Math.abs(dy) < 20;
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx } = gestureState;
      const currentIndex = SALES_TABS.indexOf(currentTab);
      if (currentIndex === -1) return;

      if (dx < -60) {
        if (currentIndex < SALES_TABS.length - 1) {
          router.navigate(`/sales/${SALES_TABS[currentIndex + 1]}` as any);
        }
      } else if (dx > 60) {
        if (currentIndex > 0) {
          router.navigate(`/sales/${SALES_TABS[currentIndex - 1]}` as any);
        }
      }
    },
  });

  return (
    <AuthGate allowedRoles={['sales', 'admin']}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <Tabs
          tabBar={(props) => <LiquidTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
          <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
          <Tabs.Screen name="payouts" options={{ title: 'Earnings' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
          <Tabs.Screen name="index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="customers" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="new-order" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        </Tabs>
      </View>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

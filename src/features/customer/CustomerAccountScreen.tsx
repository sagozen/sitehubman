/**
 * CustomerAccountScreen — Premium Apple-inspired Home Screen.
 * Prioritizes the Digital NFC Card, Quick Actions, and borderless insights.
 */
import { memo, useCallback, useState } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerOrders } from '@/src/hooks/useCustomerOrders';
import { appRoutes } from '@/src/constants/navigation';

// Premium Components
import { CustomerHeroCard } from './components/CustomerHeroCard';
import { QuickActionGrid } from './components/QuickActionGrid';
import { RecentActivityTimeline } from './components/RecentActivityTimeline';
import { CustomerModuleCarousel } from './components/CustomerModuleCarousel';
import { FAB } from '@/src/components/FAB';
import { QuickActionModal } from '@/src/components/QuickActionModal';

export function CustomerAccountScreen() {
  const { user } = useAuth();
  
  // Real data (mixes with fake fallbacks in the components if missing)
  const { headlineOrder } = useCustomerOrders(user?.id, user?.email);
  const [fabOpen, setFabOpen] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out my digital business card: https://sitehubman.com/profile/${user?.id}`,
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  }, [user]);

  const handleQr = useCallback(() => {
    router.push(appRoutes.qrGenerator as any);
  }, []);

  const handleAction = useCallback((id: string) => {
    switch(id) {
      case 'create':
        router.push(appRoutes.guestDesign as any);
        break;
      case 'share':
        handleShare();
        break;
      case 'scan':
        router.push(appRoutes.scan as any);
        break;
      case 'orders':
        router.push(appRoutes.customer.orders as any);
        break;
    }
  }, [handleShare]);

  const handleModulePress = useCallback((id: string) => {
    switch (id) {
      case 'orders':
        router.push(appRoutes.customer.orders as any);
        break;
      case 'templates':
        router.push(appRoutes.customer.templates as any);
        break;
      case 'analytics':
        router.push(appRoutes.customerAnalysis as any);
        break;
      case 'network':
        router.push(appRoutes.customerConnections as any);
        break;
      case 'signals':
        Alert.alert('Signals Module', 'Signals updates coming soon!');
        break;
    }
  }, []);

  const handleActivityPress = useCallback((id: string) => {
    router.navigate({ pathname: '/connections', params: { momentId: id } } as any);
  }, []);

  return (
    <View style={styles.root}>
      <IosScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* 1. Hero Card */}
        <CustomerHeroCard 
          user={user} 
          onShare={handleShare} 
          onQr={handleQr} 
        />

        {/* 2. Quick Actions */}
        <QuickActionGrid onActionPress={handleAction} />



        {/* 5. Recent Activity */}
        <RecentActivityTimeline onActivityPress={handleActivityPress} />

        {/* 6. Modules Carousel */}
        <CustomerModuleCarousel onModulePress={handleModulePress} />

      </IosScrollView>
      <FAB onPress={() => setFabOpen(true)} />
      <QuickActionModal visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // Reduced space slightly for Liquid Dock
    gap: 16, // Reduced from 24
  },
});


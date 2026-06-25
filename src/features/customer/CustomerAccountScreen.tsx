/**
 * CustomerAccountScreen — Premium Apple-inspired Home Screen.
 * Prioritizes the Digital NFC Card, Quick Actions, and borderless insights.
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerOrders } from '@/src/hooks/useCustomerOrders';
import { appRoutes } from '@/src/constants/navigation';

// Premium Components
import { CustomerHeroCard } from './components/CustomerHeroCard';
import { QuickActionGrid } from './components/QuickActionGrid';
import { ContinueWorkingTasks } from './components/ContinueWorkingTasks';
import { RecentActivityTimeline } from './components/RecentActivityTimeline';
import { CustomerModuleCarousel } from './components/CustomerModuleCarousel';

export function CustomerAccountScreen() {
  const { user } = useAuth();
  
  // Real data (mixes with fake fallbacks in the components if missing)
  const { headlineOrder } = useCustomerOrders(user?.id, user?.email);

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
    router.push('/qr-generator' as any);
  }, []);

  const handleAction = useCallback((id: string) => {
    switch(id) {
      case 'create':
        router.push('/new-order' as any);
        break;
      case 'share':
        handleShare();
        break;
      case 'scan':
        router.push('/scan' as any);
        break;
      case 'orders':
        router.push(appRoutes.accountOrders as any);
        break;
    }
  }, [handleShare]);

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

        {/* 3. Tasks (Continue Working) */}
        <ContinueWorkingTasks />

        {/* 5. Recent Activity */}
        <RecentActivityTimeline />

        {/* 6. Modules Carousel */}
        <CustomerModuleCarousel />

      </IosScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    paddingBottom: 100, // Space for Liquid Dock
  },
});

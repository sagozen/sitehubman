// Subscription Management Hook
// Handles user subscription state and plan management

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SUBSCRIPTION_PLANS, SubscriptionPlan, hasFeature, isWithinLimit } from '@/src/constants/subscriptionPlans';
import { subscriptionService } from '@/src/services/subscriptionService';

export interface UserSubscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: SubscriptionPlan;
}

export interface SubscriptionUsage {
  digitalCards: number;
  taps: number;
  connections: number;
  exports: number;
  teamMembers?: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subData, usageData] = await Promise.all([
        subscriptionService.getUserSubscription(user!.id),
        subscriptionService.getUsage(user!.id),
      ]);

      setSubscription(subData);
      setUsage(usageData);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // Get current plan (defaults to free)
  const getCurrentPlan = (): SubscriptionPlan => {
    if (!subscription) {
      return SUBSCRIPTION_PLANS.free;
    }
    return SUBSCRIPTION_PLANS[subscription.planId] || SUBSCRIPTION_PLANS.free;
  };

  // Check if user has access to a specific feature
  const hasAccess = (feature: keyof typeof SUBSCRIPTION_PLANS.free.features): boolean => {
    const plan = getCurrentPlan();
    return hasFeature(plan.id, feature);
  };

  // Check if user is within usage limits
  const isWithinUsageLimit = (limit: keyof typeof SUBSCRIPTION_PLANS.free.limits): boolean => {
    if (!usage) return true;
    
    const plan = getCurrentPlan();
    const currentUsage = usage[limit as keyof SubscriptionUsage] || 0;
    
    return isWithinLimit(plan.id, limit, currentUsage as number);
  };

  // Get usage percentage for a limit
  const getUsagePercentage = (limit: keyof typeof SUBSCRIPTION_PLANS.free.limits): number => {
    if (!usage) return 0;
    
    const plan = getCurrentPlan();
    const limitValue = plan.limits[limit];
    
    if (!limitValue || limitValue === 'unlimited') return 0;
    
    const currentUsage = usage[limit as keyof SubscriptionUsage] || 0;
    return Math.round((currentUsage / (limitValue as number)) * 100);
  };

  // Check if user needs to upgrade for a feature
  const needsUpgrade = (feature: keyof typeof SUBSCRIPTION_PLANS.free.features): boolean => {
    return !hasAccess(feature);
  };

  // Get the next plan that includes a feature
  const getUpgradePlan = (feature: keyof typeof SUBSCRIPTION_PLANS.free.features): SubscriptionPlan | null => {
    const currentPlan = getCurrentPlan();
    const plans = Object.values(SUBSCRIPTION_PLANS);
    
    // Find the next plan that has this feature
    for (const plan of plans) {
      if (plan.features[feature] && plan.id !== currentPlan.id) {
        // Return the cheapest plan that has the feature
        if (plan.priceMonthly && (!currentPlan.priceMonthly || plan.priceMonthly > currentPlan.priceMonthly)) {
          return plan;
        }
      }
    }
    
    return null;
  };

  // Check if subscription is active
  const isActive = (): boolean => {
    if (!subscription) return false;
    return subscription.status === 'active' || subscription.status === 'trialing';
  };

  // Check if subscription is expiring soon
  const isExpiringSoon = (days: number = 7): boolean => {
    if (!subscription) return false;
    
    const daysUntilExpiry = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    return daysUntilExpiry <= days;
  };

  // Get days until expiry
  const getDaysUntilExpiry = (): number => {
    if (!subscription) return 0;
    
    return Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  // Subscription actions
  const upgrade = async (planId: string, annually: boolean = false) => {
    try {
      setLoading(true);
      const result = await subscriptionService.createSubscription(
        user!.id,
        planId,
        annually
      );
      
      // Redirect to Stripe checkout or handle payment
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
      
      return result;
    } catch (err) {
      console.error('Upgrade failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    try {
      setLoading(true);
      await subscriptionService.cancelSubscription(subscription!.stripeSubscriptionId);
      await loadSubscription(); // Reload to get updated data
    } catch (err) {
      console.error('Cancel failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactivate = async () => {
    try {
      setLoading(true);
      await subscriptionService.reactivateSubscription(subscription!.stripeSubscriptionId);
      await loadSubscription();
    } catch (err) {
      console.error('Reactivate failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async () => {
    try {
      const result = await subscriptionService.createPortalSession(
        subscription!.stripeCustomerId
      );
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Payment method update failed:', err);
      throw err;
    }
  };

  return {
    // State
    subscription,
    usage,
    loading,
    error,
    
    // Current plan info
    currentPlan: getCurrentPlan(),
    isActive: isActive(),
    isExpiringSoon: isExpiringSoon(),
    daysUntilExpiry: getDaysUntilExpiry(),
    
    // Feature access
    hasAccess,
    needsUpgrade,
    getUpgradePlan,
    
    // Usage limits
    isWithinUsageLimit,
    getUsagePercentage,
    
    // Actions
    upgrade,
    cancel,
    reactivate,
    updatePaymentMethod,
    refresh: loadSubscription,
  };
}

// Hook for checking specific features
export function useFeature(feature: keyof typeof SUBSCRIPTION_PLANS.free.features) {
  const { hasAccess, needsUpgrade, getUpgradePlan, currentPlan } = useSubscription();
  
  return {
    hasAccess: hasAccess(feature),
    needsUpgrade: needsUpgrade(feature),
    upgradePlan: getUpgradePlan(feature),
    currentPlan,
  };
}

// Hook for usage limits
export function useUsageLimit(limit: keyof typeof SUBSCRIPTION_PLANS.free.limits) {
  const { isWithinUsageLimit, getUsagePercentage, usage, currentPlan } = useSubscription();
  
  const limitValue = currentPlan.limits[limit];
  const currentUsage = usage?.[limit as keyof SubscriptionUsage] || 0;
  
  return {
    isWithinLimit: isWithinUsageLimit(limit),
    percentage: getUsagePercentage(limit),
    current: currentUsage,
    limit: limitValue,
    remaining: !limitValue || limitValue === 'unlimited' ? 'unlimited' : (limitValue as number) - currentUsage,
  };
}
// Complete Subscription Service Implementation
// Handles all payment processing, subscription management, and billing

import { SUBSCRIPTION_PLANS } from '@/src/constants/subscriptionPlans';
import { app, db } from '@/src/services/firebase/firebase.shared';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

const auth = app ? getAuth(app) : (null as any);
const firestore = db!;

interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  userId: string;
}

interface StripeSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

interface UsageData {
  digitalCards: number;
  taps: number;
  connections: number;
  exports: number;
  teamMembers: number;
}

export class SubscriptionService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

  // Create or retrieve Stripe customer
  async createOrGetCustomer(userId: string, email: string, name: string): Promise<StripeCustomer> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          userId,
          email,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const customer = await response.json();
      
      // Save customer to Firestore
      await setDoc(doc(firestore, 'stripe_customers', userId), {
        customerId: customer.id,
        email,
        name,
        created: new Date(),
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create subscription with checkout
  async createSubscription(
    userId: string,
    planId: string,
    annually: boolean = false,
    trialDays: number = 14
  ): Promise<{ checkoutUrl?: string; subscriptionId?: string }> {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
      }

      const priceId = annually ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
      if (!priceId) {
        throw new Error(`No price ID for plan: ${planId}`);
      }

      const response = await fetch(`${this.baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          userId,
          priceId,
          planId,
          trialDays,
          successUrl: `${this.baseUrl}/subscription/success`,
          cancelUrl: `${this.baseUrl}/pricing`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<any> {
    try {
      const subscriptionDoc = await getDoc(doc(firestore, 'subscriptions', userId));
      
      if (!subscriptionDoc.exists()) {
        // Return free plan as default
        return {
          id: 'free',
          planId: 'free',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
          plan: SUBSCRIPTION_PLANS.free,
        };
      }

      const data = subscriptionDoc.data();
      return {
        ...data,
        currentPeriodStart: data.currentPeriodStart?.toDate(),
        currentPeriodEnd: data.currentPeriodEnd?.toDate(),
        trialEnd: data.trialEnd?.toDate(),
        plan: SUBSCRIPTION_PLANS[data.planId] || SUBSCRIPTION_PLANS.free,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // Get usage data for limits
  async getUsage(userId: string): Promise<UsageData> {
    try {
      const usageDoc = await getDoc(doc(firestore, 'usage', userId));
      
      if (!usageDoc.exists()) {
        return {
          digitalCards: 0,
          taps: 0,
          connections: 0,
          exports: 0,
          teamMembers: 0,
        };
      }

      return usageDoc.data() as UsageData;
    } catch (error) {
      console.error('Error fetching usage:', error);
      throw error;
    }
  }

  // Update usage (called when user performs actions)
  async updateUsage(userId: string, updates: Partial<UsageData>): Promise<void> {
    try {
      const usageRef = doc(firestore, 'usage', userId);
      const usageDoc = await getDoc(usageRef);
      
      if (!usageDoc.exists()) {
        await setDoc(usageRef, {
          digitalCards: 0,
          taps: 0,
          connections: 0,
          exports: 0,
          teamMembers: 0,
          ...updates,
          lastUpdated: new Date(),
        });
      } else {
        await updateDoc(usageRef, {
          ...updates,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating usage:', error);
      throw error;
    }
  }

  // Increment usage counters
  async incrementUsage(userId: string, type: keyof UsageData, amount: number = 1): Promise<void> {
    try {
      const current = await this.getUsage(userId);
      await this.updateUsage(userId, {
        [type]: (current[type] || 0) + amount,
      });
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Create billing portal session
  async createPortalSession(customerId: string): Promise<{ url: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          customerId,
          returnUrl: `${this.baseUrl}/account/billing`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Listen to subscription changes in real-time
  subscribeToUserSubscription(userId: string, callback: (subscription: any) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(firestore, 'subscriptions', userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            ...data,
            currentPeriodStart: data.currentPeriodStart?.toDate(),
            currentPeriodEnd: data.currentPeriodEnd?.toDate(),
            trialEnd: data.trialEnd?.toDate(),
            plan: SUBSCRIPTION_PLANS[data.planId] || SUBSCRIPTION_PLANS.free,
          });
        } else {
          callback({
            id: 'free',
            planId: 'free',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            plan: SUBSCRIPTION_PLANS.free,
          });
        }
      },
      (error) => {
        console.error('Error listening to subscription:', error);
      }
    );

    return unsubscribe;
  }

  // Get pricing for card products (physical cards)
  async getCardPricing(productId: string, quantity: number = 1): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pricing/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching card pricing:', error);
      throw error;
    }
  }

  // Create card order (physical products)
  async createCardOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number; customization?: any }>
  ): Promise<{ checkoutUrl: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          userId,
          items,
          successUrl: `${this.baseUrl}/orders/success`,
          cancelUrl: `${this.baseUrl}/cards/design`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating card order:', error);
      throw error;
    }
  }

  // Analytics for subscription performance
  async getSubscriptionAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/subscriptions?range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Coupon/discount validation
  async validateCoupon(couponCode: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }

  // Feature flag checks (for gradual rollouts)
  async getFeatureFlags(userId: string): Promise<Record<string, boolean>> {
    try {
      const flagsDoc = await getDoc(doc(firestore, 'feature_flags', userId));
      
      if (!flagsDoc.exists()) {
        return {};
      }

      return flagsDoc.data() as Record<string, boolean>;
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return {};
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

// Utility functions for common operations
export async function trackCardCreated(userId: string) {
  await subscriptionService.incrementUsage(userId, 'digitalCards');
}

export async function trackCardTapped(userId: string) {
  await subscriptionService.incrementUsage(userId, 'taps');
}

export async function trackConnectionMade(userId: string) {
  await subscriptionService.incrementUsage(userId, 'connections');
}

export async function trackExport(userId: string) {
  await subscriptionService.incrementUsage(userId, 'exports');
}

export async function trackTeamMemberAdded(userId: string) {
  await subscriptionService.incrementUsage(userId, 'teamMembers');
}
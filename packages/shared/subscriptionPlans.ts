/**
 * @package packages/shared/subscriptionPlans
 * Shared Subscription Plans configuration for both Expo Mobile App & Vite Web App.
 */

export interface SubscriptionFeatures {
  digitalCards: number | 'unlimited';
  analytics: '30-day' | 'lifetime';
  customBranding: boolean;
  prioritySupport: boolean;
  exportContacts: boolean;
  customDomain: boolean;
  qrCodeGenerator: boolean;
  advancedAnalytics: boolean;
  teamManagement: boolean;
  bulkOrdering: boolean;
  crmIntegration: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  dedicatedSupport: boolean;
  cardOrdering?: boolean;
}

export interface SubscriptionLimits {
  taps: number | 'unlimited';
  connections: number | 'unlimited';
  teamMembers?: number | 'unlimited';
  templates: number | 'unlimited';
  exports: number | 'unlimited';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number;
  priceYearly?: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  popular?: boolean;
  badge?: string;
  color: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out digital cards',
    color: '#6B7280',
    features: {
      digitalCards: 1,
      analytics: '30-day',
      customBranding: false,
      prioritySupport: false,
      exportContacts: false,
      customDomain: false,
      qrCodeGenerator: true,
      advancedAnalytics: false,
      teamManagement: false,
      bulkOrdering: false,
      crmIntegration: false,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
    limits: {
      taps: 100,
      connections: 50,
      templates: 3,
      exports: 0,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Everything you need for professional networking',
    priceMonthly: 9.99,
    priceYearly: 99,
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    popular: true,
    badge: 'Most Popular',
    color: '#F59E0B',
    features: {
      digitalCards: 'unlimited',
      analytics: 'lifetime',
      customBranding: true,
      prioritySupport: true,
      exportContacts: true,
      customDomain: true,
      qrCodeGenerator: true,
      advancedAnalytics: true,
      teamManagement: false,
      bulkOrdering: false,
      crmIntegration: false,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
    },
    limits: {
      taps: 'unlimited',
      connections: 'unlimited',
      templates: 'unlimited',
      exports: 'unlimited',
    },
  },

  business: {
    id: 'business',
    name: 'Business',
    description: 'Advanced features for teams and growing businesses',
    priceMonthly: 29.99,
    priceYearly: 299,
    stripePriceIdMonthly: 'price_business_monthly',
    stripePriceIdYearly: 'price_business_yearly',
    badge: 'Best Value',
    color: '#10B981',
    features: {
      digitalCards: 'unlimited',
      analytics: 'lifetime',
      customBranding: true,
      prioritySupport: true,
      exportContacts: true,
      customDomain: true,
      qrCodeGenerator: true,
      advancedAnalytics: true,
      teamManagement: true,
      bulkOrdering: true,
      crmIntegration: true,
      apiAccess: true,
      whiteLabel: false,
      dedicatedSupport: true,
    },
    limits: {
      taps: 'unlimited',
      connections: 'unlimited',
      teamMembers: 20,
      templates: 'unlimited',
      exports: 'unlimited',
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    color: '#8B5CF6',
    badge: 'Contact Sales',
    features: {
      digitalCards: 'unlimited',
      analytics: 'lifetime',
      customBranding: true,
      prioritySupport: true,
      exportContacts: true,
      customDomain: true,
      qrCodeGenerator: true,
      advancedAnalytics: true,
      teamManagement: true,
      bulkOrdering: true,
      crmIntegration: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
    limits: {
      taps: 'unlimited',
      connections: 'unlimited',
      teamMembers: 'unlimited',
      templates: 'unlimited',
      exports: 'unlimited',
    },
  },
};

// Subscription Plans Configuration
// Complete monetization setup for AVIO

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
    color: '#3B82F6',
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
    description: 'Advanced features for teams and businesses',
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

// Feature descriptions for marketing
export const FEATURE_DESCRIPTIONS = {
  digitalCards: 'Create unlimited digital business cards',
  analytics: 'Track card performance and interactions',
  customBranding: 'Remove AVIO branding and add your own',
  prioritySupport: '24/7 priority email and chat support',
  exportContacts: 'Export connections to CSV, vCard, or CRM',
  customDomain: 'Use your own domain (yourname.company.com)',
  qrCodeGenerator: 'Generate QR codes for your cards',
  advancedAnalytics: 'Detailed insights, heatmaps, and reports',
  teamManagement: 'Manage team members and permissions',
  bulkOrdering: 'Order cards in bulk with team discounts',
  crmIntegration: 'Connect to Salesforce, HubSpot, and more',
  apiAccess: 'Full API access for custom integrations',
  whiteLabel: 'Complete white-label solution',
  dedicatedSupport: 'Dedicated account manager and phone support',
};

// Pricing display helpers
export const getPlanPrice = (plan: SubscriptionPlan, annually: boolean = false): number => {
  if (annually && plan.priceYearly) {
    return plan.priceYearly;
  }
  return plan.priceMonthly || 0;
};

export const getPlanSavings = (plan: SubscriptionPlan): number => {
  if (!plan.priceMonthly || !plan.priceYearly) return 0;
  const monthlyTotal = plan.priceMonthly * 12;
  return monthlyTotal - plan.priceYearly;
};

export const getPlanSavingsPercentage = (plan: SubscriptionPlan): number => {
  if (!plan.priceMonthly || !plan.priceYearly) return 0;
  const monthlyTotal = plan.priceMonthly * 12;
  const savings = monthlyTotal - plan.priceYearly;
  return Math.round((savings / monthlyTotal) * 100);
};

// Check if user has access to feature
export const hasFeature = (
  userPlan: string,
  feature: keyof SubscriptionFeatures
): boolean => {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (!plan) return false;
  return Boolean(plan.features[feature]);
};

// Check if user is within limits
export const isWithinLimit = (
  userPlan: string,
  limit: keyof SubscriptionLimits,
  currentUsage: number
): boolean => {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (!plan) return false;
  
  const limitValue = plan.limits[limit];
  if (limitValue === undefined || limitValue === 'unlimited') return true;
  return currentUsage < limitValue;
};

// Get upgrade suggestions
export const getUpgradeSuggestion = (
  currentPlan: string,
  feature: keyof SubscriptionFeatures
): string | null => {
  const plans = Object.values(SUBSCRIPTION_PLANS);
  
  for (const plan of plans) {
    if (plan.features[feature] && plan.id !== currentPlan) {
      return plan.id;
    }
  }
  
  return null;
};

// Plan comparison data
export const PLAN_COMPARISON = [
  {
    feature: 'Digital Cards',
    free: '1 card',
    pro: 'Unlimited',
    business: 'Unlimited',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Analytics History',
    free: '30 days',
    pro: 'Lifetime',
    business: 'Lifetime', 
    enterprise: 'Lifetime',
  },
  {
    feature: 'Custom Branding',
    free: '❌',
    pro: '✅',
    business: '✅',
    enterprise: '✅',
  },
  {
    feature: 'Export Contacts',
    free: '❌',
    pro: '✅',
    business: '✅',
    enterprise: '✅',
  },
  {
    feature: 'Team Management',
    free: '❌',
    pro: '❌',
    business: '✅ (20 users)',
    enterprise: '✅ (Unlimited)',
  },
  {
    feature: 'API Access',
    free: '❌',
    pro: '❌',
    business: '✅',
    enterprise: '✅',
  },
  {
    feature: 'White Label',
    free: '❌',
    pro: '❌',
    business: '❌',
    enterprise: '✅',
  },
];
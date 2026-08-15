// Paywall Banner Component
// Shows upgrade prompts throughout the app for premium features

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/src/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/src/constants/subscriptionPlans';

interface PaywallBannerProps {
  feature: string;
  description?: string;
  requiredPlan?: 'pro' | 'business' | 'enterprise';
  style?: any;
  compact?: boolean;
  showIcon?: boolean;
  ctaText?: string;
  onUpgrade?: () => void;
}

export function PaywallBanner({
  feature,
  description,
  requiredPlan = 'pro',
  style,
  compact = false,
  showIcon = true,
  ctaText,
  onUpgrade,
}: PaywallBannerProps) {
  const router = useRouter();
  const { currentPlan, upgrade } = useSubscription();

  // Don't show if user already has access
  if (currentPlan.id === requiredPlan || 
      (requiredPlan === 'pro' && ['business', 'enterprise'].includes(currentPlan.id))) {
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[requiredPlan];
  const price = plan.priceMonthly ? `$${plan.priceMonthly}/mo` : 'Custom';

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else if (requiredPlan === 'enterprise') {
      router.push('/contact-sales' as any);
    } else {
      router.push('/pricing' as any);
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactContent}>
          <Text style={styles.compactFeature}>{feature}</Text>
          <Text style={styles.compactPlan}>
            {plan.name} {price !== 'Custom' ? `(${price})` : ''}
          </Text>
        </View>
        <Pressable style={styles.compactButton} onPress={handleUpgrade}>
          <Text style={styles.compactButtonText}>
            {ctaText || 'Upgrade'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#F3F4F6', '#E5E7EB']}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⭐</Text>
          </View>
        )}
        
        <View style={styles.textContent}>
          <Text style={styles.title}>
            Unlock {feature}
          </Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          <Text style={styles.planInfo}>
            Available in {plan.name} plan{price !== 'Custom' ? ` (${price})` : ''}
          </Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={handleUpgrade}>
        <LinearGradient
          colors={[plan.color, adjustColor(plan.color, -20)]}
          style={styles.buttonGradient}
        />
        <Text style={styles.buttonText}>
          {ctaText || `Upgrade to ${plan.name}`}
        </Text>
      </Pressable>
    </View>
  );
}

// Feature-specific paywall components for common use cases

export function AnalyticsPaywall({ style }: { style?: any }) {
  return (
    <PaywallBanner
      feature="Advanced Analytics"
      description="See detailed tap insights, heatmaps, device breakdown, and export data"
      requiredPlan="pro"
      style={style}
    />
  );
}

export function ExportPaywall({ style }: { style?: any }) {
  return (
    <PaywallBanner
      feature="Export Contacts"
      description="Export your connections to CSV, vCard, or sync with your CRM"
      requiredPlan="pro"
      compact={true}
      style={style}
    />
  );
}

export function CustomBrandingPaywall({ style }: { style?: any }) {
  return (
    <PaywallBanner
      feature="Custom Branding"
      description="Remove AVIO branding and add your own logo and colors"
      requiredPlan="pro"
      style={style}
    />
  );
}

export function TeamManagementPaywall({ style }: { style?: any }) {
  return (
    <PaywallBanner
      feature="Team Management"
      description="Manage team members, bulk order cards, and view team analytics"
      requiredPlan="business"
      style={style}
    />
  );
}

export function APIAccessPaywall({ style }: { style?: any }) {
  return (
    <PaywallBanner
      feature="API Access"
      description="Integrate AVIO with your existing systems and workflows"
      requiredPlan="business"
      style={style}
    />
  );
}

// Usage limit warning component
interface UsageLimitWarningProps {
  limitType: string;
  current: number;
  limit: number;
  percentage: number;
  style?: any;
}

export function UsageLimitWarning({
  limitType,
  current,
  limit,
  percentage,
  style,
}: UsageLimitWarningProps) {
  const router = useRouter();

  if (percentage < 80) return null;

  const isAtLimit = percentage >= 100;
  const isNearLimit = percentage >= 90;

  return (
    <View style={[styles.limitWarning, isAtLimit && styles.limitWarningDanger, style]}>
      <View style={styles.limitContent}>
        <Text style={styles.limitTitle}>
          {isAtLimit ? `${limitType} Limit Reached` : `${limitType} Limit Warning`}
        </Text>
        <Text style={styles.limitText}>
          You've used {current} of {limit} {limitType.toLowerCase()}{isAtLimit ? '' : ` (${percentage}%)`}
        </Text>
      </View>

      <View style={styles.limitProgress}>
        <View style={[
          styles.limitProgressBar,
          { width: `${Math.min(percentage, 100)}%` },
          isAtLimit && styles.limitProgressBarDanger,
          isNearLimit && styles.limitProgressBarWarning,
        ]} />
      </View>

      <Pressable
        style={[styles.limitButton, isAtLimit && styles.limitButtonDanger]}
        onPress={() => router.push('/pricing' as any)}
      >
        <Text style={[styles.limitButtonText, isAtLimit && styles.limitButtonTextDanger]}>
          {isAtLimit ? 'Upgrade Now' : 'Upgrade Plan'}
        </Text>
      </Pressable>
    </View>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  // Simple color adjustment - in a real app you'd want a proper color library
  return color;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  planInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  button: {
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactContent: {
    flex: 1,
  },
  compactFeature: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  compactPlan: {
    fontSize: 12,
    color: '#6B7280',
  },
  compactButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Usage limit warning styles
  limitWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  limitWarningDanger: {
    backgroundColor: '#FEE2E2',
    borderLeftColor: '#EF4444',
  },
  limitContent: {
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  limitText: {
    fontSize: 13,
    color: '#A16207',
  },
  limitProgress: {
    height: 4,
    backgroundColor: '#FDE68A',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  limitProgressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  limitProgressBarWarning: {
    backgroundColor: '#F59E0B',
  },
  limitProgressBarDanger: {
    backgroundColor: '#EF4444',
  },
  limitButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  limitButtonDanger: {
    backgroundColor: '#EF4444',
  },
  limitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  limitButtonTextDanger: {
    color: '#ffffff',
  },
});
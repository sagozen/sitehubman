// Pricing Page - Premium dark design matching AVIO design system
// Pure black canvas, high-contrast border cards, B&W buttons

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  SUBSCRIPTION_PLANS,
  PLAN_COMPARISON,
  getPlanPrice,
  getPlanSavings,
} from '@/src/constants/subscriptionPlans';
import { useSubscription } from '@/src/hooks/useSubscription';
import { AppText } from '@/src/components/AppText';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// ─── Design tokens ───────────────────────────────────────────────────────────
const D = {
  bg: '#000000',
  surface: '#111114',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.18)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.45)',
  mutedMid: 'rgba(255,255,255,0.6)',
  green: '#10B981',
  accent: '#D97706',
  destructive: '#FF453A',
  radius: 16,
  radiusSm: 10,
  radiusPill: 999,
};

// ─── Pressable card wrapper ───────────────────────────────────────────────────
function AnimatedPress({
  onPress,
  style,
  children,
  disabled,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [scale]);

  const onOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPressIn={onIn}
      onPressOut={onOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Feature check row ────────────────────────────────────────────────────────
function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureCheckCircle}>
        <Ionicons name="checkmark" size={12} color="#000000" />
      </View>
      <AppText style={styles.featureText}>{text}</AppText>
    </View>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  billingPeriod,
  isCurrentPlan,
  isLoading,
  onSelect,
}: {
  plan: any;
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const price = getPlanPrice(plan, billingPeriod === 'yearly');
  const savings = getPlanSavings(plan);
  const features = getKeyFeatures(plan);
  const isPrimary = plan.popular;

  return (
    <View style={[styles.planCard, isPrimary && styles.planCardPopular]}>
      {isPrimary && (
        <View style={styles.popularBadge}>
          <Ionicons name="star" size={10} color="#000000" style={{ marginRight: 4 }} />
          <AppText style={styles.popularText} weight="bold">
            Most Popular
          </AppText>
        </View>
      )}

      <View style={styles.planHeader}>
        <AppText style={styles.planName} weight="bold">
          {plan.name}
        </AppText>
        <AppText style={styles.planDesc}>{plan.description}</AppText>
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        {price > 0 ? (
          <>
            <AppText style={styles.priceCurrency} weight="bold">$</AppText>
            <AppText style={styles.priceAmount} weight="extrabold">
              {price}
            </AppText>
            <AppText style={styles.pricePeriod}>
              {billingPeriod === 'yearly' ? '/yr' : '/mo'}
            </AppText>
          </>
        ) : (
          <AppText style={styles.priceAmount} weight="extrabold">Free</AppText>
        )}
      </View>

      {billingPeriod === 'yearly' && savings > 0 && (
        <View style={styles.savingsPill}>
          <AppText style={styles.savingsText} weight="semibold">
            Save ${savings}/year
          </AppText>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresList}>
        {features.map((f, i) => (
          <FeatureRow key={i} text={f} />
        ))}
      </View>

      {/* CTA */}
      {isCurrentPlan ? (
        <View style={styles.currentPlanTag}>
          <Ionicons name="checkmark-circle" size={14} color={D.green} style={{ marginRight: 6 }} />
          <AppText style={styles.currentPlanText} weight="semibold">
            Current Plan
          </AppText>
        </View>
      ) : (
        <AnimatedPress onPress={onSelect} disabled={isLoading} style={[
          styles.ctaBtn,
          isPrimary ? styles.ctaBtnPrimary : styles.ctaBtnSecondary,
          isLoading && { opacity: 0.5 },
        ]}>
          {isLoading ? (
            <Ionicons name="reload" size={18} color={isPrimary ? '#000000' : '#FFFFFF'} />
          ) : (
            <AppText
              style={[styles.ctaBtnText, isPrimary && styles.ctaBtnTextPrimary]}
              weight="bold"
            >
              {getCtaText(plan.id)}
            </AppText>
          )}
        </AnimatedPress>
      )}
    </View>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────
function ComparisonTable() {
  return (
    <View style={styles.compTable}>
      <View style={styles.compHeader}>
        {['Feature', 'Free', 'Pro', 'Business'].map((h, i) => (
          <AppText key={i} style={[styles.compHeaderCell, i === 0 && { textAlign: 'left' }]} weight="semibold">
            {h}
          </AppText>
        ))}
      </View>
      {PLAN_COMPARISON.map((row, i) => (
        <View key={i} style={[styles.compRow, i % 2 === 0 && styles.compRowAlt]}>
          <AppText style={[styles.compCell, styles.compFeatureCell]}>{row.feature}</AppText>
          <AppText style={styles.compCell}>{row.free}</AppText>
          <AppText style={styles.compCell}>{row.pro}</AppText>
          <AppText style={styles.compCell}>{row.business}</AppText>
        </View>
      ))}
    </View>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    setOpen((v) => {
      Animated.timing(anim, {
        toValue: v ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return !v;
    });
  };

  return (
    <Pressable onPress={toggle} style={styles.faqItem}>
      <View style={styles.faqQuestion}>
        <AppText style={styles.faqQuestionText} weight="semibold">{q}</AppText>
        <Animated.View style={{
          transform: [{
            rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
          }],
        }}>
          <Ionicons name="chevron-down" size={16} color={D.mutedMid} />
        </Animated.View>
      </View>
      {open && (
        <AppText style={styles.faqAnswer}>{a}</AppText>
      )}
    </Pressable>
  );
}

// ─── Main Pricing Screen ──────────────────────────────────────────────────────
export default function PricingScreen() {
  const router = useRouter();
  const { currentPlan, upgrade, loading } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') { router.push('/register'); return; }
    if (planId === 'enterprise') { router.push('/contact-sales' as any); return; }
    try {
      setSelectedPlan(planId);
      await upgrade(planId, billingPeriod === 'yearly');
    } catch (e) {
      console.error('Upgrade failed:', e);
    } finally {
      setSelectedPlan(null);
    }
  };

  const plans = Object.values(SUBSCRIPTION_PLANS).filter((p) => p.id !== 'enterprise');

  const faqs = [
    { q: 'Can I change plans anytime?', a: 'Yes, upgrade or downgrade at any time. Changes take effect immediately.' },
    { q: 'What happens to my data if I cancel?', a: 'Your data stays safe for 30 days after cancellation, giving you time to reactivate.' },
    { q: 'Do you offer refunds?', a: 'Yes — 30-day money-back guarantee on all paid plans. No questions asked.' },
    { q: 'Is there a setup fee?', a: 'No setup fees. No hidden costs. Just the subscription price.' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={20} color={D.text} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="flash" size={12} color={D.accent} />
            <AppText style={styles.heroBadgeText} weight="semibold">
              AVIO Plans
            </AppText>
          </View>
          <AppText style={styles.heroTitle} weight="extrabold">
            Choose Your{'\n'}Power Level
          </AppText>
          <AppText style={styles.heroSubtitle}>
            Start free. Upgrade when you're ready.{'\n'}Cancel anytime.
          </AppText>
        </View>

        {/* Billing toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleOption, billingPeriod === 'monthly' && styles.toggleOptionActive]}
              onPress={() => setBillingPeriod('monthly')}
            >
              <AppText
                style={[styles.toggleText, billingPeriod === 'monthly' && styles.toggleTextActive]}
                weight="semibold"
              >
                Monthly
              </AppText>
            </Pressable>
            <Pressable
              style={[styles.toggleOption, billingPeriod === 'yearly' && styles.toggleOptionActive]}
              onPress={() => setBillingPeriod('yearly')}
            >
              <AppText
                style={[styles.toggleText, billingPeriod === 'yearly' && styles.toggleTextActive]}
                weight="semibold"
              >
                Yearly
              </AppText>
            </Pressable>
          </View>
          {billingPeriod === 'yearly' && (
            <View style={styles.saveBadge}>
              <AppText style={styles.saveBadgeText} weight="bold">Save 17%</AppText>
            </View>
          )}
        </View>

        {/* Plan cards */}
        <View style={styles.plansGrid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              isCurrentPlan={currentPlan.id === plan.id}
              isLoading={selectedPlan === plan.id && loading}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </View>

        {/* Enterprise card */}
        <View style={styles.enterpriseCard}>
          <View style={styles.enterpriseLeft}>
            <View style={styles.enterpriseBadge}>
              <Ionicons name="business" size={14} color={D.accent} />
              <AppText style={styles.enterpriseBadgeText} weight="bold">Enterprise</AppText>
            </View>
            <AppText style={styles.enterpriseTitle} weight="bold">
              Custom solutions for large teams
            </AppText>
            <AppText style={styles.enterpriseDesc}>
              White-label · CRM · API · SLA · Dedicated support
            </AppText>
          </View>
          <AnimatedPress
            onPress={() => router.push('/contact-sales' as any)}
            style={styles.enterpriseBtn}
          >
            <AppText style={styles.enterpriseBtnText} weight="bold">
              Contact Sales
            </AppText>
            <Ionicons name="arrow-forward" size={14} color="#000000" style={{ marginLeft: 6 }} />
          </AnimatedPress>
        </View>

        {/* Feature comparison */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel} weight="bold">FEATURE COMPARISON</AppText>
          <AppText style={styles.sectionTitle} weight="bold">Everything, side by side</AppText>
          <ComparisonTable />
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel} weight="bold">FAQ</AppText>
          <AppText style={styles.sectionTitle} weight="bold">Common questions</AppText>
          <View style={styles.faqList}>
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </View>
        </View>

        {/* Final CTA */}
        <View style={styles.finalCta}>
          <AppText style={styles.finalCtaTitle} weight="extrabold">
            Ready to go Pro?
          </AppText>
          <AppText style={styles.finalCtaSubtitle}>
            Join thousands of professionals already using AVIO
          </AppText>
          <AnimatedPress
            onPress={() => handleSelectPlan('pro')}
            style={styles.finalCtaBtn}
          >
            <AppText style={styles.finalCtaBtnText} weight="bold">
              Start Free Trial
            </AppText>
            <Ionicons name="arrow-forward" size={16} color="#000000" style={{ marginLeft: 8 }} />
          </AnimatedPress>
          <AppText style={styles.finalCtaHint}>No credit card required</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getKeyFeatures(plan: any): string[] {
  if (plan.id === 'free') return ['1 digital card', 'Basic analytics', 'QR code generator'];
  if (plan.id === 'pro') return [
    'Unlimited cards', 'Lifetime analytics', 'Custom branding',
    'Export contacts', 'Custom domain', 'Priority support',
  ];
  if (plan.id === 'business') return [
    'Everything in Pro', 'Team management (20 users)',
    'Bulk ordering', 'CRM integration', 'API access', 'Dedicated support',
  ];
  return [];
}

function getCtaText(planId: string): string {
  switch (planId) {
    case 'free': return 'Start Free';
    case 'pro': return 'Start Pro Trial';
    case 'business': return 'Start Business Trial';
    default: return 'Get Started';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.bg },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: D.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 32 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.4)',
    backgroundColor: 'rgba(217,119,6,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: D.radiusPill,
    marginBottom: 16,
  },
  heroBadgeText: { color: D.accent, fontSize: 11, letterSpacing: 0.5 },
  heroTitle: {
    fontSize: isWeb ? 44 : 34,
    color: D.text,
    textAlign: 'center',
    lineHeight: isWeb ? 52 : 42,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: D.muted,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Billing toggle
  toggleRow: { alignItems: 'center', marginBottom: 28, gap: 10 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: D.radiusPill,
    padding: 3,
  },
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: D.radiusPill,
  },
  toggleOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: { fontSize: 14, color: D.muted },
  toggleTextActive: { color: '#000000' },
  saveBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: D.radiusPill,
  },
  saveBadgeText: { color: D.green, fontSize: 12 },

  // Plan cards grid
  plansGrid: { gap: 16, marginBottom: 20 },
  planCard: {
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: D.radius,
    padding: 24,
  },
  planCardPopular: {
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: '#18181c',
  },
  popularBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: D.radiusPill,
    marginBottom: 16,
    alignItems: 'center',
  },
  popularText: { color: '#000000', fontSize: 11, letterSpacing: 0.3 },

  planHeader: { marginBottom: 16 },
  planName: { color: D.text, fontSize: 22, marginBottom: 4 },
  planDesc: { color: D.muted, fontSize: 14, lineHeight: 20 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  priceCurrency: { color: D.text, fontSize: 22, marginRight: 2 },
  priceAmount: { color: D.text, fontSize: 48, lineHeight: 56 },
  pricePeriod: { color: D.muted, fontSize: 16, marginLeft: 4 },

  savingsPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: D.radiusPill,
    marginBottom: 20,
  },
  savingsText: { color: D.green, fontSize: 12 },

  featuresList: { gap: 10, marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, flex: 1, lineHeight: 20 },

  ctaBtn: {
    height: 52,
    borderRadius: D.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaBtnPrimary: { backgroundColor: '#FFFFFF' },
  ctaBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaBtnText: { color: D.text, fontSize: 15 },
  ctaBtnTextPrimary: { color: '#000000' },

  currentPlanTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: D.radiusPill,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  currentPlanText: { color: D.green, fontSize: 14 },

  // Enterprise
  enterpriseCard: {
    backgroundColor: '#0c0c10',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.2)',
    borderRadius: D.radius,
    padding: 20,
    marginBottom: 40,
    gap: 16,
  },
  enterpriseLeft: { gap: 8 },
  enterpriseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  enterpriseBadgeText: { color: D.accent, fontSize: 11, letterSpacing: 0.5 },
  enterpriseTitle: { color: D.text, fontSize: 18, lineHeight: 24 },
  enterpriseDesc: { color: D.muted, fontSize: 13, lineHeight: 18 },
  enterpriseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: D.radiusPill,
  },
  enterpriseBtnText: { color: '#000000', fontSize: 14 },

  // Section labels
  section: { marginBottom: 40 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionTitle: { color: D.text, fontSize: 22, marginBottom: 20 },

  // Comparison table
  compTable: {
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: D.radius,
    overflow: 'hidden',
  },
  compHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  compHeaderCell: {
    flex: 1,
    color: D.mutedMid,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  compRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  compRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  compCell: {
    flex: 1,
    color: D.mutedMid,
    fontSize: 13,
    textAlign: 'center',
  },
  compFeatureCell: { color: D.text, textAlign: 'left' },

  // FAQ
  faqList: {
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: D.radius,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestionText: { color: D.text, fontSize: 14, flex: 1, lineHeight: 20 },
  faqAnswer: {
    color: D.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  // Final CTA
  finalCta: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0d',
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: 24,
    marginBottom: 20,
  },
  finalCtaTitle: { color: D.text, fontSize: 28, textAlign: 'center', marginBottom: 8 },
  finalCtaSubtitle: {
    color: D.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  finalCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    height: 56,
    borderRadius: D.radiusPill,
    marginBottom: 12,
  },
  finalCtaBtnText: { color: '#000000', fontSize: 16 },
  finalCtaHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
});
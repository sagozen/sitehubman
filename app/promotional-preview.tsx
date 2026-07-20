import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { usePreferences } from '@/src/hooks/usePreferences';
import {
  EditorialHeroBanner,
  PremiumFeatureCard,
  NewsletterEditorialCard,
  FeatureAnnouncementCard,
  BenefitPromotionCard,
  MARKETING_IMAGES,
} from '@/src/components/MarketingComponents';

type Category = 'banners' | 'features' | 'newsletters' | 'all';

export default function PromotionalPreviewScreen() {
  const { colors, updatePreferences, resolvedColorMode } = usePreferences();
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const toggleColorMode = async () => {
    const nextMode = resolvedColorMode === 'dark' ? 'light' : 'dark';
    await updatePreferences({ colorMode: nextMode });
  };

  const handleCtaPress = (title: string, action: string) => {
    Alert.alert('Action Triggered', `You clicked "${action}" on the "${title}" card.`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <AppIcon name="ChevronLeft" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="h2" weight="bold">
            Editorial Showcase
          </AppText>
          <AppText variant="caption" tone="muted">
            Premium Marketing & Promotional Components
          </AppText>
        </View>

        {/* Theme Switcher */}
        <Pressable onPress={toggleColorMode} style={[styles.themeToggle, { borderColor: colors.border }]} hitSlop={12}>
          <AppIcon name={resolvedColorMode === 'dark' ? 'Sun' : 'Moon'} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Category Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        {(['all', 'banners', 'features', 'newsletters'] as Category[]).map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.tab,
                isActive && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
            >
              <AppText
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                style={{ color: isActive ? colors.textPrimary : colors.textMuted }}
              >
                {cat.toUpperCase()}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Gallery */}
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HERO BANNERS & ANNOUNCEMENTS SECTION */}
        {(activeCategory === 'all' || activeCategory === 'banners') && (
          <View style={styles.section}>
            <AppText variant="caption" weight="bold" tone="muted" style={styles.sectionHeader}>
              EDITORIAL HERO BANNERS
            </AppText>

            <EditorialHeroBanner
              eyebrow="NEW • DESIGN STUDIO"
              title="Craft your ultimate digital identity"
              description="A premium suite of tools to style, color, and customize your virtual contactless profile card. Designed for creators who demand high-fidelity typography and minimal layout structures."
              image={MARKETING_IMAGES.designCard}
              primaryCta={{
                label: 'Get Started',
                onPress: () => handleCtaPress('Design Studio Banner', 'Get Started'),
              }}
              secondaryCta={{
                label: 'Explore Styles',
                onPress: () => handleCtaPress('Design Studio Banner', 'Explore Styles'),
              }}
            />

            <EditorialHeroBanner
              eyebrow="FEATURED • ANALYTICS"
              title="Real-time visitor telemetry"
              description="Uncover powerful data insights. Track connections, device demographics, and tap performance in a fully integrated dashboard inspired by minimal Stripe interfaces."
              image={MARKETING_IMAGES.analytics}
              primaryCta={{
                label: 'View Telemetry',
                onPress: () => handleCtaPress('Telemetry Banner', 'View Telemetry'),
              }}
            />

            <AppText variant="caption" weight="bold" tone="muted" style={styles.sectionHeader}>
              FEATURE ANNOUNCEMENT CARDS
            </AppText>

            <FeatureAnnouncementCard
              badge="v1.4"
              title="Automated printer job tracking"
              description="Instantly track the production phase of your contactless physical card. From programming through QA verification to shipping dispatch."
              ctaLabel="Learn More"
              onPress={() => handleCtaPress('Printer Job Announcement', 'Learn More')}
            />

            <FeatureAnnouncementCard
              badge="PREMIUM"
              title="Refined metal NFC materials"
              description="Introducing brushed steel and premium gold core smart cards. Handcrafted matte textures with laser-etched custom QR grids."
              ctaLabel="Upgrade Card"
              onPress={() => handleCtaPress('Refined Metal NFC Announcement', 'Upgrade Card')}
            />
          </View>
        )}

        {/* FEATURE CARDS SECTION */}
        {(activeCategory === 'all' || activeCategory === 'features') && (
          <View style={styles.section}>
            <AppText variant="caption" weight="bold" tone="muted" style={styles.sectionHeader}>
              MINIMAL FEATURE HIGHLIGHTS
            </AppText>

            <PremiumFeatureCard
              title="Instant contactless transfer"
              description="Simply tap your physical card against any modern smartphone. Zero apps, Zero accounts required for the recipient."
              image={MARKETING_IMAGES.welcome}
              ctaLabel="See how it works"
              onPress={() => handleCtaPress('Contactless Transfer Feature', 'See how it works')}
            />

            <PremiumFeatureCard
              title="Refined QR grid geometry"
              description="High-contrast SVG QR designs tuned for ultra-fast camera acquisition in low-light environments."
              image={MARKETING_IMAGES.verification}
              ctaLabel="Generate Code"
              onPress={() => handleCtaPress('QR Grid Feature', 'Generate Code')}
            />
          </View>
        )}

        {/* NEWSLETTERS & PROMOTIONS SECTION */}
        {(activeCategory === 'all' || activeCategory === 'newsletters') && (
          <View style={styles.section}>
            <AppText variant="caption" weight="bold" tone="muted" style={styles.sectionHeader}>
              EDITORIAL NEWSLETTERS
            </AppText>

            <NewsletterEditorialCard
              category="Business Strategy"
              readTime="4 min read"
              title="The rise of physical-to-digital networking"
              summary="How high-growth startups are deploying contactless NFC hardware to accelerate team-wide lead generation and customer onboarding at physical trade events."
              image={MARKETING_IMAGES.businessUseCase}
              ctaLabel="Read Article"
              onPress={() => handleCtaPress('Contactless Networking Article', 'Read Article')}
            />

            <NewsletterEditorialCard
              category="Hardware Engineering"
              readTime="6 min read"
              title="Designing reliable smart card electronics"
              summary="An inside look at our engineering process, exploring antenna tuning, material interference, and structural durability for modern everyday carry."
              image={MARKETING_IMAGES.productionTracking}
              ctaLabel="Read Case Study"
              onPress={() => handleCtaPress('Engineering Case Study', 'Read Case Study')}
            />

            <AppText variant="caption" weight="bold" tone="muted" style={styles.sectionHeader}>
              BENEFIT PROMOTION CARDS
            </AppText>

            <BenefitPromotionCard
              title="Enterprise Custom Branding"
              supportingText="Deploy custom domain hosting, tailored brand presets, and central administrative controls."
              image={MARKETING_IMAGES.premiumMembership}
              ctaLabel="Contact Sales"
              onPress={() => handleCtaPress('Enterprise Custom Branding Promotion', 'Contact Sales')}
            />

            <BenefitPromotionCard
              title="Global Shipping Coverage"
              supportingText="Next-day production dispatch with tracked courier delivery to over 120 countries."
              image={MARKETING_IMAGES.shippingSuccess}
              ctaLabel="Order Card"
              onPress={() => handleCtaPress('Global Shipping Promotion', 'Order Card')}
            />
          </View>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    // borderBottomColor set dynamically
  },
  scroll: {
    padding: 20,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 8,
  },
});

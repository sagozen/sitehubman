import { Image, Pressable, StyleSheet, View, ImageSourcePropType, ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

// Helper to resolve marketing images using require statements
export const MARKETING_IMAGES = {
  heroHome: require('@/assets/images/marketing/hero-home.png'),
  welcome: require('@/assets/images/marketing/welcome.png'),
  analytics: require('@/assets/images/marketing/analytics-dashboard.png'),
  designCard: require('@/assets/images/marketing/design-card.png'),
  businessUseCase: require('@/assets/images/marketing/business-use-case.png'),
  productionTracking: require('@/assets/images/marketing/production-tracking.png'),
  premiumMembership: require('@/assets/images/marketing/premium-membership.png'),
  shippingSuccess: require('@/assets/images/marketing/shipping-success.png'),
  verification: require('@/assets/images/marketing/verification.png'),
};

interface HeroBannerProps {
  eyebrow?: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  primaryCta?: { label: string; onPress: () => void };
  secondaryCta?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function EditorialHeroBanner({
  eyebrow = 'FEATURED',
  title,
  description,
  image,
  primaryCta,
  secondaryCta,
  style,
}: HeroBannerProps) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {/* Visual Header */}
      <View style={styles.heroImageContainer}>
        <Image source={image} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroGradientOverlay} />
      </View>

      {/* Content Area */}
      <View style={styles.heroContent}>
        <View style={styles.eyebrowContainer}>
          <AppText variant="caption" weight="bold" style={[styles.eyebrow, { color: colors.primary }]}>
            {eyebrow.toUpperCase()}
          </AppText>
        </View>

        <AppText variant="display" weight="bold" style={styles.heroTitle}>
          {title}
        </AppText>

        <AppText variant="body" tone="muted" style={styles.heroDescription}>
          {description}
        </AppText>

        {/* Action Buttons */}
        <View style={styles.ctaRow}>
          {primaryCta && (
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={primaryCta.onPress}
            >
              <AppText variant="body" weight="semibold" tone="inverse">
                {primaryCta.label}
              </AppText>
            </Pressable>
          )}
          {secondaryCta && (
            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={secondaryCta.onPress}
            >
              <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
                {secondaryCta.label}
              </AppText>
              <AppIcon name="ChevronRight" size={16} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  ctaLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PremiumFeatureCard({
  title,
  description,
  image,
  ctaLabel = 'Explore',
  onPress,
  style,
}: FeatureCardProps) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Image source={image} style={styles.featureImage} resizeMode="cover" />
      <View style={styles.featureContent}>
        <AppText variant="h2" weight="bold" style={styles.featureTitle}>
          {title}
        </AppText>
        <AppText variant="body" tone="muted" style={styles.featureDescription}>
          {description}
        </AppText>
        {onPress && (
          <Pressable style={styles.textLink} onPress={onPress}>
            <AppText variant="body" weight="semibold" style={{ color: colors.primary }}>
              {ctaLabel}
            </AppText>
            <AppIcon name="ChevronRight" size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface NewsletterCardProps {
  category: string;
  readTime: string;
  title: string;
  summary: string;
  image: ImageSourcePropType;
  ctaLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function NewsletterEditorialCard({
  category,
  readTime,
  title,
  summary,
  image,
  ctaLabel = 'Read Article',
  onPress,
  style,
}: NewsletterCardProps) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.newsletterCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {/* Category & Time */}
      <View style={styles.metaRow}>
        <View style={[styles.tag, { backgroundColor: colors.surfaceSoft }]}>
          <AppText variant="caption" weight="bold" style={{ color: colors.textPrimary }}>
            {category.toUpperCase()}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          {readTime}
        </AppText>
      </View>

      <AppText variant="h1" weight="bold" style={styles.newsletterTitle}>
        {title}
      </AppText>

      <Image source={image} style={styles.newsletterImage} resizeMode="cover" />

      <AppText variant="body" tone="muted" style={styles.newsletterSummary}>
        {summary}
      </AppText>

      {onPress && (
        <Pressable style={[styles.newsletterCta, { borderTopColor: colors.border }]} onPress={onPress}>
          <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
            {ctaLabel}
          </AppText>
          <AppIcon name="ChevronRight" size={18} color={colors.textPrimary} />
        </Pressable>
      )}
    </View>
  );
}

interface AnnouncementCardProps {
  badge: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FeatureAnnouncementCard({
  badge,
  title,
  description,
  ctaLabel = 'Learn More',
  onPress,
  style,
}: AnnouncementCardProps) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.announcementCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <View style={styles.announcementHeader}>
        <View style={[styles.announcementBadge, { backgroundColor: colors.primarySoft }]}>
          <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
            {badge.toUpperCase()}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          {"WHAT'S NEW"}
        </AppText>
      </View>

      <AppText variant="h2" weight="bold" style={styles.announcementTitle}>
        {title}
      </AppText>

      <AppText variant="body" tone="muted" style={styles.announcementDescription}>
        {description}
      </AppText>

      {onPress && (
        <Pressable style={styles.announcementLink} onPress={onPress}>
          <AppText variant="body" weight="semibold" style={{ color: colors.primary }}>
            {ctaLabel}
          </AppText>
          <AppIcon name="ChevronRight" size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

interface PromotionCardProps {
  title: string;
  supportingText: string;
  image: ImageSourcePropType;
  ctaLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function BenefitPromotionCard({
  title,
  supportingText,
  image,
  ctaLabel = 'Get Premium',
  onPress,
  style,
}: PromotionCardProps) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.promotionCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <View style={styles.promotionImageWrapper}>
        <Image source={image} style={styles.promotionImage} resizeMode="cover" />
      </View>
      <View style={styles.promotionContent}>
        <AppText variant="h2" weight="bold" style={styles.promotionTitle}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.promotionSupport}>
          {supportingText}
        </AppText>
        {onPress && (
          <Pressable
            style={[styles.promotionButton, { backgroundColor: colors.textPrimary }]}
            onPress={onPress}
          >
            <AppText variant="body" weight="semibold" style={{ color: colors.background }}>
              {ctaLabel}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero Banner styles
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  heroImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
  },
  heroContent: {
    padding: 24,
  },
  eyebrowContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  eyebrow: {
    letterSpacing: 1.2,
    fontSize: 11,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Feature Card styles
  featureCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  featureImage: {
    height: 160,
    width: '100%',
  },
  featureContent: {
    padding: 20,
  },
  featureTitle: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },

  // Newsletter styles
  newsletterCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newsletterTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
  },
  newsletterImage: {
    height: 150,
    width: '100%',
    borderRadius: 16,
    marginBottom: 16,
  },
  newsletterSummary: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  newsletterCta: {
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Announcement styles
  announcementCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  announcementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  announcementTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  announcementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  announcementLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },

  // Promotion styles
  promotionCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  promotionImageWrapper: {
    width: '40%',
    height: '100%',
  },
  promotionImage: {
    width: '100%',
    height: '100%',
  },
  promotionContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  promotionTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  promotionSupport: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  promotionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

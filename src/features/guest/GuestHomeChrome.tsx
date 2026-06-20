import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { BrandLogoCircle } from '@/src/components/BrandLogoCircle';
import { FlowIcon } from '@/src/components/FlowIcon';
import { SquircleIconShell, SquircleIconTile } from '@/src/components/SquircleIconTile';
import { BRAND_NAME, BRAND_TAGLINE } from '@/src/constants/brandAssets';
import type { MarketingSceneId } from '@/src/constants/marketingScenes';
import { GuestPhotoBanner } from '@/src/features/guest/GuestPhotoBanner';
import { appRoutes } from '@/src/constants/navigation';
import {
  SNAP_TAP_BORDER,
  SNAP_TAP_BRAND,
  SNAP_TAP_CARD_BORDER,
  SNAP_TAP_GRAY,
  SNAP_TAP_TEXT,
} from '@/src/constants/snapTapBrand';
import { iosDesign } from '@/src/design-system/ios';

type ChromeColors = {
  textPrimary: string;
  textMuted: string;
  border: string;
  surface: string;
};

type GuestAppHeaderProps = {
  colors: ChromeColors;
  displayName?: string;
  onNotifications?: () => void;
  onProfile?: () => void;
  hideActions?: boolean;
  isGuest?: boolean;
};

export function GuestAppHeader({
  colors,
  displayName,
  onNotifications,
  onProfile,
  hideActions = false,
  isGuest = false,
}: GuestAppHeaderProps) {
  const initial = (displayName?.trim() || 'G')[0].toUpperCase();

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerBrand}>
        <SquircleIconShell sizeKey="lg" style={styles.headerLogoShell}>
          <BrandLogoCircle size={46} fill brandRing />
        </SquircleIconShell>
        <View style={styles.headerCopy}>
          <View style={styles.headerTitleRow}>
            <AppText style={[styles.headerBrandName, { color: colors.textPrimary }]}>{BRAND_NAME}</AppText>
            <AppIcon name="BadgeCheck" size={16} color={SNAP_TAP_BRAND} />
          </View>
          <AppText style={[styles.headerTagline, { color: colors.textMuted }]}>
            {isGuest ? 'Guest eCard preview' : BRAND_TAGLINE}
          </AppText>
        </View>
      </View>

      {hideActions ? null : (
        <View style={styles.headerActions}>
          <Pressable
            onPress={onNotifications}
            style={({ pressed }) => [pressed && styles.headerActionPressed]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <View>
              <SquircleIconTile name="Bell" sizeKey="md" />
              <View style={styles.notifDot} />
            </View>
          </Pressable>
          <Pressable
            onPress={onProfile}
            style={styles.avatarPress}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <View style={[styles.avatarRing, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={[styles.avatarInner, { backgroundColor: colors.surface }]}>
                {isGuest ? (
                  <BrandLogoCircle size={44} />
                ) : (
                  <AppText style={[styles.avatarInitial, { color: colors.textPrimary }]}>{initial}</AppText>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type GuestIdentityHeroProps = {
  colors: ChromeColors;
  onPress?: () => void;
};

export function GuestIdentityHero({ onPress }: GuestIdentityHeroProps) {
  const body = (
    <GuestPhotoBanner
      marketingSceneId="hero-home"
      cacheKey="marketing-hero-home"
      variant="hero"
      overlay="product"
    >
      <View style={styles.heroPhotoTop}>
        <SquircleIconShell sizeKey="sm" style={styles.heroLogoShellOnPhoto}>
          <BrandLogoCircle size={30} fill brandRing />
        </SquircleIconShell>
        <View style={styles.heroPillOnPhoto}>
          <SquircleIconTile name="Nfc" size={22} />
          <AppText style={styles.heroPillTextOnPhoto}>Premium NFC card</AppText>
        </View>
      </View>
      <AppText style={styles.heroTitleOnPhoto}>Tap-ready NFC business cards</AppText>
      <AppText style={styles.heroSubOnPhoto}>
        Design your digital profile · order a physical NFC card ·{' '}
        <AppText style={styles.heroHighlightOnPhoto}>QR backup included</AppText>
      </AppText>
    </GuestPhotoBanner>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.heroPressed}>
        {body}
      </Pressable>
    );
  }

  return body;
}

type GuestMarketingBannerProps = {
  sceneId: MarketingSceneId;
  title: string;
  subtitle: string;
  cacheKey: string;
  variant?: 'hero' | 'compact' | 'strip';
};

export function GuestMarketingBanner({
  sceneId,
  title,
  subtitle,
  cacheKey,
  variant = 'compact',
}: GuestMarketingBannerProps) {
  return (
    <GuestPhotoBanner
      marketingSceneId={sceneId}
      cacheKey={cacheKey}
      variant={variant}
      overlay="product"
    >
      <AppText style={styles.heroTitleOnPhoto}>{title}</AppText>
      <AppText style={styles.heroSubOnPhoto}>{subtitle}</AppText>
    </GuestPhotoBanner>
  );
}

export function GuestFeatureStrip({ colors }: { colors: ChromeColors }) {
  const features = [
    { icon: 'Nfc' as const, title: 'Tap-ready', subtitle: 'NFC card profile' },
    { icon: 'QrCode' as const, title: 'QR backup', subtitle: 'Works anywhere' },
    { icon: 'ShieldCheck' as const, title: 'Saved', subtitle: '3-day free eCard' },
  ];

  const iconMap = {
    Nfc: { realIcon: 'nfc' as const, tint: '#30B0C7' },
    QrCode: { realIcon: 'link' as const, tint: '#5856D6' },
    ShieldCheck: { realIcon: 'profile' as const, tint: '#34C759' },
  };

  return (
    <View style={styles.featureStrip}>
      {features.map((feature) => {
        const meta = iconMap[feature.icon];
        return (
          <View key={feature.title} style={styles.featureItem}>
            <FlowIcon
              realIcon={meta.realIcon}
              fallbackIcon={feature.icon}
              tint={meta.tint}
              size={40}
              glow
            />
            <AppText style={[styles.featureTitle, { color: colors.textPrimary }]}>{feature.title}</AppText>
            <AppText style={[styles.featureSub, { color: colors.textMuted }]} numberOfLines={1}>
              {feature.subtitle}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

type GuideStep = {
  step: number;
  icon: AppIconName;
  title: string;
  description: string;
  onPress: () => void;
};

type GuestQuickStartGuideProps = {
  colors: ChromeColors;
  isGuest: boolean;
  hasBio: boolean;
  onPreview: () => void;
  onCheckout: () => void;
};

export function GuestQuickStartGuide({
  colors,
  isGuest,
  hasBio,
  onPreview,
  onCheckout,
}: GuestQuickStartGuideProps) {
  const steps: GuideStep[] = [
    {
      step: 1,
      icon: 'PenLine',
      title: 'Design your eCard',
      description: 'Pick colors, add links & photo — your draft saves on this device.',
      onPress: () => router.push(appRoutes.guestDesign),
    },
    {
      step: 2,
      icon: 'Eye',
      title: 'Preview your profile',
      description: hasBio
        ? 'Open your live public page — same link NFC & QR will use.'
        : 'See how your page looks before you order a physical card.',
      onPress: onPreview,
    },
    {
      step: 3,
      icon: 'CreditCard',
      title: 'Order physical NFC card',
      description: 'Checkout when ready — we print & encode your tap-to-open profile.',
      onPress: onCheckout,
    },
    {
      step: 4,
      icon: 'Package',
      title: 'Track production',
      description: 'Follow print, encode, and ship status after you place an order.',
      onPress: () => router.push(appRoutes.guestTrackOrder),
    },
  ];

  const tips = [
    {
      icon: 'Nfc' as const,
      text: 'Tap the NFC card on any phone — your profile opens instantly, no app needed.',
    },
    {
      icon: 'QrCode' as const,
      text: 'QR on the card works everywhere NFC is unavailable.',
    },
    {
      icon: 'Clock' as const,
      text: isGuest
        ? 'Guest preview is free for 7 days — sign in anytime to keep your eCard forever.'
        : 'Your account saves drafts, orders, and live profile in the cloud.',
    },
  ];

  return (
    <View style={styles.guideSection}>
      <View style={styles.guideHead}>
        <AppText style={[styles.guideTitle, { color: colors.textPrimary }]}>How Snap Tap works</AppText>
        <AppText style={[styles.guideSubtitle, { color: colors.textMuted }]}>
          Four steps from design to tap-ready NFC card
        </AppText>
      </View>

      <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {steps.map((item, index) => (
          <Pressable
            key={item.step}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.guideStep,
              index < steps.length - 1 && [styles.guideStepBorder, { borderBottomColor: colors.border }],
              pressed && styles.guideStepPressed,
            ]}
            accessibilityRole="button"
          >
            <View style={styles.guideStepBadge}>
              <AppText style={styles.guideStepNumber}>{item.step}</AppText>
            </View>
            <SquircleIconTile name={item.icon} sizeKey="sm" />
            <View style={styles.guideStepCopy}>
              <AppText style={[styles.guideStepTitle, { color: colors.textPrimary }]}>{item.title}</AppText>
              <AppText style={[styles.guideStepDesc, { color: colors.textMuted }]}>{item.description}</AppText>
            </View>
            <AppIcon name="ChevronRight" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.guideTipsHead}>
        <AppIcon name="Info" size={16} color={SNAP_TAP_GRAY} />
        <AppText style={[styles.guideTipsTitle, { color: colors.textPrimary }]}>Good to know</AppText>
      </View>

      <View style={[styles.guideTipsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {tips.map((tip, index) => (
          <View
            key={tip.text}
            style={[
              styles.guideTipRow,
              index < tips.length - 1 && [styles.guideTipBorder, { borderBottomColor: colors.border }],
            ]}
          >
            <SquircleIconTile name={tip.icon} sizeKey="xs" />
            <AppText style={[styles.guideTipText, { color: colors.textMuted }]}>{tip.text}</AppText>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => router.push(appRoutes.nfcDemo)}
        style={({ pressed }) => [
          styles.guideDemoLink,
          { borderColor: colors.border, backgroundColor: colors.surface },
          pressed && styles.guideStepPressed,
        ]}
        accessibilityRole="button"
      >
        <SquircleIconTile name="Nfc" sizeKey="sm" />
        <View style={styles.guideDemoCopy}>
          <AppText style={[styles.guideDemoTitle, { color: colors.textPrimary }]}>Try NFC demo</AppText>
          <AppText style={[styles.guideDemoSub, { color: colors.textMuted }]}>
            See how a tap opens a profile on this device
          </AppText>
        </View>
        <AppIcon name="ChevronRight" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: iosDesign.spacing.sm,
  },
  headerBrand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    minWidth: 0,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBrandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerTagline: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.xs,
  },
  headerActionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarPress: {
    borderRadius: 24,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: iosDesign.radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_CARD_BORDER,
    ...iosDesign.shadows.card,
  },
  heroPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: iosDesign.spacing.md,
    paddingLeft: iosDesign.spacing.md,
    paddingRight: iosDesign.spacing.xs,
    gap: iosDesign.spacing.xs,
  },
  heroLeft: {
    flex: 1,
    gap: iosDesign.spacing.xs,
    paddingRight: iosDesign.spacing.xs,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: SNAP_TAP_GRAY,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  heroHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: SNAP_TAP_BRAND,
  },
  heroArt: {
    width: 128,
    height: 118,
  },
  heroPhotoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: iosDesign.spacing.sm,
  },
  heroLogoShellOnPhoto: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroPillOnPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroPillTextOnPhoto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroTitleOnPhoto: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 25,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubOnPhoto: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: 'rgba(255,255,255,0.88)',
  },
  heroHighlightOnPhoto: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7DD3FC',
  },
  featureStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  featureItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  headerLogoShell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_CARD_BORDER,
  },
  heroLogoShell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_CARD_BORDER,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  featureSub: {
    maxWidth: '100%',
    fontSize: 10,
    fontWeight: '600',
  },
  guideSection: {
    gap: iosDesign.spacing.sm,
  },
  guideHead: {
    gap: 4,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  guideSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  guideCard: {
    borderRadius: iosDesign.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...iosDesign.shadows.card,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    paddingHorizontal: iosDesign.spacing.md,
    paddingVertical: iosDesign.spacing.sm + 2,
    minHeight: iosDesign.hitTarget + 16,
  },
  guideStepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  guideStepPressed: {
    opacity: 0.72,
  },
  guideStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SNAP_TAP_BORDER,
  },
  guideStepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: SNAP_TAP_TEXT,
  },
  guideStepCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  guideStepTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  guideStepDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  guideTipsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: iosDesign.spacing.xs,
  },
  guideTipsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  guideTipsCard: {
    borderRadius: iosDesign.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  guideTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: iosDesign.spacing.sm,
    paddingHorizontal: iosDesign.spacing.md,
    paddingVertical: iosDesign.spacing.sm + 2,
  },
  guideTipBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  guideTipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  guideDemoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    paddingHorizontal: iosDesign.spacing.md,
    paddingVertical: iosDesign.spacing.sm + 4,
    borderRadius: iosDesign.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...iosDesign.shadows.card,
  },
  guideDemoCopy: {
    flex: 1,
    gap: 2,
  },
  guideDemoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  guideDemoSub: {
    fontSize: 12,
    fontWeight: '500',
  },
});

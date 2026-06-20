import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { CardTypeEdgeBadge } from '@/src/components/CardTypeEdgeBadge';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  GUEST_CAROUSEL_CUSTOM_INDEX,
  guestDesignToCarouselIndex,
  guestGradientsForSegment,
} from '@/src/constants/guestCardDesign';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import {
  CUSTOM_SLOT_PLACEHOLDER_GRADIENT,
  GuestChooseCardPreview,
} from '@/src/features/guest/GuestChooseCardPreview';
import { iosDesign, iosTypography } from '@/src/design-system/ios';
import { resolveGuestCustomImageUri } from '@/src/features/guest/guestCardImagePicker';
import {
  loadCustomerCloudCard,
  type GuestCloudCard,
} from '@/src/services/guestCardDraftService';
import { loadGuestCardDraft, type GuestCardDraft } from '@/src/services/guestDraftService';

type Props = {
  userId?: string;
  fallbackDisplayName?: string;
  title?: string;
};

function draftFromCloud(card: GuestCloudCard): GuestCardDraft {
  const profile = card.profile;
  return {
    displayName: profile.fullName,
    jobTitle: profile.role,
    company: profile.company,
    email: profile.email,
    phone: profile.phone,
    product: card.design.product ?? 'wood_card',
    cardDesign: card.design.cardDesign ?? 'classic_black',
    cardChoice: card.design.cardChoice === 'physical' ? 'physical' : 'ecard',
    gradientIndex: card.design.gradientIndex,
    customImageUri: card.design.customImageUri ?? null,
    savedAt: new Date().toISOString(),
  };
}

function draftHasContent(draft: GuestCardDraft | null): boolean {
  if (!draft) return false;
  return Boolean(
    draft.displayName.trim()
    || draft.company.trim()
    || draft.email.trim()
    || draft.phone.trim()
    || draft.customImageUri,
  );
}

function cloudCardHasContent(card: GuestCloudCard): boolean {
  const profile = card.profile;
  return Boolean(
    profile.fullName.trim()
    || profile.company.trim()
    || profile.email.trim()
    || profile.phone.trim()
    || card.design.customImageUri,
  );
}

export function UnifiedOrderCardSlot({
  userId,
  fallbackDisplayName,
  title = 'My card',
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [draft, setDraft] = useState<GuestCardDraft | null>(null);
  const [loading, setLoading] = useState(true);

  const cardWidth = Math.min(screenWidth - iosDesign.spacing.lg * 2 - 36, 272);
  const cardHeight = cardWidth * 0.63;

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const local = await loadGuestCardDraft();
      let resolved: GuestCardDraft | null = draftHasContent(local) ? local : null;

      if (userId) {
        try {
          const cloud = await loadCustomerCloudCard(userId);
          if (cloud && cloudCardHasContent(cloud)) {
            resolved = draftFromCloud(cloud);
          } else if (!draftHasContent(local)) {
            resolved = null;
          }
        } catch {
          if (!draftHasContent(local)) resolved = null;
        }
      }

      setDraft(resolved);
    } catch {
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void hydrate();
    }, [hydrate]),
  );

  function openDesign() {
    router.push(appRoutes.guestDesign);
  }

  if (loading) {
    return (
      <View style={styles.wrap}>
        <AppText style={styles.title}>{title}</AppText>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const saved = draftHasContent(draft);

  const CARD_GAP = 14;

  function renderSkeletonCard(variant: 'primary' | 'secondary') {
    return (
      <Pressable
        onPress={openDesign}
        style={({ pressed }) => [
          styles.slide,
          { width: cardWidth },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={variant === 'secondary' ? 'Design another card' : 'Create your card'}
      >
        <View style={[styles.skeleton, { width: cardWidth, height: cardHeight }]}>
          <View style={styles.skeletonGhost} pointerEvents="none">
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonLineWide} />
            <View style={styles.skeletonLine} />
          </View>
          <View style={styles.plusCenter}>
            <View style={styles.plusFab}>
              <AppIcon name="Plus" size={30} color="#2596BE" />
            </View>
            <AppText style={styles.plusLabel}>
              {variant === 'secondary' ? 'New card' : 'Tap to design'}
            </AppText>
          </View>
        </View>
      </Pressable>
    );
  }

  let cardsRender: ReactNode[];

  if (saved && draft) {
    const segment = draft.cardChoice === 'physical' ? 'physical' : 'virtual';
    const gradients = guestGradientsForSegment(segment);
    const carouselIndex =
      typeof draft.gradientIndex === 'number'
        ? draft.gradientIndex
        : guestDesignToCarouselIndex(draft.cardDesign);
    const isCustom = carouselIndex >= GUEST_CAROUSEL_CUSTOM_INDEX || draft.cardDesign === 'custom';
    const customUri = resolveGuestCustomImageUri(draft.customImageUri ?? '');
    const gradient = isCustom
      ? CUSTOM_SLOT_PLACEHOLDER_GRADIENT
      : gradients[carouselIndex] ?? gradients[0];
    const displayName = draft.displayName.trim() || fallbackDisplayName?.trim() || 'Your Name';

    const savedCardView = (
      <Pressable
        onPress={openDesign}
        style={({ pressed }) => [
          styles.slide,
          { width: cardWidth },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Edit your saved card"
      >
        <View style={[styles.cardFrame, { width: cardWidth }]}>
          <CardTypeEdgeBadge kind={segment} />
          <GuestChooseCardPreview
            gradient={gradient}
            fullName={displayName}
            title={draft.jobTitle}
            company={draft.company}
            email={draft.email}
            phone={draft.phone}
            gradientIndex={carouselIndex}
            cardType={segment}
            width={cardWidth}
            height={cardHeight}
            customImageUri={isCustom ? customUri : null}
            isCustomSlot={isCustom && !customUri}
          />
        </View>
      </Pressable>
    );

    cardsRender = [savedCardView, renderSkeletonCard('secondary')];
  } else {
    cardsRender = [renderSkeletonCard('primary')];
  }

  const canScroll = cardsRender.length > 1;

  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.subtitle}>
        {saved
          ? 'Swipe right for + new card · tap to edit'
          : 'Tap + to design your card — virtual or physical'}
      </AppText>

      {canScroll ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.scrollContent}
        >
          {cardsRender.map((slide, index) => (
            <View
              key={index === 0 ? 'saved-card' : 'skeleton'}
              style={[styles.slideWrap, index < cardsRender.length - 1 && { marginRight: CARD_GAP }]}
            >
              {slide}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.singleCard}>{cardsRender[0]}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: iosDesign.spacing.sm,
  },
  scrollContent: {
    paddingVertical: 4,
    paddingRight: 28,
  },
  singleCard: {
    alignItems: 'center',
  },
  slideWrap: {
    flexShrink: 0,
  },
  slide: {
    flexShrink: 0,
  },
  title: {
    ...iosTypography.h2,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subtitle: {
    ...iosTypography.caption,
    color: '#8E8E93',
  },
  loading: {
    paddingVertical: iosDesign.spacing.xl,
    alignItems: 'center',
  },
  cardFrame: {
    position: 'relative',
    overflow: 'visible',
  },
  pressed: {
    opacity: 0.88,
  },
  skeleton: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(37,150,190,0.45)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonGhost: {
    ...StyleSheet.absoluteFillObject,
    padding: iosDesign.spacing.md,
    justifyContent: 'space-between',
    opacity: 0.35,
  },
  plusCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  plusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2596BE',
    letterSpacing: 0.2,
  },
  skeletonChip: {
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(60,60,67,0.08)',
  },
  skeletonLineWide: {
    width: '72%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(60,60,67,0.08)',
    marginTop: iosDesign.spacing.lg,
  },
  skeletonLine: {
    width: '48%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(60,60,67,0.06)',
    marginTop: 8,
  },
  plusFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37,150,190,0.25)',
    shadowColor: '#2596BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
});

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type ListRenderItem,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { HolographicShimmer } from '@/src/components/HolographicShimmer';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';
import { Easings } from '@/src/utils/motion';
import { appRoutes } from '@/src/constants/navigation';

/**
 * CardStackCarousel - bank / Apple Wallet style horizontal card carousel.
 *
 * Renders existing cards followed by an "Add card" skeleton that visually
 * belongs to the row (same height, same border radius, dashed border,
 * pulsing shimmer). Tapping the skeleton drives the create-card flow.
 *
 * Drives the multi-card flywheel: every time users see the empty + slot
 * while browsing their cards, they are nudged to spin up another identity.
 */

const HORIZONTAL_PADDING = 20;
const GAP = 14;
const SCREEN_WIDTH = Dimensions.get('window').width;

export interface CarouselCard {
  id: string;
  /** Optional role label (e.g. "Personal", "Work", "Creator"). */
  role?: string;
  fullName?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  profileUrl?: string;
  cardId?: string;
  isPrimary?: boolean;
}

export interface CardStackCarouselProps {
  cards: CarouselCard[];
  /** Where to send the user when they tap the add-card skeleton. */
  addCardHref?: string;
  /** Optional: callback when an existing card is tapped (for flip / detail). */
  onCardPress?: (card: CarouselCard, index: number) => void;
  /** Show the page indicator dots. Defaults to true. */
  showDots?: boolean;
}

export function CardStackCarousel({
  cards,
  addCardHref = appRoutes.guestDesign,
  onCardPress,
  showDots = true,
}: CardStackCarouselProps) {
  // Each list item is either a card or the + skeleton slot.
  type Item =
    | { kind: 'card'; card: CarouselCard; index: number }
    | { kind: 'add'; key: string };

  const items: Item[] = useMemo(
    () => [
      ...cards.map((card, index) => ({ kind: 'card' as const, card, index })),
      { kind: 'add' as const, key: '__add_card__' },
    ],
    [cards],
  );

  const cardWidth = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
  const snapInterval = cardWidth + GAP;

  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Item>>(null);

  const scroll = useSharedValue(0);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scroll.value = event.nativeEvent.contentOffset.x;
      const next = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
      setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
    },
    [items.length, scroll, snapInterval],
  );

  const renderItem: ListRenderItem<Item> = useCallback(
    ({ item }) => {
      if (item.kind === 'add') {
        return (
          <View style={[styles.itemWrap, { width: cardWidth, marginRight: HORIZONTAL_PADDING }]}>
            <AddCardSkeleton onPress={() => {
              HapticPattern.tapSuccess();
              router.push(addCardHref as any);
            }} />
          </View>
        );
      }
      return (
        <View style={[styles.itemWrap, { width: cardWidth, marginRight: cards.length - 1 === item.index ? HORIZONTAL_PADDING : GAP }]}>
          <Pressable
            onPress={() => {
              HapticTap.medium();
              onCardPress?.(item.card, item.index);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Card ${item.index + 1} of ${cards.length}: ${item.card.fullName || 'Card'}`}
            style={styles.cardPressable}
          >
            <FlippableNfcCard
              fullName={item.card.fullName}
              title={item.card.title}
              phone={item.card.phone}
              email={item.card.email}
              website={item.card.website}
              profileUrl={item.card.profileUrl}
              cardId={item.card.cardId}
            />
          </Pressable>
          {item.card.isPrimary ? (
            <View style={styles.primaryBadge}>
              <AppIcon name="BadgeCheck" size={12} color="#FFFFFF" />
              <AppText style={styles.primaryBadgeText}>Primary</AppText>
            </View>
          ) : null}
        </View>
      );
    },
    [addCardHref, cardWidth, cards.length, onCardPress],
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => (item.kind === 'add' ? item.key : item.card.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
        // Critical: first card uses left padding, not right gap, so it sits flush.
        style={styles.list}
      />

      {showDots && items.length > 1 ? (
        <View style={styles.dotsRow}>
          {items.map((item, i) => (
            <Dot key={item.kind === 'add' ? item.key : item.card.id} active={i === activeIndex} />
          ))}
          <View style={styles.dotsSpacer} />
          <AppText style={styles.dotsCount}>
            {Math.min(activeIndex + 1, cards.length)} / {cards.length}
            {activeIndex === items.length - 1 ? ' +' : ''}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        active ? styles.dotActive : styles.dotInactive,
      ]}
    />
  );
}

interface AddCardSkeletonProps {
  onPress: () => void;
}

function AddCardSkeleton({ onPress }: AddCardSkeletonProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easings.standard }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 0.32 + 0.42 * Math.sin(pulse.value * Math.PI),
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a new card"
      style={styles.skeletonPressable}
    >
      <View style={styles.skeletonCard}>
        <LinearGradient
          colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.02)', 'rgba(0,122,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Moving shimmer to make it feel "alive" without being noisy. */}
        <HolographicShimmer enabled opacity={0.42} cycleMs={5200} />
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} pointerEvents="none" />

        {/* Top brand row, mirrors NfcGlobalCardFace */}
        <View style={styles.skeletonTop}>
          <View style={styles.skeletonBrandRow}>
            <View style={styles.skeletonLogo} />
            <View>
              <View style={styles.skeletonLineLg} />
              <View style={[styles.skeletonLineSm, { marginTop: 6 }]} />
            </View>
          </View>
          <View style={styles.skeletonCheck} />
        </View>

        {/* Big + block where the name would be */}
        <View style={styles.skeletonNameBlock}>
          <View style={styles.skeletonPlusRing}>
            <AppIcon name="PlusSimple" size={36} color="#0A0C12" />
          </View>
          <AppText style={styles.skeletonTitle}>Add a card</AppText>
          <AppText style={styles.skeletonSubtitle}>
            Work, side project, event, creator profile...
          </AppText>
        </View>

        {/* Footer hint to mirror real card chrome */}
        <View style={styles.skeletonFooter}>
          <View style={styles.skeletonFooterPill}>
            <View style={styles.skeletonFooterDot} />
            <AppText style={styles.skeletonFooterText}>Tap to design</AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  list: {
    overflow: 'visible',
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 4,
  },
  itemWrap: {
    aspectRatio: 1.586,
    justifyContent: 'center',
  },
  cardPressable: {
    flex: 1,
    borderRadius: 24,
    overflow: 'visible',
  },
  primaryBadge: {
    position: 'absolute',
    top: 16,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0A0C12',
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#0A0C12',
    width: 18,
  },
  dotInactive: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dotsSpacer: { width: 10 },
  dotsCount: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.42)',
    letterSpacing: 0.4,
  },

  // Skeleton (Add card) - matches NfcGlobalCardFace proportions
  skeletonPressable: {
    flex: 1,
    borderRadius: 24,
  },
  skeletonCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,122,255,0.42)',
    borderStyle: 'dashed',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  skeletonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  skeletonLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  skeletonCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  skeletonLineLg: {
    width: 110,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  skeletonLineSm: {
    width: 70,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  skeletonNameBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  skeletonPlusRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  skeletonTitle: {
    color: '#0A0C12',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  skeletonSubtitle: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 220,
  },
  skeletonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  skeletonFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  skeletonFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  skeletonFooterText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

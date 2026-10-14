import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;

const CANVAS = '#0D0D0E';
const SURFACE = '#1A1A1F';
const ACCENT = '#799A85';
const TEXT = '#F5F5F7';
const MUTED = '#A1A1AA';
const BORDER = 'rgba(255,255,255,0.08)';

interface OnboardingCard {
  icon: AppIconName;
  step: string;
  title: string;
  body: string;
}

const CARDS: OnboardingCard[] = [
  {
    icon: 'User',
    step: '01',
    title: 'Set up your profile',
    body: 'Add your name, title, company, phone, email, LinkedIn, WhatsApp, and portfolio. Every field syncs to your NFC card instantly — no reprint needed.',
  },
  {
    icon: 'Nfc',
    step: '02',
    title: 'Tap to share',
    body: 'Hold the top of your iPhone (or center-back of Android) near someone\'s phone. They see your digital card immediately — no app required on their side.',
  },
  {
    icon: 'BarChart2',
    step: '03',
    title: 'Track your connections',
    body: 'Every tap is logged. See who opened your profile, when, and from where. Use the CRM to add notes, set follow-up reminders, and convert leads.',
  },
  {
    icon: 'ClipboardList',
    step: '04',
    title: 'Order your physical card',
    body: 'Upgrade to a laser-engraved metal, matte PVC, raw brass, or CNC carbon card. Ships worldwide. Your profile stays editable even after the card is printed.',
  },
];

export function OnboardingStepCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / CARD_W);
    setActiveIndex(index);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        snapToInterval={CARD_W}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={handleScroll}
      >
        {CARDS.map((card) => (
          <View key={card.step} style={styles.card}>
            {/* Step Badge */}
            <View style={styles.stepRow}>
              <View style={styles.iconCircle}>
                <AppIcon name={card.icon} size={18} color={ACCENT} />
              </View>
              <AppText style={styles.stepLabel}>{card.step} / 04</AppText>
            </View>

            {/* Content */}
            <AppText style={styles.cardTitle} weight="bold">
              {card.title}
            </AppText>
            <AppText style={styles.cardBody}>{card.body}</AppText>
          </View>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dots}>
        {CARDS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  scrollContent: {
    gap: 0,
  },
  card: {
    width: CARD_W,
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(121,154,133,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 11,
    color: ACCENT,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    color: TEXT,
    letterSpacing: -0.3,
  },
  cardBody: {
    fontSize: 13.5,
    color: MUTED,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
});

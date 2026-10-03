/**
 * CardsTabScreen — 03 Digital Card Management
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceSoft: '#141418',
  hairline: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#2596BE',
  cardBg: '#0B0B0E',
} as const;

type Card = {
  id: string;
  name: string;
  role: string;
  nfcLinked: boolean;
  taps: number;
  active: boolean;
};

const MOCK_CARDS: Card[] = [
  {
    id: '1',
    name: 'Executive Black',
    role: 'Managing Director · Acme Corp',
    nfcLinked: true,
    taps: 326,
    active: true,
  },
  {
    id: '2',
    name: 'Personal Profile',
    role: 'Creative Consultant',
    nfcLinked: false,
    taps: 48,
    active: false,
  },
];

export default function CardsTabScreen() {
  const [cards, setCards] = useState<Card[]>(MOCK_CARDS);

  const handleCardPress = useCallback((card: Card) => {
    HapticTap.light();
    router.push('/cards/settings' as any);
  }, []);

  const handleSetActive = useCallback((id: string, e: any) => {
    e.stopPropagation?.();
    HapticTap.softConfirmation();
    setCards((prev) =>
      prev.map((c) => ({ ...c, active: c.id === id })),
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <AppText style={styles.headerTitle} weight="bold">
            Digital Cards
          </AppText>
          <AppText style={styles.headerSubtitle}>
            Manage your profiles and virtual badges
          </AppText>
        </View>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.push('/cards/create' as any);
          }}
          style={styles.addBtn}
          hitSlop={12}
        >
          <AppIcon name="plus" size={18} color={C.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions — Borderless, Understated Pill Row */}
        <View style={styles.quickBar}>
          <Pressable
            style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
            onPress={() => { HapticTap.light(); router.push('/cards/create' as any); }}
          >
            <AppText style={styles.quickPillText} weight="medium">+ New Card</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
            onPress={() => { HapticTap.light(); router.push('/leads' as any); }}
          >
            <AppText style={styles.quickPillText} weight="medium">Leads CRM</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
            onPress={() => { HapticTap.light(); router.push('/share-profile' as any); }}
          >
            <AppText style={styles.quickPillText} weight="medium">Share</AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
            onPress={() => { HapticTap.light(); router.push('/qr/customize' as any); }}
          >
            <AppText style={styles.quickPillText} weight="medium">QR Code</AppText>
          </Pressable>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionLabel}>
            YOUR CARDS
          </AppText>
        </View>

        {/* Cards — Apple Wallet Stack Aesthetic */}
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => handleCardPress(card)}
            style={({ pressed }) => [
              styles.cardContainer,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <AppText style={styles.cardName} weight="bold">
                {card.name}
              </AppText>
              {card.active ? (
                <AppText style={styles.activeTag}>PRIMARY</AppText>
              ) : (
                <Pressable
                  onPress={(e) => handleSetActive(card.id, e)}
                  hitSlop={8}
                >
                  <AppText style={styles.setPrimaryBtn}>Set Primary</AppText>
                </Pressable>
              )}
            </View>

            <AppText style={styles.cardRole}>
              {card.role}
            </AppText>

            <View style={styles.cardFooterRow}>
              <AppText style={styles.cardStats}>
                {card.taps} taps · {card.nfcLinked ? 'NFC Linked' : 'Virtual only'}
              </AppText>
              <AppIcon name="chevron-right" size={16} color={C.textMuted} />
            </View>
          </Pressable>
        ))}

        {/* Order Physical Card Banner — Subtle Minimalist */}
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.push('/(tabs)/orders' as any);
          }}
          style={({ pressed }) => [
            styles.orderBanner,
            pressed && styles.orderBannerPressed,
          ]}
        >
          <View style={styles.orderBannerContent}>
            <AppText style={styles.orderBannerTitle} weight="medium">
              Order Physical NFC Card
            </AppText>
            <AppText style={styles.orderBannerSub}>
              Laser engraved metal & matte PVC shipped worldwide
            </AppText>
          </View>
          <AppIcon name="arrow-right" size={16} color={C.textSecondary} />
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 3,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  quickBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  quickPill: {
    backgroundColor: C.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  quickPillPressed: {
    backgroundColor: C.surfaceSoft,
  },
  quickPillText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: C.textMuted,
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: C.surfaceSoft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 18,
    letterSpacing: -0.3,
    color: C.text,
  },
  activeTag: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.accent,
    fontWeight: '700',
  },
  setPrimaryBtn: {
    fontSize: 13,
    color: C.textSecondary,
  },
  cardRole: {
    fontSize: 13,
    color: C.textMuted,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  cardStats: {
    fontSize: 12,
    color: C.textMuted,
  },
  orderBanner: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  orderBannerPressed: {
    backgroundColor: C.surfaceSoft,
  },
  orderBannerContent: {
    gap: 3,
    flex: 1,
  },
  orderBannerTitle: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  orderBannerSub: {
    fontSize: 12,
    color: C.textMuted,
  },
});

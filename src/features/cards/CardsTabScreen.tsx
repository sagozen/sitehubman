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
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#2596BE',
};

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
    name: 'Professional Card',
    role: 'Software Engineer · Acme Corp',
    nfcLinked: true,
    taps: 142,
    active: true,
  },
  {
    id: '2',
    name: 'Freelance Card',
    role: 'UI/UX Designer',
    nfcLinked: false,
    taps: 37,
    active: false,
  },
];

type QuickAction = {
  icon: AppIconName;
  label: string;
  route: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'plus', label: 'New Card', route: '/cards/create' },
  { icon: 'users', label: 'Leads CRM', route: '/leads' },
  { icon: 'share-2', label: 'Share', route: '/share-profile' },
  { icon: 'maximize', label: 'QR', route: '/qr-generator' },
];

export default function CardsTabScreen() {
  const [cards, setCards] = useState<Card[]>(MOCK_CARDS);

  const handleCardPress = useCallback((card: Card) => {
    HapticTap.light();
    router.push('/cards/settings' as any);
  }, []);

  const handleNfcLink = useCallback((card: Card) => {
    HapticTap.confidentClick();
    if (card.nfcLinked) {
      router.push('/nfc/settings' as any);
    } else {
      router.push('/nfc/write' as any);
    }
  }, []);

  const handleSetActive = useCallback((id: string) => {
    HapticTap.softConfirmation();
    setCards((prev) =>
      prev.map((c) => ({ ...c, active: c.id === id })),
    );
  }, []);

  const handleDelete = useCallback((card: Card) => {
    HapticTap.heavy();
    Alert.alert(
      'Delete Card',
      `Delete "${card.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            HapticTap.error();
            setCards((prev) => prev.filter((c) => c.id !== card.id));
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>My Cards</AppText>
        <Pressable
          onPress={() => { HapticTap.light(); router.push('/cards/create' as any); }}
          style={styles.addBtn}
          hitSlop={8}
        >
          <AppIcon name="plus" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => { HapticTap.light(); router.push(a.route as any); }}
              style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.6 }]}
              hitSlop={4}
            >
              <View style={styles.quickIconWrap}>
                <AppIcon name={a.icon} size={20} color={C.accent} />
              </View>
              <AppText style={styles.quickLabel}>{a.label}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Cards List */}
        <AppText style={styles.sectionLabel}>
          {cards.length} CARD{cards.length !== 1 ? 'S' : ''}
        </AppText>

        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <AppIcon name="credit-card" size={40} color={C.muted} />
            <AppText style={styles.emptyTitle}>No cards yet</AppText>
            <AppText style={styles.emptySub}>
              Create your first digital business card
            </AppText>
            <Pressable
              onPress={() => { HapticTap.light(); router.push('/cards/create' as any); }}
              style={styles.emptyBtn}
            >
              <AppText style={styles.emptyBtnText}>Create Card</AppText>
            </Pressable>
          </View>
        ) : (
          cards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => handleCardPress(card)}
              style={({ pressed }) => [
                styles.cardItem,
                card.active && styles.cardItemActive,
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={2}
            >
              {/* Card Accent Line */}
              <View style={[styles.cardAccentLine, card.active && styles.cardAccentLineActive]} />

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleRow}>
                    <AppText style={styles.cardName}>{card.name}</AppText>
                    {card.active && (
                      <View style={styles.activeBadge}>
                        <AppText style={styles.activeBadgeText}>Active</AppText>
                      </View>
                    )}
                  </View>
                  <AppText style={styles.cardRole}>{card.role}</AppText>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <AppIcon name="zap" size={12} color={C.muted} />
                    <AppText style={styles.statText}>{card.taps} taps</AppText>
                  </View>
                  <View style={styles.statItem}>
                    <AppIcon
                      name={card.nfcLinked ? 'wifi' : 'wifi-off'}
                      size={12}
                      color={card.nfcLinked ? C.accent : C.muted}
                    />
                    <AppText style={[styles.statText, card.nfcLinked && { color: C.accent }]}>
                      {card.nfcLinked ? 'NFC Linked' : 'No NFC'}
                    </AppText>
                  </View>
                </View>

                {/* Action Row */}
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => handleNfcLink(card)}
                    style={styles.chipBtn}
                    hitSlop={6}
                  >
                    <AppIcon name="wifi" size={13} color={C.accent} />
                    <AppText style={styles.chipBtnText}>
                      {card.nfcLinked ? 'NFC Settings' : 'Link NFC'}
                    </AppText>
                  </Pressable>

                  {!card.active && (
                    <Pressable
                      onPress={() => handleSetActive(card.id)}
                      style={[styles.chipBtn, styles.chipBtnGhost]}
                      hitSlop={6}
                    >
                      <AppIcon name="check-circle" size={13} color={C.text} />
                      <AppText style={[styles.chipBtnText, { color: C.text }]}>
                        Set Active
                      </AppText>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => router.push('/cards/appearance' as any)}
                    style={[styles.chipBtn, styles.chipBtnGhost]}
                    hitSlop={6}
                  >
                    <AppIcon name="sliders" size={13} color={C.text} />
                    <AppText style={[styles.chipBtnText, { color: C.text }]}>Edit</AppText>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDelete(card)}
                    style={styles.deleteBtn}
                    hitSlop={6}
                  >
                    <AppIcon name="trash-2" size={14} color="#FF453A" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))
        )}

        {/* Shop Banner */}
        <Pressable
          onPress={() => { HapticTap.light(); router.push('/cards/templates' as any); }}
          style={({ pressed }) => [styles.shopBanner, pressed && { opacity: 0.75 }]}
        >
          <View style={styles.shopLeft}>
            <AppText style={styles.shopTitle}>Order Physical Cards</AppText>
            <AppText style={styles.shopSub}>
              Premium NFC cards shipped to your door
            </AppText>
          </View>
          <AppIcon name="arrow-right" size={18} color={C.accent} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  quickItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  cardItem: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardItemActive: {
    borderColor: `${C.accent}44`,
  },
  cardAccentLine: {
    width: 3,
    backgroundColor: C.surfaceRaised,
  },
  cardAccentLineActive: {
    backgroundColor: C.accent,
  },
  cardBody: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: { gap: 4 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.3,
  },
  activeBadge: {
    backgroundColor: `${C.accent}22`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  activeBadgeText: {
    fontSize: 11,
    color: C.accent,
    fontWeight: '600',
  },
  cardRole: {
    fontSize: 13,
    color: C.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: C.muted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: `${C.accent}1A`,
    borderWidth: 1,
    borderColor: `${C.accent}33`,
  },
  chipBtnGhost: {
    backgroundColor: C.surfaceRaised,
    borderColor: C.border,
  },
  chipBtnText: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,69,58,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
    backgroundColor: C.accent,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginTop: 8,
  },
  shopLeft: { flex: 1 },
  shopTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  shopSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
});

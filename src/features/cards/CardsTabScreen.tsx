/**
 * CardsTabScreen — 03 Digital Card Management
 * Luxury Apple Wallet Stack Design (Apple Wallet × High-End Hardware)
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap, Haptics } from '@/src/utils/haptics';
import { InteractivePressable } from '@/src/components/InteractivePressable';
import { PhysicalHardwareCardGraphic, HardwareCardType } from '@/src/components/PhysicalHardwareCardGraphic';
import { useAuth } from '@/src/hooks/useAuth';
import { buildSlugProfileUrl, PUBLIC_PROFILE_HOST } from '@/src/constants/publicProfile';
import { useBioPage } from '@/src/hooks/useBioPage';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceSoft: '#18181C',
  hairline: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  sage: '#799A85',
} as const;

type CardItem = {
  id: string;
  hardwareType: HardwareCardType;
  cardholderName: string;
  companyName: string;
  title: string;
  slug: string;
  nfcLinked: boolean;
  taps: number;
  active: boolean;
  materialName: string;
  serialNumber: string;
  description: string;
};

const INITIAL_CARDS: CardItem[] = [
  {
    id: '1',
    hardwareType: 'metal_card',
    cardholderName: 'BAN NGUYEN',
    companyName: 'AVIO NETWORK',
    title: 'Managing Director · Global Operations',
    slug: 'ban-nguyen',
    nfcLinked: true,
    taps: 326,
    active: true,
    materialName: 'AEROSPACE 304 STEEL',
    serialNumber: 'SN // 894-304M',
    description: 'Direct contact pass, portfolio links & encrypted business profile.',
  },
  {
    id: '2',
    hardwareType: 'custom_card',
    cardholderName: 'BAN NGUYEN',
    companyName: 'AVIO BESPOKE',
    title: 'Principal Designer & Strategist',
    slug: 'ban-bespoke',
    nfcLinked: true,
    taps: 112,
    active: false,
    materialName: 'BESPOKE CNC CARBON',
    serialNumber: 'SN // 412-CRB9',
    description: 'Design consulting showcase, portfolio & direct booking card.',
  },
  {
    id: '3',
    hardwareType: 'premium_card',
    cardholderName: 'BAN NGUYEN',
    companyName: 'AVIO FOUNDERS',
    title: 'Private Investor & Member',
    slug: 'ban-investor',
    nfcLinked: false,
    taps: 48,
    active: false,
    materialName: 'SOLID RAW BRASS',
    serialNumber: 'SN // 084-GLD2',
    description: 'VIP investor pass and confidential deal flow link.',
  },
];

export default function CardsTabScreen() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [selectedCardForModal, setSelectedCardForModal] = useState<CardItem | null>(null);

  const [cards, setCards] = useState<CardItem[]>(() => {
    const ownerName = (bioPage?.displayName || user?.displayName || 'Ban Nguyen').toUpperCase();
    return INITIAL_CARDS.map((c) => ({
      ...c,
      cardholderName: ownerName,
      slug: bioPage?.slug || c.slug,
    }));
  });

  const activeCard = useMemo(() => {
    return cards.find((c) => c.active) || cards[0];
  }, [cards]);

  const handleCardPress = useCallback((card: CardItem) => {
    HapticTap.medium();
    setSelectedCardForModal(card);
  }, []);

  const handleSetActive = useCallback((id: string, e?: any) => {
    e?.stopPropagation?.();
    HapticTap.softConfirmation();
    setCards((prev) =>
      prev.map((c) => ({ ...c, active: c.id === id }))
    );
  }, []);

  const handleShareCard = useCallback(async (card: CardItem) => {
    HapticTap.light();
    const url = buildSlugProfileUrl(card.slug);
    try {
      await Share.share({
        title: `${card.cardholderName} · ${card.companyName}`,
        message: `${card.cardholderName} • ${card.title}\nScan or tap to connect: ${url}`,
        url,
      });
    } catch {}
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
            Apple Wallet passes & instant QR profile
          </AppText>
        </View>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.push('/cards/create' as any);
          }}
          style={styles.addBtn}
          hitSlop={14}
        >
          <AppIcon name="Plus" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions — Borderless Frosted Pills */}
        <View style={styles.quickBar}>
          <InteractivePressable
            style={styles.quickPill}
            onPress={() => router.push('/cards/create' as any)}
          >
            <AppText style={styles.quickPillText} weight="medium">+ New Card</AppText>
          </InteractivePressable>

          <InteractivePressable
            style={styles.quickPill}
            onPress={() => setSelectedCardForModal(activeCard)}
          >
            <AppText style={styles.quickPillTextSage} weight="medium">Show QR Code</AppText>
          </InteractivePressable>

          <InteractivePressable
            style={styles.quickPill}
            onPress={() => router.push('/leads' as any)}
          >
            <AppText style={styles.quickPillText} weight="medium">Leads CRM</AppText>
          </InteractivePressable>

          <InteractivePressable
            style={styles.quickPill}
            onPress={() => router.push('/nfc/test' as any)}
          >
            <AppText style={styles.quickPillText} weight="medium">NFC Test</AppText>
          </InteractivePressable>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionLabel}>
            YOUR WALLET STACK
          </AppText>
          <AppText style={styles.sectionSub}>
            Tap any card to scan QR or view profile details
          </AppText>
        </View>

        {/* Apple Wallet Style Physical Cards (Subtle hairline edges) */}
        {cards.map((card) => {
          return (
            <Pressable
              key={card.id}
              onPress={() => handleCardPress(card)}
              style={({ pressed }) => [
                styles.walletCardWrapper,
                card.active && styles.walletCardWrapperActive,
                pressed && styles.walletCardPressed,
              ]}
            >
              {/* Luxury Hardware Card Graphic */}
              <View style={styles.graphicContainer}>
                <PhysicalHardwareCardGraphic
                  type={card.hardwareType}
                  size="lg"
                  cardholderName={card.cardholderName}
                  companyName={card.companyName}
                  style={styles.cardGraphic}
                />
              </View>

              {/* Card Meta & Action Bar */}
              <View style={styles.cardInfoFooter}>
                <View style={styles.cardTextCol}>
                  <View style={styles.titleRow}>
                    <AppText style={styles.cardTitle} weight="bold">
                      {card.companyName}
                    </AppText>
                    {card.active ? (
                      <View style={styles.activeTagBadge}>
                        <AppText style={styles.activeTag} weight="bold">PRIMARY PASS</AppText>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.setPrimaryBtn}
                        onPress={(e) => handleSetActive(card.id, e)}
                        hitSlop={10}
                      >
                        <AppText style={styles.setPrimaryBtnText} weight="medium">Set Primary</AppText>
                      </Pressable>
                    )}
                  </View>
                  <AppText style={styles.cardSubtitle} numberOfLines={1}>
                    {card.title}
                  </AppText>
                </View>

                {/* Subfooter status row */}
                <View style={styles.metaRow}>
                  <View style={styles.statsGroup}>
                    <View style={styles.chipLedWrap}>
                      <View style={[styles.chipLed, { backgroundColor: card.nfcLinked ? '#30D158' : '#71717A' }]} />
                      <AppText style={styles.nfcStatusText} weight="medium">
                        {card.nfcLinked ? 'NFC Encoded' : 'Virtual Pass'}
                      </AppText>
                    </View>
                    <AppText style={styles.dotSeparator}>·</AppText>
                    <AppText style={styles.tapsText}>
                      {card.taps} taps
                    </AppText>
                  </View>

                  <View style={styles.viewDetailsRow}>
                    <AppIcon name="QrCode" size={13} color={C.sage} />
                    <AppText style={styles.scanText} weight="semibold">Tap to Scan</AppText>
                    <AppIcon name="ChevronRight" size={13} color={C.textMuted} />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Order Physical Card Banner */}
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
          <View style={styles.orderBannerIcon}>
            <AppIcon name="CreditCard" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.orderBannerContent}>
            <AppText style={styles.orderBannerTitle} weight="bold">
              Order Custom Engraved NFC Card
            </AppText>
            <AppText style={styles.orderBannerSub}>
              Laser engraved stainless steel, raw brass & matte PVC
            </AppText>
          </View>
          <AppIcon name="ArrowRight" size={16} color={C.textSecondary} />
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Direct Card QR & Store Detail Modal ── */}
      <Modal
        visible={Boolean(selectedCardForModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCardForModal(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedCardForModal(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <AppText style={styles.modalTitle} weight="bold">
                  {selectedCardForModal?.companyName}
                </AppText>
                <AppText style={styles.modalSub}>
                  {selectedCardForModal?.cardholderName} · {selectedCardForModal?.materialName}
                </AppText>
              </View>
              <Pressable
                onPress={() => setSelectedCardForModal(null)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* High Contrast QR Code Canvas */}
            <View style={styles.qrContainer}>
              {selectedCardForModal && (
                <View style={styles.qrWhiteBox}>
                  <QRCode
                    value={buildSlugProfileUrl(selectedCardForModal.slug)}
                    size={200}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
              )}
              <AppText style={styles.qrInstructions} weight="medium">
                Point any phone camera to instantly scan & exchange contacts
              </AppText>
              <AppText style={styles.qrUrlText} numberOfLines={1}>
                {selectedCardForModal ? buildSlugProfileUrl(selectedCardForModal.slug) : ''}
              </AppText>
            </View>

            {/* Profile Detail Specs */}
            <View style={styles.detailsGroup}>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>NFC Silicon</AppText>
                <AppText style={styles.detailVal} weight="medium">NTAG216 (13.56 MHz ISO/IEC)</AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Card Status</AppText>
                <AppText style={styles.detailValSage} weight="semibold">
                  {selectedCardForModal?.nfcLinked ? 'Active · NFC Linked' : 'Virtual Pass'}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Taps / Scans</AppText>
                <AppText style={styles.detailVal} weight="medium">
                  {selectedCardForModal?.taps} scans recorded
                </AppText>
              </View>
            </View>

            {/* Actions Footer */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.shareBtn}
                onPress={() => selectedCardForModal && handleShareCard(selectedCardForModal)}
              >
                <AppIcon name="Share2" size={16} color="#000000" />
                <AppText style={styles.shareBtnText} weight="bold">Share Profile Link</AppText>
              </Pressable>

              <Pressable
                style={styles.settingsBtn}
                onPress={() => {
                  setSelectedCardForModal(null);
                  router.push('/cards/settings' as any);
                }}
              >
                <AppText style={styles.settingsBtnText} weight="medium">Card Settings</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  quickBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickPill: {
    backgroundColor: C.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  quickPillText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  quickPillTextSage: {
    fontSize: 13,
    color: C.sage,
  },
  sectionHeader: {
    marginBottom: 16,
    gap: 2,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: C.textMuted,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 13,
    color: C.textSecondary,
  },
  walletCardWrapper: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  walletCardWrapperActive: {
    backgroundColor: '#121413',
  },
  walletCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    width: '100%',
  },
  cardGraphic: {
    width: '100%',
    maxWidth: 320,
    height: 196,
  },
  cardInfoFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    gap: 10,
  },
  cardTextCol: {
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    letterSpacing: -0.3,
    color: C.text,
  },
  activeTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  activeTag: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#000000',
  },
  setPrimaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: C.surfaceSoft,
  },
  setPrimaryBtnText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: C.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipLedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  nfcStatusText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  dotSeparator: {
    color: C.textMuted,
    fontSize: 12,
  },
  tapsText: {
    fontSize: 12,
    color: C.textMuted,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanText: {
    fontSize: 12,
    color: C.sage,
  },
  orderBanner: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  orderBannerPressed: {
    backgroundColor: C.surfaceSoft,
  },
  orderBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBannerContent: {
    gap: 2,
    flex: 1,
  },
  orderBannerTitle: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  orderBannerSub: {
    fontSize: 12,
    color: C.textSecondary,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111114',
    borderRadius: 24,
    padding: 24,
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  modalSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#242428',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrWhiteBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  qrInstructions: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  qrUrlText: {
    fontSize: 12,
    color: C.sage,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  detailsGroup: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: C.textMuted,
  },
  detailVal: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  detailValSage: {
    fontSize: 13,
    color: C.sage,
  },
  modalActions: {
    gap: 10,
  },
  shareBtn: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: {
    fontSize: 15,
    color: '#000000',
  },
  settingsBtn: {
    height: 46,
    backgroundColor: '#18181C',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 14,
    color: C.textSecondary,
  },
});

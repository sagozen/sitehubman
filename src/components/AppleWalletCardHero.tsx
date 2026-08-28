/**
 * AppleWalletCardHero.tsx
 *
 * 100% Native iOS 17.4 Apple Wallet & Apple Cash Card Layout.
 * Modeled directly after the iOS 17.4 Apple Cash Wallet interface:
 *  - Solid pure black canvas (#000000)
 *  - Floating hero pass card with crisp typography
 *  - Clean Balance / Lead counter row with giant bold numbers
 *  - White primary pill action button ('Share Card' / 'Send or Request')
 *  - Apple Safari AutoFill style feature banner
 */
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface AppleWalletCardHeroProps {
  displayName?: string;
  tapsCount?: number;
  leadsCount?: number;
  onShareCard: () => void;
  onOrderCard: () => void;
  onViewLeads: () => void;
}

export function AppleWalletCardHero({
  displayName = 'Ban Nguyen',
  tapsCount = 42,
  leadsCount = 12,
  onShareCard,
  onOrderCard,
  onViewLeads,
}: AppleWalletCardHeroProps) {
  return (
    <View style={styles.container}>
      {/* ── 1. Floating Apple Pass Hero Card ── */}
      <Pressable
        onPress={() => {
          HapticTap.light();
          onOrderCard();
        }}
        style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
      >
        <Image
          source={require('@/assets/images/marketing/hero-home.png')}
          style={styles.heroCardBg}
          resizeMode="cover"
        />
        <View style={styles.heroCardOverlay} />

        <View style={styles.cardHeaderRow}>
          <View style={styles.brandRow}>
            <AppIcon name="CreditCard" size={16} color="#FFFFFF" />
            <AppText style={styles.brandTitle} weight="extrabold">AVIO Pass</AppText>
          </View>
          <View style={styles.nfcChipSeal}>
            <AppIcon name="Nfc" size={14} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <View style={styles.cardHolderBlock}>
            <AppText style={styles.cardHolderName} weight="bold">
              {displayName.toUpperCase()}
            </AppText>
            <AppText style={styles.cardSub}>EXECUTIVE TITANIUM · NFC ACTIVE</AppText>
          </View>
          <AppText style={styles.passBadge} weight="extrabold">24K METAL</AppText>
        </View>
      </Pressable>

      {/* ── 2. Apple Cash Balance & Action Row ── */}
      <View style={styles.balanceRow}>
        <Pressable onPress={onViewLeads} style={styles.balanceLeft}>
          <AppText style={styles.balanceLabel}>Captured Leads</AppText>
          <AppText style={styles.balanceValue} weight="extrabold">
            {leadsCount} <AppText style={styles.balanceUnit}>leads</AppText>
          </AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionPill, pressed && styles.pressed]}
          onPress={() => {
            HapticTap.medium();
            onShareCard();
          }}
        >
          <AppText style={styles.actionPillText} weight="extrabold">Share Card</AppText>
        </Pressable>
      </View>

      {/* ── 3. iOS 17.4 Feature Banner Card ── */}
      <View style={styles.featureBanner}>
        <View style={styles.featureBannerHeader}>
          <View style={styles.featureIconBox}>
            <AppIcon name="Nfc" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.featureMeta}>
            <AppText style={styles.featureTitle} weight="extrabold">
              Use AVIO Smart Pass with 1-Tap NFC
            </AppText>
            <AppText style={styles.featureSub}>
              Tap the top of any iPhone or Android to instantly transfer your profile, vCard, and direct social links.
            </AppText>
          </View>
        </View>

        <View style={styles.bannerDivider} />

        <Pressable
          onPress={() => {
            HapticTap.light();
            onOrderCard();
          }}
          style={styles.bannerFooterLink}
        >
          <AppText style={styles.bannerFooterLinkText} weight="bold">
            Order Laser-Engraved Titanium Card →
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // ── Hero Card ──
  heroCard: {
    height: 210,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111114',
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  heroCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.38,
  },
  heroCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  nfcChipSeal: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardHolderBlock: {
    gap: 2,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  cardSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  passBadge: {
    color: '#FFD60A',
    fontSize: 10,
    letterSpacing: 0.8,
  },

  // ── Balance / Lead Counter Row ──
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111114',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceLeft: {
    gap: 2,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  balanceUnit: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    fontWeight: '400',
  },
  actionPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionPillText: {
    color: '#000000',
    fontSize: 14,
  },

  // ── iOS 17.4 Feature Banner Card ──
  featureBanner: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureBannerHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureMeta: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  featureSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    lineHeight: 16,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  bannerFooterLink: {
    paddingVertical: 2,
  },
  bannerFooterLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
  },

  pressed: {
    opacity: 0.82,
  },
});

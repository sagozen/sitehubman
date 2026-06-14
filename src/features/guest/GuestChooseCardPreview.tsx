import { CachedImage } from '@/src/components/CachedImage';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  GUEST_CAROUSEL_CUSTOM_INDEX,
  GUEST_PHYSICAL_CARD_GRADIENTS,
  GUEST_VIRTUAL_CARD_GRADIENTS,
} from '@/src/constants/guestCardDesign';
import { iosDesign } from '@/src/design-system/ios';

export type ChooseCardGradient = {
  colors: readonly [string, string, ...string[]];
  accent: string;
};

export type ChooseCardType = 'virtual' | 'physical';

export const VIRTUAL_CARD_GRADIENTS = GUEST_VIRTUAL_CARD_GRADIENTS;
export const PHYSICAL_CARD_GRADIENTS = GUEST_PHYSICAL_CARD_GRADIENTS;

/** Third carousel slide — custom photo background. */
export const CAROUSEL_CUSTOM_INDEX = GUEST_CAROUSEL_CUSTOM_INDEX;

export const CUSTOM_SLOT_PLACEHOLDER_GRADIENT: ChooseCardGradient = {
  colors: ['#1C1C1E', '#2C2C2E', '#3A3A3C'],
  accent: '#FFFFFF',
};

type Props = {
  gradient: ChooseCardGradient;
  /** Primary name on card face */
  fullName: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  gradientIndex?: number;
  cardType?: ChooseCardType;
  width: number;
  height: number;
  /** Full-card background photo (gradient used as fallback when absent). */
  customImageUri?: string | null;
  /** Fourth carousel slide — dashed placeholder or uploaded photo. */
  isCustomSlot?: boolean;
  /** Opens image picker when the custom placeholder is tapped. */
  onAddPhoto?: () => void;
  /** @deprecated Use cardType="physical" */
  isPhysical?: boolean;
};

export function GuestChooseCardPreview({
  gradient,
  fullName,
  title = '',
  company = '',
  email = '',
  phone = '',
  gradientIndex = 0,
  cardType,
  width,
  height,
  customImageUri = null,
  isCustomSlot = false,
  onAddPhoto,
  isPhysical = false,
}: Props) {
  const resolvedType: ChooseCardType = cardType ?? (isPhysical ? 'physical' : 'virtual');
  const isPhysicalCard = resolvedType === 'physical';
  const name = (fullName.trim() || 'Your Name').toUpperCase();
  const subtitle = [title.trim(), company.trim()].filter(Boolean).join(' · ');
  const primaryContact = email.trim() || phone.trim() || 'your.link/card';
  const secondaryContact = phone.trim() && email.trim() ? phone.trim() : resolvedType === 'physical' ? 'Physical NFC card' : 'Digital profile';
  const hasCustomImage = Boolean(customImageUri?.trim());
  const showPlaceholder = isCustomSlot && !hasCustomImage;
  const textAccent = hasCustomImage || showPlaceholder ? '#FFFFFF' : gradient.accent;

  const cardBody = (
    <View
      style={[
        styles.cardShell,
        { width, height },
        showPlaceholder && styles.cardShellCustomEmpty,
      ]}
    >
      {showPlaceholder ? (
        <>
          <LinearGradient
            colors={CUSTOM_SLOT_PLACEHOLDER_GRADIENT.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.customPlaceholder} pointerEvents="none">
            <View style={styles.yourDesignBadge}>
              <AppText style={styles.yourDesignBadgeText}>Your design</AppText>
            </View>
            <View style={styles.customPlusFab}>
              <AppIcon name="Plus" size={26} color="rgba(255,255,255,0.95)" />
            </View>
            <AppText style={styles.tapAddPhotoText}>Custom photo</AppText>
          </View>
        </>
      ) : hasCustomImage ? (
        <>
          <CachedImage
            uri={customImageUri!.trim()}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.72)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      ) : (
        <>
          <LinearGradient
            colors={gradient.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.95, y: 0.55 }}
            style={styles.shinePrimary}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.18)']}
            start={{ x: 0.2, y: 0.6 }}
            end={{ x: 1, y: 1 }}
            style={styles.shineSecondary}
            pointerEvents="none"
          />
        </>
      )}

      <View style={styles.cardContent}>
        <View style={styles.decorBand} pointerEvents="none" />
        <View style={styles.topRow}>
          <View style={styles.brandChip}>
            <View style={styles.brandMark}>
              <AppText style={[styles.brandMarkText, { color: textAccent }]}>N</AppText>
            </View>
            <View>
              <AppText style={styles.brandName}>NFC GLOBAL</AppText>
              <AppText style={styles.brandSub}>{isPhysicalCard ? 'Printed card' : 'Tap profile'}</AppText>
            </View>
          </View>
          <View style={styles.nfcChip}>
            <AppIcon name="Nfc" size={11} color="rgba(255,255,255,0.92)" />
            <AppText style={styles.nfcChipText}>{isPhysicalCard ? 'PRINT' : 'LIVE'}</AppText>
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.identityBlock}>
            <AppText style={[styles.name, { color: textAccent }]} numberOfLines={1} adjustsFontSizeToFit>
              {name}
            </AppText>
            <AppText style={styles.subtitle} numberOfLines={1}>
              {subtitle || 'Your digital business card'}
            </AppText>
            <View style={styles.contactStack}>
              <View style={styles.contactPill}>
                <AppIcon name="Mail" size={8} color="rgba(255,255,255,0.72)" />
                <AppText style={styles.contact} numberOfLines={1}>{primaryContact}</AppText>
              </View>
              <View style={styles.contactPill}>
                <AppIcon name="Phone" size={8} color="rgba(255,255,255,0.72)" />
                <AppText style={styles.contact} numberOfLines={1}>{secondaryContact}</AppText>
              </View>
            </View>
          </View>
          <View style={styles.qrModule}>
            <AppIcon name="QrCode" size={24} color="#111111" />
          </View>
        </View>
      </View>
    </View>
  );

  if (showPlaceholder && onAddPhoto) {
    return (
      <Pressable
        onPress={onAddPhoto}
        accessibilityRole="button"
        accessibilityLabel="Tap to add photo"
        style={({ pressed }) => [pressed && styles.cardShellPressed]}
      >
        {cardBody}
      </Pressable>
    );
  }

  return cardBody;
}

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: iosDesign.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    ...iosDesign.shadows.card,
  },
  cardShellCustomEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.42)',
  },
  cardShellPressed: {
    opacity: 0.92,
  },
  customPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: iosDesign.spacing.md,
  },
  yourDesignBadge: {
    position: 'absolute',
    top: iosDesign.spacing.sm,
    left: iosDesign.spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  yourDesignBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.92)',
    textTransform: 'uppercase',
  },
  customPlusFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tapAddPhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.2,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  shinePrimary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  shineSecondary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  decorBand: {
    position: 'absolute',
    top: 28,
    right: -18,
    width: '58%',
    height: '44%',
    transform: [{ rotate: '-18deg' }],
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
    flex: 1,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  brandMarkText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Inter_900Black',
  },
  brandName: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter_900Black',
  },
  brandSub: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.58)',
    fontFamily: 'Inter_700Bold',
  },
  nfcChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  nfcChipText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
    fontFamily: 'Inter_900Black',
  },
  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  identityBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
    fontFamily: 'Inter_900Black',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.74)',
    fontFamily: 'Inter_700Bold',
  },
  contactStack: {
    gap: 3,
    marginTop: 3,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 15,
  },
  contact: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
    fontFamily: 'Inter_600SemiBold',
  },
  qrModule: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
});

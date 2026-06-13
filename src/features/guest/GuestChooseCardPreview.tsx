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
  const contactLine = email.trim() || phone.trim();
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
        <View style={styles.mid}>
          <View style={styles.labelRow}>
            <AppText style={styles.networkLabel}>
              {isPhysicalCard ? 'BIO CLOUD NATIVE' : 'DIGITAL NFC'}
            </AppText>
            {!isPhysicalCard ? (
              <View style={styles.digitalBadge}>
                <AppIcon name="Nfc" size={11} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.digitalBadgeText}>Tap</AppText>
              </View>
            ) : null}
          </View>
          <AppText style={[styles.name, { color: textAccent }]} numberOfLines={1}>
            {name}
          </AppText>
          {subtitle ? (
            <AppText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          {contactLine ? (
            <AppText style={styles.contact} numberOfLines={1}>
              {contactLine}
            </AppText>
          ) : null}
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
    padding: iosDesign.spacing.sm + 2,
    justifyContent: 'flex-end',
  },
  shinePrimary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  shineSecondary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  mid: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  networkLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.72)',
  },
  digitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  digitalBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  contact: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
    marginTop: 2,
  },
});

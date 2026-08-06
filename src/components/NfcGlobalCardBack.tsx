import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';

const CARD_GRADIENT = ['#111111', '#202124', '#2596BE'] as const;

type NfcGlobalCardBackProps = {
  /** Profile URL for QR code */
  profileUrl?: string;
  /** Card ID for identification */
  cardId?: string;
  width?: number;
  height?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const NfcGlobalCardBack = memo(function NfcGlobalCardBack({
  profileUrl = '',
  cardId = '',
  width,
  height,
  compact = false,
  style,
}: NfcGlobalCardBackProps) {
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;
  const qrUrl = profileUrl.trim() || `https://sitehub.app/u/${cardId || 'nexus-7a3f'}`;

  return (
    <View style={[styles.card, compact && styles.cardCompact, cardSizeStyle, style]}>
      {/* Dark Forged Carbon Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0B0E' }]} />

      {/* Glossy Metallic Gradient Sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)', 'transparent', 'rgba(0,240,255,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Content Layout */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Top Header */}
        <View style={styles.header}>
          <AppText style={[styles.cardHeaderTitle, compact && styles.cardHeaderTitleCompact]}>
            NEXUS CARD
          </AppText>
          <AppText style={[styles.cardHeaderSub, compact && styles.cardHeaderSubCompact]}>
            Future of Connectivity
          </AppText>
        </View>

        {/* Feature Badges List */}
        <View style={[styles.featureList, compact && styles.featureListCompact]}>
          <FeatureBadge icon="ShieldCheck" label="Secure Chip" compact={compact} />
          <FeatureBadge icon="Nfc" label="Tap to Connect" compact={compact} />
          <FeatureBadge icon="Zap" label="Energy Harvesting" compact={compact} />
          <FeatureBadge icon="Sparkles" label="Eco Material" compact={compact} />
        </View>

        {/* Bottom Slogan */}
        <AppText style={[styles.sloganText, compact && styles.sloganTextCompact]}>
          Designed for a <AppText style={styles.sloganBold}>Smarter</AppText> Tomorrow
        </AppText>

        {/* Real Scannable QR Code (Right Side Positioned) */}
        <View style={[styles.qrContainer, compact && styles.qrContainerCompact]}>
          <View style={styles.qrWhiteFrame}>
            <QRCode
              value={qrUrl}
              size={compact ? 48 : 68}
              color="#000000"
              backgroundColor="#FFFFFF"
              quietZone={2}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

function FeatureBadge({ icon, label, compact }: { icon: string; label: string; compact: boolean }) {
  return (
    <View style={styles.badgeRow}>
      <View style={styles.badgeIconDot}>
        <AppIcon name={icon as any} size={compact ? 9 : 12} color="#00F0FF" />
      </View>
      <AppText style={[styles.badgeLabel, compact && styles.badgeLabelCompact]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#090A0E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...createShadow({ color: '#000000', offset: { width: 0, height: 24 }, opacity: 0.4, radius: 55, elevation: 12 }),
  },
  cardCompact: {
    borderRadius: 12,
  },
  meshPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  meshLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  contentCompact: {
    padding: 13,
  },
  header: {
    gap: 3,
  },
  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  cardHeaderTitleCompact: {
    fontSize: 9.5,
    letterSpacing: 2,
  },
  cardHeaderSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '500',
  },
  cardHeaderSubCompact: {
    fontSize: 8,
  },
  featureList: {
    gap: 8,
    marginVertical: 4,
  },
  featureListCompact: {
    gap: 4,
    marginVertical: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeIconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badgeLabelCompact: {
    fontSize: 8.5,
  },
  sloganText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10.5,
    fontWeight: '400',
    maxWidth: '60%',
  },
  sloganTextCompact: {
    fontSize: 7.5,
    maxWidth: '55%',
  },
  sloganBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  qrContainer: {
    position: 'absolute',
    right: 18,
    bottom: 18,
  },
  qrContainerCompact: {
    right: 12,
    bottom: 12,
  },
  qrWhiteFrame: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});

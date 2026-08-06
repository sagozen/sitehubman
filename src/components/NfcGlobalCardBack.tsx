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

export function NfcGlobalCardBack({
  profileUrl = '',
  cardId = '',
  width,
  height,
  compact = false,
  style,
}: NfcGlobalCardBackProps) {
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;
  const resolvedHeight = height ?? (width ? width / 1.586 : undefined);
  const maxQrSize = resolvedHeight ? Math.max(62, Math.floor(resolvedHeight * 0.32)) : compact ? 74 : 104;
  const qrSize = compact ? Math.min(74, maxQrSize) : Math.min(104, maxQrSize);

  return (
    <View style={[styles.card, compact && styles.cardCompact, cardSizeStyle, style]}>
      {/* Dark Matte Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#090A0E' }]} />

      {/* Subtle Sheen Overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Geometric Mesh Overlay */}
      <View style={styles.meshPattern} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.meshLine} />
        ))}
      </View>

      {/* Content Layout */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Top Header */}
        <View style={styles.header}>
          <AppText style={[styles.cardHeaderTitle, compact && styles.cardHeaderTitleCompact]}>
            N E X U S   C A R D
          </AppText>
          <AppText style={[styles.cardHeaderSub, compact && styles.cardHeaderSubCompact]}>
            Future of Connectivity
          </AppText>
        </View>

        {/* Feature Badges List */}
        <View style={[styles.featureList, compact && styles.featureListCompact]}>
          <FeatureBadge icon="ShieldCheck" label="Secure Chip" compact={compact} />
          <FeatureBadge icon="Wifi" label="Tap to Connect" compact={compact} />
          <FeatureBadge icon="Zap" label="Energy Harvesting" compact={compact} />
          <FeatureBadge icon="Leaf" label="Eco Material" compact={compact} />
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomRow}>
          <AppText style={[styles.sloganText, compact && styles.sloganTextCompact]}>
            Designed for a <AppText style={styles.sloganBold}>Smarter</AppText> Tomorrow
          </AppText>

          {/* QR Code Bottom Right */}
          <View style={[styles.qrBox, compact && styles.qrBoxCompact]}>
            {profileUrl ? (
              <QRCode
                value={profileUrl}
                size={qrSize}
                color="#090A0E"
                backgroundColor="#FFFFFF"
                quietZone={2}
              />
            ) : (
              <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
                <AppText style={styles.qrPlaceholderText}>QR</AppText>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function FeatureBadge({ icon, label, compact }: { icon: string; label: string; compact: boolean }) {
  return (
    <View style={styles.badgeRow}>
      <AppIcon name={icon as any} size={compact ? 10 : 13} color="rgba(255,255,255,0.85)" />
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
  badgeLabel: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badgeLabelCompact: {
    fontSize: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sloganText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10.5,
    fontWeight: '400',
    maxWidth: '65%',
  },
  sloganTextCompact: {
    fontSize: 7.5,
  },
  sloganBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  qrBox: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  qrBoxCompact: {
    padding: 3,
    borderRadius: 6,
  },
  qrPlaceholder: {
    backgroundColor: '#090A0E',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  qrPlaceholderText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

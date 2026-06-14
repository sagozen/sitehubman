import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '@/src/components/AppText';

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
  const qrSize = compact ? 110 : 150;

  return (
    <View style={[styles.card, compact && styles.cardCompact, cardSizeStyle, style]}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Magnetic stripe */}
      <View style={[styles.magStripe, compact && styles.magStripeCompact]} />

      {/* Card content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* QR code section */}
        <View style={styles.qrSection}>
          <View style={[styles.qrBox, { width: qrSize + 20, height: qrSize + 20 }]}>
            {profileUrl ? (
              <QRCode
                value={profileUrl}
                size={qrSize}
                color="#111111"
                backgroundColor="#FFFFFF"
                quietZone={4}
              />
            ) : (
              <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
                <AppText style={styles.qrPlaceholderText}>QR</AppText>
              </View>
            )}
          </View>
          <AppText style={[styles.qrLabel, compact && styles.qrLabelCompact]}>
            SCAN TO VIEW PROFILE
          </AppText>
        </View>

        {/* Card ID */}
        {cardId ? (
          <AppText style={[styles.cardId, compact && styles.cardIdCompact]}>
            {cardId}
          </AppText>
        ) : null}

        {/* Bottom branding */}
        <View style={[styles.bottom, compact && styles.bottomCompact]}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
              <AppText style={[styles.brandMarkText, compact && styles.brandMarkTextCompact]}>N</AppText>
            </View>
            <AppText style={[styles.brandText, compact && styles.brandTextCompact]}>
              NFC GLOBAL
            </AppText>
          </View>
          <AppText style={[styles.tagline, compact && styles.taglineCompact]}>
            Your identity. One tap away.
          </AppText>
        </View>

        {/* Instructions */}
        <View style={[styles.instructions, compact && styles.instructionsCompact]}>
          <View style={styles.instructionRow}>
            <View style={styles.instructionDot} />
            <AppText style={[styles.instructionText, compact && styles.instructionTextCompact]}>
              Tap to share your digital profile
            </AppText>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionDot} />
            <AppText style={[styles.instructionText, compact && styles.instructionTextCompact]}>
              Compatible with all NFC devices
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#111111',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 55,
    elevation: 10,
  },
  cardCompact: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 6,
  },

  // Magnetic stripe
  magStripe: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: '#000000',
  },
  magStripeCompact: {
    top: 32,
    height: 32,
  },

  // Content
  content: {
    flex: 1,
    padding: 22,
    paddingTop: 120,
    gap: 16,
    zIndex: 2,
  },
  contentCompact: {
    padding: 14,
    paddingTop: 75,
    gap: 10,
  },

  // QR section
  qrSection: {
    alignItems: 'center',
    gap: 10,
  },
  qrBox: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  qrPlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  qrPlaceholderText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  qrLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  qrLabelCompact: {
    fontSize: 7,
    letterSpacing: 0.8,
  },

  // Card ID
  cardId: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.58)',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 4,
  },
  cardIdCompact: {
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Bottom branding
  bottom: {
    marginTop: 'auto',
    gap: 6,
  },
  bottomCompact: {
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkCompact: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  brandMarkText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 20,
  },
  brandMarkTextCompact: {
    fontSize: 13,
    lineHeight: 14,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  brandTextCompact: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.9,
  },
  tagline: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  taglineCompact: {
    fontSize: 7,
    lineHeight: 9,
  },

  // Instructions
  instructions: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  instructionsCompact: {
    gap: 4,
    paddingTop: 6,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  instructionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  instructionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.58)',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
  },
  instructionTextCompact: {
    fontSize: 7,
    lineHeight: 9,
  },
});

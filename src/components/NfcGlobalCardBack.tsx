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
  const resolvedHeight = height ?? (width ? width / 1.586 : undefined);
  const maxQrSize = resolvedHeight ? Math.max(62, Math.floor(resolvedHeight * 0.32)) : compact ? 74 : 104;
  const qrSize = compact ? Math.min(74, maxQrSize) : Math.min(104, maxQrSize);

  return (
    <View style={[styles.card, compact && styles.cardCompact, cardSizeStyle, style]}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Magnetic stripe - placed higher up */}
      <View style={[styles.magStripe, compact && styles.magStripeCompact]} />

      {/* Card content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.mainRow, compact && styles.mainRowCompact]}>
          {/* QR code section on the left */}
          <View style={[styles.qrSection, compact && styles.qrSectionCompact]}>
            <View style={[styles.qrBox, compact && styles.qrBoxCompact, { width: qrSize + 16, height: qrSize + 16 }]}>
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
              SCAN TO VIEW
            </AppText>
          </View>

          {/* Branding, Title, and Note on the right */}
          <View style={[styles.rightColumn, compact && styles.rightColumnCompact]}>
            <View style={[styles.brandRow, compact && styles.brandRowCompact]}>
              <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
                <AppText style={[styles.brandMarkText, compact && styles.brandMarkTextCompact]}>N</AppText>
              </View>
              <AppText style={[styles.brandText, compact && styles.brandTextCompact]}>
                NFC GLOBAL
              </AppText>
            </View>

            <AppText style={[styles.noteText, compact && styles.noteTextCompact]} numberOfLines={3}>
              Scan the QR code or tap the card to connect instantly and view the digital profile.
            </AppText>

            {cardId ? (
              <AppText style={[styles.cardId, compact && styles.cardIdCompact]}>
                ID: {cardId}
              </AppText>
            ) : null}
          </View>
        </View>

        {!compact ? (
          <View style={styles.instructions}>
            <View style={styles.instructionRow}>
              <View style={styles.instructionDot} />
              <AppText style={styles.instructionText}>
                Tap or scan back of card to connect
              </AppText>
            </View>
          </View>
        ) : null}
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

  // Magnetic stripe (placed higher up)
  magStripe: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: '#000000',
  },
  magStripeCompact: {
    top: 12,
    height: 24,
  },

  // Content
  content: {
    flex: 1,
    padding: 22,
    paddingTop: 74, // reduced from 108 to start right below the high-aligned magnetic stripe
    gap: 12,
    zIndex: 2,
  },
  contentCompact: {
    padding: 14,
    paddingTop: 44, // reduced from 62
    gap: 7,
  },

  // Horizontal Row
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flex: 1,
  },
  mainRowCompact: {
    gap: 10,
  },

  // QR section (left)
  qrSection: {
    alignItems: 'center',
    gap: 6,
  },
  qrSectionCompact: {
    gap: 4,
  },
  qrBox: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  qrBoxCompact: {
    borderRadius: 10,
    padding: 6,
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
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.9,
    textAlign: 'center',
  },
  qrLabelCompact: {
    fontSize: 7,
    letterSpacing: 0.8,
  },

  // Right column
  rightColumn: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  rightColumnCompact: {
    gap: 4,
  },

  // Note text (in gray)
  noteText: {
    color: 'rgba(255,255,255,0.62)', // Gray tone
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  noteTextCompact: {
    fontSize: 7.5,
    lineHeight: 10,
  },

  // Card ID
  cardId: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.48)', // Premium light gray
    letterSpacing: 1.2,
    marginTop: 2,
  },
  cardIdCompact: {
    fontSize: 7,
    letterSpacing: 0.8,
    marginTop: 1,
  },

  // Branding mark (logo box)
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkCompact: {
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  brandMarkText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 16,
  },
  brandMarkTextCompact: {
    fontSize: 10,
    lineHeight: 11,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandRowCompact: {
    gap: 6,
  },

  // Instructions
  instructions: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    marginTop: 'auto',
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

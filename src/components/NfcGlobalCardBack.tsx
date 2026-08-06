import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { AppText } from '@/src/components/AppText';

type NfcGlobalCardBackProps = {
  /** Profile URL for QR code */
  profileUrl?: string;
  /** Card ID for identification */
  cardId?: string;
  width?: number;
  height?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Card color theme: 'dark' (default) or 'light' */
  theme?: 'dark' | 'light';
};

export const NfcGlobalCardBack = memo(function NfcGlobalCardBack({
  profileUrl = '',
  cardId = '',
  width,
  height,
  compact = false,
  style,
  theme = 'dark',
}: NfcGlobalCardBackProps) {
  const isLight = theme === 'light';
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;
  const qrUrl = profileUrl.trim() || `https://sitehub.app/u/${cardId || 'gennfc-7a3f'}`;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        isLight && styles.cardLight,
        cardSizeStyle,
        style,
      ]}
    >
      {/* Background Color Base */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isLight ? '#F8FAFC' : '#0A0B0E' },
        ]}
      />

      {/* Surface Gradient */}
      {isLight ? (
        <LinearGradient
          colors={['#FFFFFF', '#F1F5F9', '#E2E8F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.16)',
            'rgba(255,255,255,0.02)',
            'transparent',
            'rgba(0,240,255,0.04)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* Content Layout — Clean 2028 Professional Aesthetic */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <AppText
              style={[
                styles.brandTitle,
                compact && styles.brandTitleCompact,
                isLight && styles.textDark,
              ]}
            >
              GENNFC
            </AppText>
            <AppText
              style={[
                styles.brandSub,
                compact && styles.brandSubCompact,
                isLight && styles.textMutedDark,
              ]}
            >
              SMART IDENTIFICATION
            </AppText>
          </View>

          <View style={[styles.statusBadge, isLight && styles.statusBadgeLight]}>
            <View style={[styles.statusDot, isLight && styles.statusDotLight]} />
            <AppText style={[styles.statusText, isLight && styles.statusTextLight]}>
              ACTIVE PASS
            </AppText>
          </View>
        </View>

        {/* 2028 Sleek Encrypted Stripe Accent */}
        <View style={[styles.stripeBand, isLight && styles.stripeBandLight]}>
          <LinearGradient
            colors={
              isLight
                ? ['rgba(15,23,42,0.06)', 'rgba(15,23,42,0.02)', 'rgba(15,23,42,0.06)']
                : ['rgba(255,255,255,0.06)', 'rgba(0,240,255,0.08)', 'rgba(255,255,255,0.06)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <AppText
            style={[
              styles.stripeText,
              compact && styles.stripeTextCompact,
              isLight && styles.stripeTextLight,
            ]}
            numberOfLines={1}
          >
            GENNFC • ENCRYPTED NFC PROTOCOL • 2028 EDITION
          </AppText>
        </View>

        {/* Bottom Row — Left Instructions + Right QR */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeftContainer}>
            <AppText
              style={[
                styles.instructionTitle,
                compact && styles.instructionTitleCompact,
                isLight && styles.textDark,
              ]}
            >
              TAP OR SCAN TO CONNECT
            </AppText>

            <AppText
              style={[
                styles.supportUrl,
                compact && styles.supportUrlCompact,
                isLight && styles.textMutedDark,
              ]}
            >
              sitehub.app
            </AppText>
          </View>

          {/* Real Scannable QR Code */}
          <View style={[styles.qrContainer, compact && styles.qrContainerCompact]}>
            <View style={[styles.qrFrame, isLight && styles.qrFrameLight]}>
              <QRCode
                value={qrUrl}
                size={compact ? 44 : 64}
                color={isLight ? '#0F172A' : '#000000'}
                backgroundColor="#FFFFFF"
                quietZone={2}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

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
  cardLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(15, 23, 42, 0.12)',
    ...createShadow({ color: '#0F172A', offset: { width: 0, height: 16 }, opacity: 0.12, radius: 32, elevation: 8 }),
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 2,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3.5,
  },
  brandTitleCompact: {
    fontSize: 10,
    letterSpacing: 2,
  },
  brandSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  brandSubCompact: {
    fontSize: 7.5,
    letterSpacing: 0.8,
  },
  textDark: {
    color: '#0F172A',
  },
  textMutedDark: {
    color: 'rgba(15, 23, 42, 0.6)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  statusBadgeLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00F0FF',
  },
  statusDotLight: {
    backgroundColor: '#0284C7',
  },
  statusText: {
    color: '#00F0FF',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statusTextLight: {
    color: '#0284C7',
  },
  stripeBand: {
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  stripeBandLight: {
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  stripeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  stripeTextCompact: {
    fontSize: 7,
    letterSpacing: 1,
  },
  stripeTextLight: {
    color: 'rgba(15, 23, 42, 0.5)',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeftContainer: {
    gap: 3,
  },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  instructionTitleCompact: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  supportUrl: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9.5,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  supportUrlCompact: {
    fontSize: 7.5,
  },
  qrContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainerCompact: {},
  qrFrame: {
    padding: 3,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  qrFrameLight: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.15)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
  },
});

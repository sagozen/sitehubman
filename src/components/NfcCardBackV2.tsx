/**
 * NfcCardBackV2 — Premium SaaS Quality NFC Card Back
 * The reverse side of the NFC card, heavily featuring a custom QR code 
 * layout, magnetic stripe visual, and metadata details.
 */

import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/src/components/AppText';
import { tokens } from '@/src/design-system/tokens';

type NfcCardBackV2Props = {
  profileUrl?: string;
  cardId?: string;
  width?: number;
  height?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  theme?: 'dark' | 'light';
};

export const NfcCardBackV2 = memo(function NfcCardBackV2({
  profileUrl = 'https://gennfc.app',
  cardId = '0000 0000 0000',
  width,
  height,
  compact = false,
  style,
  theme = 'dark',
}: NfcCardBackV2Props) {
  const isLight = theme === 'light';
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;

  const baseBg = isLight ? '#F8FAFC' : '#0B0D12';
  const borderColor = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)';
  const textColor = isLight ? '#0F172A' : '#FFFFFF';
  const magStripeColor = isLight ? '#E2E8F0' : '#1A1D24';

  const qrSize = compact ? 60 : 96;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: baseBg, borderColor },
        cardSizeStyle,
        style,
      ]}
    >
      {/* Magnetic Stripe (Top) */}
      <View style={[styles.magStripe, compact && styles.magStripeCompact, { backgroundColor: magStripeColor }]} />

      <View style={styles.content}>
        {/* Left Side: Metadata */}
        <View style={styles.metadataContainer}>
          <AppText style={[styles.legalText, compact && styles.legalTextCompact, { color: textColor }]}>
            This card is issued by GENNFC. Use of this card is subject to the terms and conditions 
            of the issuer. If found, please return to the nearest GENNFC representative.
          </AppText>

          <View style={styles.signatureBox}>
            <AppText style={[styles.signatureLabel, { color: textColor }]}>AUTHORIZED SIGNATURE</AppText>
            <View style={[styles.signatureLine, { backgroundColor: isLight ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255,255,255,0.2)' }]} />
          </View>
        </View>

        {/* Right Side: QR Code */}
        <View style={styles.qrContainer}>
          <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
            <QRCode
              value={profileUrl}
              size={qrSize}
              color="#000000"
              backgroundColor="#FFFFFF"
              logoSize={compact ? 12 : 24}
              logoBackgroundColor="transparent"
            />
          </View>
          <AppText style={[styles.qrText, compact && styles.qrTextCompact, { color: textColor }]}>
            SCAN TO CONNECT
          </AppText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: tokens.radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  cardCompact: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
  },
  magStripe: {
    width: '100%',
    height: 48,
    marginTop: tokens.spacing[5],
  },
  magStripeCompact: {
    height: 24,
    marginTop: tokens.spacing[3],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: tokens.spacing[4],
  },
  metadataContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: tokens.spacing[4],
  },
  legalText: {
    fontSize: 8,
    opacity: 0.5,
    lineHeight: 12,
  },
  legalTextCompact: {
    fontSize: 5,
    lineHeight: 7,
  },
  signatureBox: {
    marginTop: 'auto',
  },
  signatureLabel: {
    fontSize: 7,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: tokens.spacing[1],
  },
  signatureLine: {
    width: '100%',
    height: 24,
    borderRadius: 2,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  qrWrapper: {
    padding: tokens.spacing[1],
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing[2],
  },
  qrText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.8,
  },
  qrTextCompact: {
    fontSize: 6,
  },
});

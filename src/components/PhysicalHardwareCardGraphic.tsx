import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AvioLogo } from '@/src/components/AvioLogo';

export type HardwareCardType = 'metal_card' | 'pvc_card' | 'premium_card' | 'custom_card' | string;

interface PhysicalHardwareCardGraphicProps {
  type: HardwareCardType;
  size?: 'sm' | 'md' | 'lg';
  cardholderName?: string;
  companyName?: string;
  style?: StyleProp<ViewStyle>;
}

export function PhysicalHardwareCardGraphic({
  type,
  size = 'sm',
  cardholderName = 'ALEXANDER WRIGHT',
  companyName = 'NFC GLOBAL',
  style,
}: PhysicalHardwareCardGraphicProps) {
  const isSm = size === 'sm';
  const isMd = size === 'md';
  const isLg = size === 'lg';

  // Base dimensions
  const width = isSm ? 104 : isMd ? 180 : 280;
  const height = isSm ? 65 : isMd ? 112 : 176;
  const borderRadius = isSm ? 6 : isMd ? 10 : 14;

  const renderCardDetails = () => {
    switch (type) {
      case 'metal_card':
        return {
          gradient: ['#28282D', '#151518', '#0B0B0D'] as const,
          borderColor: 'rgba(255, 255, 255, 0.24)',
          chipColors: ['#F5E2B3', '#D4AF37', '#997B24'] as const,
          chipBorder: '#ECCB6E',
          accentColor: '#E2E8F0',
          textColor: '#FFFFFF',
          mutedColor: 'rgba(255, 255, 255, 0.55)',
          tagText: 'AEROSPACE 304 STEEL',
          serialText: 'SERIES // 01 · 0.8mm',
          highlightSheen: true,
        };

      case 'pvc_card':
        return {
          gradient: ['#323238', '#1F1F24', '#131316'] as const,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          chipColors: ['#E2E8F0', '#94A3B8', '#475569'] as const,
          chipBorder: 'rgba(255,255,255,0.4)',
          accentColor: '#A1A1AA',
          textColor: '#F4F4F5',
          mutedColor: '#71717A',
          tagText: 'RECYCLED POLYMER',
          serialText: 'ISO/IEC 7810 · 0.76mm',
          highlightSheen: false,
        };

      case 'premium_card': // Raw Brass
        return {
          gradient: ['#F0D68B', '#C9A348', '#8A6A23', '#5E4410'] as const,
          borderColor: 'rgba(255, 245, 210, 0.65)',
          chipColors: ['#FFF6D6', '#E2C376', '#9B7A27'] as const,
          chipBorder: '#3E2F09',
          accentColor: '#2D2005',
          textColor: '#1F1703',
          mutedColor: 'rgba(31, 23, 3, 0.75)',
          tagText: 'SOLID ALLOY BRASS',
          serialText: 'LIMITED EDITION // 084',
          highlightSheen: true,
        };

      case 'custom_card': // CNC Custom / Bespoke
      default:
        return {
          gradient: ['#202422', '#111413', '#0A0C0B'] as const,
          borderColor: 'rgba(121, 154, 133, 0.55)', // Signature Sage #799A85
          chipColors: ['#A7C4B1', '#799A85', '#3E5747'] as const,
          chipBorder: '#799A85',
          accentColor: '#799A85',
          textColor: '#FFFFFF',
          mutedColor: 'rgba(121, 154, 133, 0.8)',
          tagText: 'BESPOKE CNC CARBON',
          serialText: 'DUAL NTAG424 · 3K TWILL',
          highlightSheen: true,
        };
    }
  };

  const config = renderCardDetails();

  return (
    <View
      style={[
        styles.outerWrapper,
        { width, height, borderRadius, borderColor: config.borderColor },
        style,
      ]}
    >
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardSurface, { borderRadius }]}
      >
        {/* Specular Diagonal Sheen Reflection */}
        {config.highlightSheen && (
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.8 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        {/* Top Header Row */}
        <View style={styles.headerRow}>
          {/* Hardware EMV / NFC Chip Contact Pad */}
          <LinearGradient
            colors={config.chipColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.chipContainer,
              isSm && styles.chipSm,
              isMd && styles.chipMd,
              isLg && styles.chipLg,
              { borderColor: config.chipBorder },
            ]}
          >
            {/* Chip Circuitry Grid Lines */}
            <View style={styles.chipGridHorizontal} />
            <View style={styles.chipGridVertical} />
          </LinearGradient>

          {/* Contactless / NFC Transmission Symbol */}
          <View style={styles.nfcSymbolWrap}>
            <AppIcon
              name="wifi"
              size={isSm ? 11 : isMd ? 16 : 20}
              color={config.accentColor}
              style={{ transform: [{ rotate: '90deg' }] }}
            />
          </View>
        </View>

        {/* Brand / Logo Row */}
        <View style={styles.brandRow}>
          <View style={styles.logoAndBrand}>
            <AvioLogo
              size={isSm ? 32 : isMd ? 52 : 72}
              theme={type === 'premium_card' ? 'light' : 'dark'}
              showTagline={false}
              style={[
                styles.cardAvioLogo,
                isSm && styles.cardAvioLogoSm,
                isMd && styles.cardAvioLogoMd,
                isLg && styles.cardAvioLogoLg,
              ]}
            />
            {companyName ? (
              <AppText
                style={[
                  styles.brandText,
                  { color: config.textColor },
                  isSm && styles.brandTextSm,
                  isMd && styles.brandTextMd,
                  isLg && styles.brandTextLg,
                ]}
                weight="bold"
              >
                {companyName}
              </AppText>
            ) : null}
          </View>
          <AppText
            style={[
              styles.tagText,
              { color: config.mutedColor },
              isSm && styles.tagTextSm,
              isMd && styles.tagTextMd,
              isLg && styles.tagTextLg,
            ]}
          >
            {config.tagText}
          </AppText>
        </View>

        {/* Footer Row (Cardholder & Serial) */}
        <View style={styles.footerRow}>
          <AppText
            numberOfLines={1}
            style={[
              styles.holderText,
              { color: config.textColor },
              isSm && styles.holderTextSm,
              isMd && styles.holderTextMd,
              isLg && styles.holderTextLg,
            ]}
            weight="medium"
          >
            {cardholderName.toUpperCase()}
          </AppText>
          {!isSm && (
            <AppText style={[styles.serialText, { color: config.mutedColor }]}>
              {config.serialText}
            </AppText>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  cardSurface: {
    flex: 1,
    padding: 7,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipContainer: {
    borderRadius: 3,
    borderWidth: 0.75,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSm: {
    width: 15,
    height: 11,
  },
  chipMd: {
    width: 25,
    height: 18,
  },
  chipLg: {
    width: 38,
    height: 28,
    borderRadius: 5,
  },
  chipGridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  chipGridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  nfcSymbolWrap: {
    opacity: 0.9,
  },
  brandRow: {
    marginTop: 2,
  },
  logoAndBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardAvioLogo: {
    alignSelf: 'flex-start',
  },
  cardAvioLogoSm: {
    marginBottom: 1,
  },
  cardAvioLogoMd: {
    marginBottom: 2,
  },
  cardAvioLogoLg: {
    marginBottom: 4,
  },
  brandText: {
    letterSpacing: 1.2,
  },
  brandTextSm: {
    fontSize: 7.5,
  },
  brandTextMd: {
    fontSize: 11,
  },
  brandTextLg: {
    fontSize: 15,
  },
  tagText: {
    letterSpacing: 0.8,
  },
  tagTextSm: {
    fontSize: 5.5,
    marginTop: 1,
  },
  tagTextMd: {
    fontSize: 8,
    marginTop: 2,
  },
  tagTextLg: {
    fontSize: 10,
    marginTop: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  holderText: {
    letterSpacing: 0.6,
  },
  holderTextSm: {
    fontSize: 6.5,
  },
  holderTextMd: {
    fontSize: 9.5,
  },
  holderTextLg: {
    fontSize: 12,
  },
  serialText: {
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
});

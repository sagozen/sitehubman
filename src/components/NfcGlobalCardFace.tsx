import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

const CARD_GRADIENT = ['#111111', '#202124', '#2596BE'] as const;

type NfcGlobalCardFaceProps = {
  fullName?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  /** When provided, renders a real scannable QR code instead of the icon */
  profileUrl?: string;
  width?: number;
  height?: number;
  compact?: boolean;
  backgroundImageUri?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function NfcGlobalCardFace({
  fullName = '',
  title = '',
  company = '',
  phone = '',
  email = '',
  website = '',
  profileUrl = '',
  width,
  height,
  compact = false,
  backgroundImageUri,
  style,
}: NfcGlobalCardFaceProps) {
  const displayName = fullName.trim() || 'Your Name';
  const roleLine = [title.trim(), company.trim()].filter(Boolean).join(' / ');
  const phoneLine = phone.trim() || '+1 (555) 123-4567';
  const emailLine = email.trim() || 'hello@nfcglobal.com';
  const webLine = website.trim() || 'nfcglobal.com';
  const cardSizeStyle = width ? { width, height: height ?? width / 1.586 } : undefined;
  const qrSize = compact ? 26 : 36;

  return (
    <View style={[styles.card, compact && styles.cardCompact, cardSizeStyle, style]}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {backgroundImageUri?.trim() ? (
        <>
          <Image source={{ uri: backgroundImageUri.trim() }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(24,127,196,0.52)', 'rgba(37,150,190,0.64)', 'rgba(0,0,0,0.34)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
      <View style={styles.top}>
        <View style={styles.brand}>
          <View style={[styles.logo, compact && styles.logoCompact]}>
            <AppText style={[styles.logoText, compact && styles.logoTextCompact]}>N</AppText>
          </View>
          <View style={styles.brandCopy}>
            <AppText style={[styles.brandName, compact && styles.brandNameCompact]} numberOfLines={1}>
              NFC GLOBAL
            </AppText>
            <AppText style={[styles.brandSub, compact && styles.brandSubCompact]} numberOfLines={1}>
              {roleLine || 'Verified identity'}
            </AppText>
          </View>
        </View>
        <View style={[styles.check, compact && styles.checkCompact]}>
          <AppIcon name="BadgeCheck" size={compact ? 13 : 17} color="#FFFFFF" />
        </View>
      </View>

      <View style={[styles.person, compact && styles.personCompact]}>
        <AppText style={[styles.personName, compact && styles.personNameCompact]} numberOfLines={1} adjustsFontSizeToFit>
          {displayName}
        </AppText>
      </View>

      {/* NFC wave icon — Solar icon, subtle opacity */}
      <View style={[styles.nfcMark, compact && styles.nfcMarkCompact]} pointerEvents="none">
        <AppIcon
          name="Nfc"
          size={compact ? 22 : 32}
          color="rgba(255,255,255,0.28)"
        />
      </View>

      <View style={[styles.bottom, compact && styles.bottomCompact]}>
        <View style={styles.info}>
          <ContactLine icon="Phone" text={phoneLine} compact={compact} />
          <ContactLine icon="Mail" text={emailLine} compact={compact} />
          <ContactLine icon="Link" text={webLine} compact={compact} />
        </View>
        {/* QR tile — real scannable QR when profileUrl is provided, icon fallback otherwise */}
        <View style={[styles.qr, compact && styles.qrCompact]}>
          {profileUrl ? (
            <QRCode
              value={profileUrl}
              size={qrSize}
              color="#111111"
              backgroundColor="#FFFFFF"
              quietZone={2}
            />
          ) : (
            <AppIcon
              name="QrCode"
              size={compact ? 22 : 32}
              color="#111111"
            />
          )}
        </View>
      </View>
    </View>
  );
}

function ContactLine({
  icon,
  text,
  compact,
}: {
  icon: 'Phone' | 'Mail' | 'Link';
  text: string;
  compact: boolean;
}) {
  return (
    <View style={styles.contactLine}>
      <AppIcon name={icon} size={compact ? 7 : 10} color="rgba(255,255,255,0.92)" />
      <AppText style={[styles.contactText, compact && styles.contactTextCompact]} numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 24,
    padding: 22,
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
    padding: 13,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 6,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
    minWidth: 0,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCompact: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  logoText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 26,
  },
  logoTextCompact: {
    fontSize: 16,
    lineHeight: 19,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },
  brandNameCompact: {
    fontSize: 9.5,
    lineHeight: 12,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  brandSubCompact: {
    fontSize: 7.5,
    lineHeight: 9,
    marginTop: 1,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  person: {
    marginTop: 12,
    zIndex: 2,
    paddingRight: 52,
    paddingBottom: 52, // reserve room for bottom info rows
  },
  personCompact: {
    marginTop: 6,
    paddingRight: 34,
    paddingBottom: 28,
  },
  personName: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '900',
  },
  personNameCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
  nfcMark: {
    position: 'absolute',
    right: 20,
    top: '35%',
    zIndex: 1,
  },
  nfcMarkCompact: {
    right: 13,
    top: '33%',
  },
  bottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 2,
  },
  bottomCompact: {
    left: 13,
    right: 13,
    bottom: 11,
    gap: 7,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  contactText: {
    flex: 1,
    minWidth: 0,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600',
  },
  contactTextCompact: {
    fontSize: 7.5,
    lineHeight: 9,
  },
  qr: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCompact: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
});

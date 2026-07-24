import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { cardDesignOptions, productTypeOptions } from '@/src/constants/options';
import { iosDesign } from '@/src/design-system/ios';
import { GuestDemoPill, guestUi } from '@/src/features/guest/GuestScreenUi';
import type { ProductType } from '@/src/constants/options';
import type { CardDesign } from '@/src/types/models';

const PRODUCT_THEMES: Record<
  ProductType,
  { colors: readonly [string, string, string]; accent: string; text: string; muted: string; border: string }
> = {
  wood_card: {
    colors: ['#2A1810', '#4A2E1B', '#1E100A'],
    accent: '#D4AF37',
    text: '#F5E6D3',
    muted: 'rgba(245,230,211,0.7)',
    border: 'rgba(212,175,55,0.3)',
  },
  metal_card: {
    colors: ['#0F0F12', '#1C1D22', '#0A0A0C'],
    accent: '#E2E8F0',
    text: '#F8FAFC',
    muted: 'rgba(248,250,252,0.65)',
    border: 'rgba(255,255,255,0.15)',
  },
  pvc_card: {
    colors: ['#0A0E1A', '#131B2E', '#060911'],
    accent: '#38BDF8',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.7)',
    border: 'rgba(56,189,248,0.25)',
  },
};

export type GuestCardPreviewProps = {
  displayName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  product: ProductType;
  cardDesign: CardDesign;
};

export function GuestCardPreview({
  displayName,
  jobTitle = '',
  company = '',
  email = '',
  phone = '',
  product,
  cardDesign,
}: GuestCardPreviewProps) {
  const palette = PRODUCT_THEMES[product] || PRODUCT_THEMES.metal_card;
  const designLabel = cardDesignOptions.find((d) => d.value === cardDesign)?.label ?? 'Classic Black';
  const productLabel = productTypeOptions.find((p) => p.value === product)?.label ?? 'Card';
  const subtitle = [jobTitle.trim(), company.trim()].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrap}>
      <View style={styles.previewMeta}>
        <GuestDemoPill label="NFC CARD PREVIEW" />
        <AppText style={styles.previewMetaText}>
          {productLabel} · {designLabel}
        </AppText>
      </View>
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: palette.border }]}
      >
        {/* Top Header Row */}
        <View style={styles.cardTop}>
          <View style={styles.chipGraphic}>
            <View style={styles.chipCore} />
            <View style={styles.chipGrid} />
          </View>
          <View style={styles.nfcWrap}>
            <AppIcon name="Nfc" size={22} color={palette.accent} />
          </View>
        </View>

        {/* Middle Card Name & Title */}
        <View style={styles.cardMid}>
          <AppText style={[styles.cardBrand, { color: palette.accent }]}>SITEHUB NFC</AppText>
          <AppText style={[styles.cardName, { color: palette.text }]} numberOfLines={1}>
            {(displayName.trim() || 'YOUR NAME').toUpperCase()}
          </AppText>
          {subtitle ? (
            <AppText style={[styles.cardSubtitle, { color: palette.muted }]} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {/* Bottom Contact Details */}
        <View style={styles.cardBottom}>
          <View style={styles.contactCol}>
            {email.trim() ? (
              <AppText style={[styles.cardContact, { color: palette.muted }]} numberOfLines={1}>
                {email.trim()}
              </AppText>
            ) : null}
            {phone.trim() ? (
              <AppText style={[styles.cardContact, { color: palette.muted }]} numberOfLines={1}>
                {phone.trim()}
              </AppText>
            ) : null}
            {!email.trim() && !phone.trim() ? (
              <AppText style={[styles.cardCompany, { color: palette.muted }]} numberOfLines={1}>
                {company.trim() || 'SiteHub NFC Digital Card'}
              </AppText>
            ) : null}
          </View>
          <View style={styles.cardFeatures}>
            <AppIcon name="QrCode" size={16} color={palette.accent} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: iosDesign.spacing.sm },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  previewMetaText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    aspectRatio: 1.586,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipGraphic: {
    width: 44,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  chipCore: {
    width: 24,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipGrid: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  nfcWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardMid: { gap: 4, marginTop: 12 },
  cardBrand: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  cardName: { fontSize: 21, fontWeight: '800', letterSpacing: 1.2 },
  cardSubtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  contactCol: { flex: 1, gap: 2 },
  cardCompany: { fontSize: 12, fontWeight: '600' },
  cardContact: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  cardFeatures: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});

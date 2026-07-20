import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { PAYMENT_BRAND_LOGO_LIST } from '@/src/constants/paymentAssets';
import { iosDesign } from '@/src/design-system/ios';

type Props = {
  logoSize?: number;
  gap?: number;
};

function BrandLogoChip({
  label,
  source,
  logoSize,
}: {
  label: string;
  source: (typeof PAYMENT_BRAND_LOGO_LIST)[number]['source'];
  logoSize: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={[styles.chip, { width: logoSize + 8, height: logoSize + 8 }]}>
      {failed ? (
        <AppText style={styles.chipLabel} numberOfLines={1}>
          {label.split(' ')[0]}
        </AppText>
      ) : (
        <Image
          source={source}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
          accessibilityLabel={label}
          accessibilityIgnoresInvertColors
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

/** Row of Cambodia wallet / bank brand logos from /assets/payments/. */
export function PaymentBrandStrip({ logoSize = 36, gap = iosDesign.spacing.sm }: Props) {
  return (
    <View style={[styles.row, { gap }]}>
      {PAYMENT_BRAND_LOGO_LIST.map((brand) => (
        <BrandLogoChip key={brand.key} label={brand.label} source={brand.source} logoSize={logoSize} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: iosDesign.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 4,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
});

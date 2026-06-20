import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { CloudinaryImage } from '@/src/components/CloudinaryImage';
import {
  getProductPhotoFallback,
  getProductPhotoUrl,
  productShowcaseItems,
  type ProductPhotoId,
} from '@/src/constants/productPhotoCatalog';
import { BrandImage } from '@/src/components/BrandImage';
import { iosDesign } from '@/src/design-system/ios';
import { isCloudinaryConfigured } from '@/src/utils/cloudinaryConfig';

type Props = {
  title?: string;
  subtitle?: string;
};

/** Horizontal product gallery — NFC cards, materials, QR backup. */
export function ProductShowcaseSection({
  title = 'NFC card collection',
  subtitle = 'Premium materials · tap-ready chips · QR backup on every card',
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>{subtitle}</AppText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {productShowcaseItems.map((item) => (
          <ProductTile key={item.id} id={item.id} title={item.title} subtitle={item.subtitle} />
        ))}
      </ScrollView>
    </View>
  );
}

function ProductTile({
  id,
  title,
  subtitle,
}: {
  id: ProductPhotoId;
  title: string;
  subtitle: string;
}) {
  const url = getProductPhotoUrl(id, 480);
  const fallback = getProductPhotoFallback(id);

  return (
    <View style={styles.tile}>
      <View style={styles.imageWrap}>
        {url && isCloudinaryConfigured() ? (
          <CloudinaryImage uri={url} width={480} height={300} crop="cover" style={styles.image} />
        ) : fallback ? (
          <BrandImage source={fallback} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
      </View>
      <AppText style={styles.tileTitle} numberOfLines={1}>
        {title}
      </AppText>
      <AppText style={styles.tileSub} numberOfLines={2}>
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: iosDesign.spacing.sm,
  },
  head: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: '#64748B',
  },
  scroll: {
    gap: iosDesign.spacing.sm,
    paddingRight: iosDesign.spacing.md,
  },
  tile: {
    width: 168,
    gap: 6,
  },
  imageWrap: {
    height: 112,
    borderRadius: iosDesign.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    ...iosDesign.shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#334155',
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tileSub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    color: '#64748B',
  },
});

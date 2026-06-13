import type { ReactNode } from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandImage } from '@/src/components/BrandImage';
import { CloudinaryImage } from '@/src/components/CloudinaryImage';
import { AppText } from '@/src/components/AppText';
import type { ProductPhotoId } from '@/src/constants/productPhotoCatalog';
import { getProductPhotoUrl } from '@/src/constants/productPhotoCatalog';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';

type HeroActionProps = {
  icon: 'Search' | 'Bell';
  onPress: () => void;
  showBadge?: boolean;
};

export function SalesHeroAction({ icon, onPress, showBadge }: HeroActionProps) {
  const iconColor = icon === 'Bell' ? '#FF9500' : '#1D1D1F';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={icon === 'Search' ? 'Search orders' : 'Notifications'}
    >
      <SquircleIconTile name={icon} sizeKey="sm" iconColor={iconColor} />
      {showBadge ? <View style={styles.actionBadge} /> : null}
    </Pressable>
  );
}

type SalesCompactHeroProps = {
  statusLabel?: string;
  headline?: string;
  /** Large payout-style figure (e.g. $0.00). */
  amount?: string;
  caption?: string;
  onPress?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  unreadCount?: number;
  footerMeta?: string;
  footerPill?: string;
  photoSource?: ImageSourcePropType;
  photoUrl?: string | null;
  productPhotoId?: ProductPhotoId;
  photoCacheKey?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Payout-style dark summary card — search & bell sit in the top-right. */
export function SalesCompactHero({
  statusLabel = 'Sales Rep · Active',
  headline,
  amount,
  caption,
  onPress,
  onSearch,
  onNotifications,
  unreadCount = 0,
  footerMeta,
  footerPill,
  photoSource,
  photoUrl,
  productPhotoId,
  photoCacheKey = 'sales-hero-photo',
  children,
  style,
}: SalesCompactHeroProps) {
  const showActions = Boolean(onSearch || onNotifications);
  const showPhoto = Boolean(photoSource || photoUrl || productPhotoId);
  const resolvedPhotoUrl = photoUrl?.trim() || (productPhotoId ? getProductPhotoUrl(productPhotoId, 960) : null);

  const body = (
    <View style={styles.cardFill}>
      {resolvedPhotoUrl ? (
        <CloudinaryImage
          uri={resolvedPhotoUrl}
          width={960}
          crop="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : photoSource ? (
        <BrandImage
          source={photoSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={photoCacheKey}
        />
      ) : null}
      <LinearGradient
        colors={
          showPhoto
            ? ['rgba(16, 24, 39, 0.9)', 'rgba(26, 26, 46, 0.82)', 'rgba(15, 52, 64, 0.75)']
            : ['#101827', '#1A1A2E', '#0F3440']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.topHighlight} />
      <View style={styles.cardContent}>
      <View style={styles.topRow}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <AppText style={styles.statusText} numberOfLines={1}>
            {statusLabel}
          </AppText>
        </View>
        {showActions ? (
          <View style={styles.actions}>
            {onSearch ? <SalesHeroAction icon="Search" onPress={onSearch} /> : null}
            {onNotifications ? (
              <SalesHeroAction icon="Bell" onPress={onNotifications} showBadge={unreadCount > 0} />
            ) : null}
          </View>
        ) : null}
      </View>

      {headline ? (
        <AppText style={styles.headline} numberOfLines={1}>
          {headline}
        </AppText>
      ) : null}
      {amount ? (
        <AppText style={[styles.amount, !headline && styles.amountStandalone]} numberOfLines={1}>
          {amount}
        </AppText>
      ) : null}
      {caption ? (
        <AppText style={styles.caption} numberOfLines={1}>
          {caption}
        </AppText>
      ) : null}

      {children}

      {footerMeta || footerPill ? (
        <View style={styles.footer}>
          {footerMeta ? (
            <AppText style={styles.footerMeta} numberOfLines={1}>
              {footerMeta}
            </AppText>
          ) : (
            <View />
          )}
          {footerPill ? (
            <View style={styles.footerPill}>
              <AppText style={styles.footerPillText}>{footerPill}</AppText>
            </View>
          ) : null}
        </View>
      ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{body}</View>;
}

export function SalesHeroEarningsRow({
  unrealized,
  commission,
  unrealizedCount,
  commissionCount,
}: {
  unrealized: string;
  commission: string;
  unrealizedCount: number;
  commissionCount: number;
}) {
  return (
    <View style={styles.earningsRow}>
      <View style={styles.earningsCol}>
        <View style={styles.earningsColTop}>
          <AppText style={styles.earningsLabel}>Unrealized</AppText>
          <View style={styles.countPill}>
            <AppText style={styles.countPillText}>{unrealizedCount}</AppText>
          </View>
        </View>
        <AppText style={styles.earningsAmount}>{unrealized}</AppText>
      </View>
      <View style={styles.earningsDivider} />
      <View style={styles.earningsCol}>
        <View style={styles.earningsColTop}>
          <AppText style={styles.earningsLabel}>Commission</AppText>
          <View style={styles.countPill}>
            <AppText style={styles.countPillText}>{commissionCount}</AppText>
          </View>
        </View>
        <AppText style={styles.earningsAmount}>{commission}</AppText>
      </View>
    </View>
  );
}

export const salesCompactHeroStyles = StyleSheet.create({
  card: {
    borderRadius: 30,
    backgroundColor: '#101827',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 4,
  },
  cardFill: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    padding: 18,
    position: 'relative',
    zIndex: 1,
  },
  cardPressed: {
    opacity: 0.94,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    opacity: 0.82,
  },
  actionBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headline: {
    marginTop: 12,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  amount: {
    marginTop: 4,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  amountStandalone: {
    marginTop: 12,
  },
  caption: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.56)',
  },
  earningsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: 14,
  },
  earningsCol: {
    flex: 1,
    gap: 4,
  },
  earningsColTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.74)',
  },
  countPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsAmount: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  earningsDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerMeta: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  footerPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  footerPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    padding: 0,
  },
});

const styles = salesCompactHeroStyles;

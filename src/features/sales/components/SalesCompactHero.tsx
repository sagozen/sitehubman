import type { ReactNode } from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import type { ProductPhotoId } from '@/src/constants/productPhotoCatalog';
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

/** Payout-style iOS summary card — search & bell sit in the top-right. */
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

  // Photo props are still accepted for older call sites, but this compact hero
  // intentionally stays close to Apple Wallet/Settings surfaces.
  void photoSource;
  void photoUrl;
  void productPhotoId;
  void photoCacheKey;

  const body = (
    <View style={styles.cardFill}>
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
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.14)',
  },
  cardFill: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    padding: 16,
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
    backgroundColor: 'rgba(60,60,67,0.10)',
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
    backgroundColor: '#EAF3FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,122,255,0.14)',
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
    color: '#007AFF',
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
    color: '#000000',
    letterSpacing: 0,
  },
  amount: {
    marginTop: 4,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0,
  },
  amountStandalone: {
    marginTop: 12,
  },
  caption: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  earningsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.14)',
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
    color: '#6E6E73',
  },
  countPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
  },
  earningsAmount: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0,
  },
  earningsDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.16)',
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
    color: '#007AFF',
  },
  footerPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EAF3FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,122,255,0.14)',
  },
  footerPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007AFF',
  },
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.14)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    padding: 0,
  },
});

const styles = salesCompactHeroStyles;

/**
 * SalesCompactHero — Apple Wallet / iOS summary card.
 * Clean white surface, large editorial headline, SF-weight typography.
 */
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { salesUi } from './SalesScreenUi';

// ─── SalesHeroAction ──────────────────────────────────────────────────────────

type HeroActionProps = {
  icon: 'Search' | 'Bell';
  onPress: () => void;
  showBadge?: boolean;
};

export function SalesHeroAction({ icon, onPress, showBadge }: HeroActionProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [action.btn, pressed && action.pressed]}
      accessibilityRole="button"
      accessibilityLabel={icon === 'Search' ? 'Search orders' : 'Notifications'}
    >
      <View style={[action.circle, icon === 'Bell' && action.circleBell]}>
        <AppIcon
          name={icon}
          size={16}
          color={icon === 'Bell' ? salesUi.accent : salesUi.text}
        />
      </View>
      {showBadge ? <View style={action.badge} /> : null}
    </Pressable>
  );
}

const action = StyleSheet.create({
  btn: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: salesUi.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBell: {
    backgroundColor: salesUi.orangeSoft,
    borderColor: 'rgba(255,149,0,0.2)',
  },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: salesUi.red,
    borderWidth: 1.5,
    borderColor: salesUi.surface,
  },
});

// ─── SalesCompactHero ─────────────────────────────────────────────────────────

export type SalesCompactHeroProps = {
  statusLabel?: string;
  headline?: string;
  /** Large display number e.g. $0.00 */
  amount?: string;
  caption?: string;
  onPress?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  unreadCount?: number;
  footerMeta?: string;
  footerPill?: string;
  /** Extra content inserted between caption and footer */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  // legacy props kept for backward compatibility — intentionally unused
  photoSource?: unknown;
  photoUrl?: unknown;
  productPhotoId?: unknown;
  photoCacheKey?: unknown;
};

export function SalesCompactHero({
  statusLabel = 'Sales · Active',
  headline,
  amount,
  caption,
  onPress,
  onSearch,
  onNotifications,
  unreadCount = 0,
  footerMeta,
  footerPill,
  children,
  style,
}: SalesCompactHeroProps) {
  const showActions = Boolean(onSearch || onNotifications);

  const body = (
    <View style={hero.fill}>
      {/* Top shimmer line */}
      <View pointerEvents="none" style={hero.shimmer} />

      <View style={hero.content}>
        {/* Row 1: status pill + actions */}
        <View style={hero.topRow}>
          <View style={hero.statusPill}>
            <View style={hero.statusDot} />
            <AppText style={hero.statusText} numberOfLines={1}>
              {statusLabel}
            </AppText>
          </View>
          {showActions ? (
            <View style={hero.actions}>
              {onSearch ? (
                <SalesHeroAction icon="Search" onPress={onSearch} />
              ) : null}
              {onNotifications ? (
                <SalesHeroAction
                  icon="Bell"
                  onPress={onNotifications}
                  showBadge={unreadCount > 0}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Headline */}
        {headline ? (
          <AppText style={hero.headline} numberOfLines={1}>
            {headline}
          </AppText>
        ) : null}

        {/* Display amount (Stocks / Wallet style) */}
        {amount ? (
          <AppText
            style={[hero.amount, !headline && hero.amountAlone]}
            numberOfLines={1}
          >
            {amount}
          </AppText>
        ) : null}

        {/* Caption */}
        {caption ? (
          <AppText style={hero.caption} numberOfLines={1}>
            {caption}
          </AppText>
        ) : null}

        {/* Slot for EarningsRow / search bar / etc. */}
        {children}

        {/* Footer */}
        {footerMeta || footerPill ? (
          <View style={hero.footer}>
            {footerMeta ? (
              <AppText style={hero.footerMeta} numberOfLines={1}>
                {footerMeta}
              </AppText>
            ) : (
              <View />
            )}
            {footerPill ? (
              <View style={hero.footerPill}>
                <AppText style={hero.footerPillText}>{footerPill}</AppText>
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
        style={({ pressed }) => [hero.card, style, pressed && hero.cardPressed]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[hero.card, style]}>{body}</View>;
}

// ─── SalesHeroEarningsRow ─────────────────────────────────────────────────────

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
    <View style={earnings.wrap}>
      <EarningsCol
        label="Unrealized"
        amount={unrealized}
        count={unrealizedCount}
        countColor={salesUi.accent}
      />
      <View style={earnings.divider} />
      <EarningsCol
        label="Commission"
        amount={commission}
        count={commissionCount}
        countColor={salesUi.green}
      />
    </View>
  );
}

function EarningsCol({
  label,
  amount,
  count,
  countColor,
}: {
  label: string;
  amount: string;
  count: number;
  countColor: string;
}) {
  return (
    <View style={earnings.col}>
      <View style={earnings.colTop}>
        <AppText style={earnings.label}>{label}</AppText>
        <View style={[earnings.countPill, { borderColor: countColor + '33' }]}>
          <AppText style={[earnings.countText, { color: countColor }]}>{count}</AppText>
        </View>
      </View>
      <AppText style={earnings.amount}>{amount}</AppText>
    </View>
  );
}

const earnings = StyleSheet.create({
  wrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    backgroundColor: salesUi.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 14,
  },
  col: { flex: 1, gap: 4 },
  colTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  countPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: salesUi.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },
  amount: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: salesUi.text,
    letterSpacing: -0.5,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: salesUi.border,
    marginHorizontal: 14,
    marginVertical: 2,
  },
});

// ─── Shared styles also exported for screens ─────────────────────────────────

export const salesCompactHeroStyles = StyleSheet.create({
  // convenience alias used by SalesOrdersScreen
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: salesUi.bg,
    borderRadius: salesUi.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: salesUi.text,
    padding: 0,
  },
  // hero card — re-exported so external code can reference dimensions
  card: {
    borderRadius: 20,
    backgroundColor: salesUi.surface,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadowMd,
  },
});

// internal hero styles
const hero = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: salesUi.surface,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadowMd,
  },
  cardPressed: { opacity: 0.94 },
  fill: { position: 'relative', overflow: 'hidden' },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 2,
  },
  content: {
    padding: 18,
    position: 'relative',
    zIndex: 1,
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
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: salesUi.blueSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,122,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: salesUi.green,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: salesUi.blue,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headline: {
    marginTop: 12,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    color: salesUi.text,
    letterSpacing: 0.35,
  },
  amount: {
    marginTop: 4,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    color: salesUi.text,
    letterSpacing: -1,
  },
  amountAlone: { marginTop: 14 },
  caption: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: salesUi.muted,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: salesUi.border,
  },
  footerMeta: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: salesUi.blue,
  },
  footerPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: salesUi.orangeSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,149,0,0.2)',
  },
  footerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.accent,
  },
});

/**
 * SalesGreetingHero — greeting header with earnings.
 * Time-aware greeting, earnings display, action shortcuts.
 *
 * Performance: uses native-driver animations only (opacity/translateY).
 * No JS-thread animations. No Animated.Value.__getValue() calls.
 */
import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { salesUi } from './SalesScreenUi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤' };
  return { text: 'Good evening', emoji: '🌙' };
}

function formatDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

type QuickAction = {
  icon: Parameters<typeof AppIcon>[0]['name'];
  label: string;
  onPress: () => void;
  badge?: number;
};

type Props = {
  displayName?: string;
  totalRealized: number;
  totalUnrealized: number;
  paidCount: number;
  unpaidCount: number;
  quickActions?: QuickAction[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesGreetingHero = memo(function SalesGreetingHero({
  displayName = 'Sales',
  totalRealized,
  totalUnrealized,
  paidCount,
  unpaidCount,
  quickActions = [],
}: Props) {
  const greeting = getGreeting();
  const firstName = displayName.split(' ')[0];

  // Single entrance animation on mount — native driver, no JS thread
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  return (
    <Animated.View
      style={[
        hero.card,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View pointerEvents="none" style={hero.shimmer} />
      <View style={hero.content}>

        {/* Greeting row */}
        <View style={hero.topRow}>
          <View style={hero.greetingBlock}>
            <AppText style={hero.greeting}>
              {greeting.text} {greeting.emoji}
            </AppText>
            <AppText style={hero.name} numberOfLines={1}>{firstName}</AppText>
            <AppText style={hero.date}>{formatDate()}</AppText>
          </View>
          <View style={hero.onlinePill}>
            <View style={hero.onlineDot} />
            <AppText style={hero.onlineText}>Active</AppText>
          </View>
        </View>

        {/* Earnings */}
        <View style={hero.earningsSection}>
          <View style={hero.earningsBlock}>
            <AppText style={hero.earningsLabel}>COMMISSION EARNED</AppText>
            <View style={hero.earningsRow}>
              <AppText style={hero.earningsBig}>
                ${totalRealized.toFixed(2)}
              </AppText>
              {paidCount > 0 ? (
                <View style={hero.paidBadge}>
                  <AppText style={hero.paidBadgeText}>{paidCount} paid</AppText>
                </View>
              ) : null}
            </View>
          </View>
          <View style={hero.earningsDivider} />
          <View style={hero.earningsBlock}>
            <AppText style={hero.earningsLabel}>PIPELINE VALUE</AppText>
            <View style={hero.earningsRow}>
              <AppText style={[hero.earningsBig, hero.earningsMuted]}>
                ${totalUnrealized.toFixed(2)}
              </AppText>
              {unpaidCount > 0 ? (
                <View style={hero.pendingBadge}>
                  <AppText style={hero.pendingBadgeText}>{unpaidCount} pending</AppText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Quick actions */}
        {quickActions.length > 0 ? (
          <View style={hero.quickActions}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [hero.qaBtn, pressed && hero.qaBtnPressed]}
                onPress={action.onPress}
              >
                <View style={hero.qaIconWrap}>
                  <AppIcon name={action.icon} size={15} color={salesUi.surface} />
                  {action.badge && action.badge > 0 ? (
                    <View style={hero.qaBadge}>
                      <AppText style={hero.qaBadgeText}>
                        {action.badge > 99 ? '99+' : String(action.badge)}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText style={hero.qaLabel} numberOfLines={1}>{action.label}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

      </View>
    </Animated.View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const hero = StyleSheet.create({
  card: {
    backgroundColor: salesUi.surface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    overflow: 'hidden',
    ...salesUi.shadowMd,
  },
  shimmer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 2,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingBlock: { gap: 1, flex: 1, minWidth: 0 },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: salesUi.muted,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: salesUi.text,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: salesUi.muted,
    marginTop: 2,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: salesUi.greenSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.25)',
    marginLeft: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: salesUi.green,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.green,
  },
  earningsSection: {
    flexDirection: 'row',
    backgroundColor: salesUi.bg,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 14,
  },
  earningsBlock: { flex: 1, gap: 5 },
  earningsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: salesUi.muted,
    letterSpacing: 0.8,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  earningsBig: {
    fontSize: 22,
    fontWeight: '700',
    color: salesUi.text,
    letterSpacing: -0.5,
  },
  earningsMuted: { color: salesUi.muted },
  earningsDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: salesUi.border,
    marginHorizontal: 14,
    alignSelf: 'stretch',
  },
  paidBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: salesUi.greenSoft,
  },
  paidBadgeText: { fontSize: 9, fontWeight: '800', color: salesUi.green },
  pendingBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: salesUi.orangeSoft,
  },
  pendingBadgeText: { fontSize: 9, fontWeight: '800', color: salesUi.accent },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  qaBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: salesUi.accent,
    borderRadius: salesUi.radiusSm,
  },
  qaBtnPressed: { opacity: 0.8 },
  qaIconWrap: { position: 'relative' },
  qaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.surface,
  },
  qaBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: salesUi.red,
    borderWidth: 1.5,
    borderColor: salesUi.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  qaBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
});

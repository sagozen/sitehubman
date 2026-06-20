/**
 * SalesGreetingHero — animated greeting header with earnings display.
 * Time-aware greeting, animated number reveal, action shortcuts.
 * Feels like Apple's native finance/health apps.
 */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: value,
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <Animated.Text
      style={hero.bigNumber}
    >
      {prefix}
      <Animated.Text>
        {animVal.__getValue().toFixed(2)}
      </Animated.Text>
    </Animated.Text>
  );
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

export function SalesGreetingHero({
  displayName = 'Sales',
  totalRealized,
  totalUnrealized,
  paidCount,
  unpaidCount,
  quickActions = [],
}: Props) {
  const greeting = getGreeting();

  // Fade in entire card
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(cardY, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  const firstName = displayName.split(' ')[0];

  return (
    <Animated.View style={[hero.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
      {/* Top shimmer */}
      <View pointerEvents="none" style={hero.shimmer} />

      <View style={hero.content}>
        {/* Greeting row */}
        <View style={hero.topRow}>
          <View style={hero.greetingBlock}>
            <AppText style={hero.greeting}>
              {greeting.text}{' '}
              <AppText style={hero.greetingEmoji}>{greeting.emoji}</AppText>
            </AppText>
            <AppText style={hero.name} numberOfLines={1}>{firstName}</AppText>
            <AppText style={hero.date}>{formatDate()}</AppText>
          </View>

          {/* Status pill */}
          <View style={hero.onlinePill}>
            <View style={hero.onlineDot} />
            <AppText style={hero.onlineText}>Active</AppText>
          </View>
        </View>

        {/* Earnings section */}
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

          {/* Divider */}
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
}

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

  // Greeting
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingBlock: { gap: 1 },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: salesUi.muted,
  },
  greetingEmoji: { fontSize: 14 },
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
  bigNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: salesUi.accent,
    letterSpacing: -0.5,
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

  // Earnings
  earningsSection: {
    flexDirection: 'row',
    backgroundColor: salesUi.bg,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 14,
    gap: 0,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.2)',
  },
  paidBadgeText: { fontSize: 9, fontWeight: '800', color: salesUi.green },
  pendingBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: salesUi.orangeSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,149,0,0.2)',
  },
  pendingBadgeText: { fontSize: 9, fontWeight: '800', color: salesUi.accent },

  // Quick actions
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
  qaBtnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
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

import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useNotifications } from '@/src/hooks/useNotifications';
import { usePreferences } from '@/src/hooks/usePreferences';
import React, { memo } from 'react';
import { HapticTap } from '@/src/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface NotificationCardProps {
  item: any;
  index: number;
  isDark: boolean;
  onPress: () => void;
}

const NotificationItem = memo(function NotificationItem({
  item,
  index,
  isDark,
  onPress,
}: NotificationCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 45).springify().damping(18).stiffness(220)}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 16, stiffness: 360 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1.0, { damping: 14, stiffness: 280 });
        }}
        onPress={() => {
          HapticTap.light();
          onPress();
        }}
        style={[
          styles.glassCard,
          {
            backgroundColor: isDark
              ? item.isRead
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(10, 132, 255, 0.12)'
              : item.isRead
                ? 'rgba(255, 255, 255, 0.85)'
                : 'rgba(0, 122, 255, 0.08)',
            borderColor: isDark
              ? item.isRead
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(10, 132, 255, 0.35)'
              : item.isRead
                ? 'rgba(0, 0, 0, 0.06)'
                : 'rgba(0, 122, 255, 0.25)',
          },
        ]}
      >
        {/* Left Icon Accent Box */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: !item.isRead
                ? 'rgba(10, 132, 255, 0.2)'
                : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <AppIcon
            name={!item.isRead ? 'Bell' : 'CheckCircle'}
            size={22}
            color={!item.isRead ? '#0A84FF' : isDark ? '#8E8E93' : '#636366'}
            variant="solar-bold"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textBox}>
          <View style={styles.badgeLine}>
            <AppText
              style={[
                styles.subText,
                { color: !item.isRead ? '#0A84FF' : isDark ? '#8E8E93' : '#8E8E93' },
              ]}
            >
              {formatDate(item.createdAt)} • {item.isRead ? 'READ' : 'NEW'}
            </AppText>
          </View>
          <AppText
            style={[
              styles.titleText,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {item.title}
          </AppText>
          {item.message ? (
            <AppText
              style={[
                styles.msgText,
                { color: isDark ? 'rgba(235, 235, 245, 0.7)' : 'rgba(60, 60, 67, 0.7)' },
              ]}
              numberOfLines={2}
            >
              {item.message}
            </AppText>
          ) : null}
        </View>

        {/* Right Status Dot */}
        {!item.isRead ? (
          <View style={styles.liveDot} />
        ) : (
          <AppIcon
            name="ChevronRight"
            size={18}
            color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
            variant="solar-bold"
          />
        )}
      </Pressable>
    </Animated.View>
  );
});

export function CustomerNotificationsScreen() {
  const { items, unreadCount, markRead, error } = useNotifications();
  const { isDark } = usePreferences();

  const bellAnim = useSharedValue(0);

  React.useEffect(() => {
    bellAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 1800 }),
      ),
      -1,
    );
  }, []);

  const emptyBellStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(bellAnim.value, [0, 1], [0, -6], Extrapolation.CLAMP),
      },
    ],
  }));

  const bg = isDark
    ? (['#000000', '#07090E', '#0D1017'] as const)
    : (['#F4F7FB', '#FAFCFF', '#FFFFFF'] as const);

  return (
    <LinearGradient colors={bg} style={StyleSheet.absoluteFill}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <IosScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header ── */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
            <Pressable
              onPress={() => {
                HapticTap.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.back,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <AppIcon
                name="ChevronLeft"
                size={22}
                color={isDark ? '#FFFFFF' : '#000000'}
                variant="solar-bold"
              />
            </Pressable>

            <View style={styles.headerCopy}>
              <AppText style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Notifications
              </AppText>
              <AppText style={styles.subtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                  : 'All caught up'}
              </AppText>
            </View>

            {/* Inbox Badge Pill */}
            <View
              style={[
                styles.inboxBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(10, 132, 255, 0.15)'
                    : 'rgba(0, 122, 255, 0.1)',
                  borderColor: isDark
                    ? 'rgba(10, 132, 255, 0.3)'
                    : 'rgba(0, 122, 255, 0.2)',
                },
              ]}
            >
              <AppIcon name="Inbox" size={16} color="#0A84FF" variant="solar-bold" />
              <View style={styles.neonBadgePill}>
                <AppText style={styles.neonBadgeNum}>
                  {unreadCount > 0 ? unreadCount : items.length}
                </AppText>
              </View>
            </View>
          </Animated.View>

          {error ? <AppText style={styles.error}>{error}</AppText> : null}

          {/* ── Notification List ── */}
          <View style={styles.listContainer}>
            {items.length === 0 ? (
              <Animated.View entering={FadeInUp.delay(80).springify()} style={{ gap: 16 }}>
                {/* System Ready Card */}
                <View
                  style={[
                    styles.glassCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(255, 255, 255, 0.85)',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.iconBox,
                      { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
                      emptyBellStyle,
                    ]}
                  >
                    <AppIcon name="Inbox" size={24} color="#30D158" variant="solar-bold" />
                  </Animated.View>
                  <View style={styles.textBox}>
                    <AppText style={[styles.subText, { color: '#30D158' }]}>
                      SYSTEM STATUS • ACTIVE
                    </AppText>
                    <AppText
                      style={[
                        styles.titleText,
                        { color: isDark ? '#FFFFFF' : '#000000' },
                      ]}
                    >
                      Your Inbox is Ready
                    </AppText>
                    <AppText
                      style={[
                        styles.msgText,
                        { color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)' },
                      ]}
                    >
                      NFC card taps, contact exchanges, and order updates will appear here instantly.
                    </AppText>
                  </View>
                </View>

                {/* SnapTap Studio CTA Card */}
                <Pressable
                  onPress={() => {
                    HapticTap.medium();
                    router.push('/studio' as any);
                  }}
                  style={({ pressed }) => [
                    styles.glassCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(10, 132, 255, 0.1)'
                        : 'rgba(0, 122, 255, 0.08)',
                      borderColor: isDark
                        ? 'rgba(10, 132, 255, 0.3)'
                        : 'rgba(0, 122, 255, 0.2)',
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: 'rgba(10, 132, 255, 0.2)' },
                    ]}
                  >
                    <AppIcon name="Wand2" size={24} color="#0A84FF" variant="solar-bold" />
                  </View>
                  <View style={styles.textBox}>
                    <AppText style={[styles.subText, { color: '#0A84FF' }]}>
                      DESIGN & CUSTOMIZE
                    </AppText>
                    <AppText
                      style={[
                        styles.titleText,
                        { color: isDark ? '#FFFFFF' : '#000000' },
                      ]}
                    >
                      Card Studio
                    </AppText>
                    <AppText
                      style={[
                        styles.msgText,
                        { color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)' },
                      ]}
                    >
                      Customize your layout, color schemes, and NFC smart tap triggers.
                    </AppText>
                  </View>
                  <AppIcon name="ArrowRight" size={20} color="#0A84FF" variant="solar-bold" />
                </Pressable>
              </Animated.View>
            ) : (
              items.map((item, index) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  index={index}
                  isDark={isDark}
                  onPress={() => void markRead(item.id)}
                />
              ))
            )}
          </View>
        </IosScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },

  inboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  neonBadgePill: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neonBadgeNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  listContainer: { gap: 12 },
  glassCard: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
    gap: 3,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A84FF',
  },
  error: { color: '#FF3B30', fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});

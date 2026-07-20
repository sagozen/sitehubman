import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useNotifications } from '@/src/hooks/useNotifications';
import React from 'react';
import { HapticTap } from '@/src/utils/haptics';

const INK = '#111111';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const BRAND = '#0071E3';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CustomerNotificationsScreen() {
  const { items, unreadCount, markRead, error } = useNotifications();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              HapticTap.light();
              router.back();
            }}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <AppIcon name="ChevronLeft" size={22} color={INK} variant="solar-bold" />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Notifications</AppText>
            <AppText style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
            </AppText>
          </View>

          {/* Inbox Badge Pill Button (Example 1) */}
          <View style={styles.inboxBtn}>
            <AppIcon name="Inbox" size={16} color="#FFFFFF" variant="solar-bold" />
            <AppText style={styles.inboxBtnText}>Inbox</AppText>
            <View style={styles.neonBadgePill}>
              <AppText style={styles.neonBadgeNum}>
                {unreadCount > 0 ? unreadCount : items.length}
              </AppText>
            </View>
          </View>
        </View>

        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        {/* ── Notification List (Ocean / Marine Fluid Cards) ── */}
        <View style={styles.listContainer}>
          {items.length === 0 ? (
            <View style={{ gap: 16 }}>
              {/* System Ready Card */}
              <View style={styles.oceanCard}>
                <View style={styles.iconBox}>
                  <AppIcon name="Inbox" size={32} color="#00C7BE" variant="solar-bold" />
                </View>
                <View style={styles.textBox}>
                  <AppText style={styles.subText}>SYSTEM STATUS • ACTIVE</AppText>
                  <AppText style={styles.titleText}>Your Inbox is Ready</AppText>
                  <AppText style={styles.msgText}>
                    NFC card taps, lead captures, and order updates will appear here instantly.
                  </AppText>
                </View>
                <View style={styles.oceanDotBadge}>
                  <AppText style={styles.oceanDotText}>LIVE</AppText>
                </View>
              </View>

              {/* SnapTap Studio CTA Button */}
              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  router.push('/studio' as any);
                }}
                style={({ pressed }) => [
                  styles.oceanCard,
                  { backgroundColor: '#0D9488' },
                  pressed && styles.oceanCardPressed,
                ]}
              >
                <View style={styles.iconBox}>
                  <AppIcon name="Wand2" size={32} color="#FFFFFF" variant="solar-bold" />
                </View>
                <View style={styles.textBox}>
                  <AppText style={styles.subText}>CREATE & CUSTOMIZE ON THE</AppText>
                  <AppText style={styles.titleText}>SnapTap Studio</AppText>
                </View>
                <AppIcon name="ArrowRight" size={24} color="#FFFFFF" variant="solar-bold" />
              </Pressable>
            </View>
          ) : (
            items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  HapticTap.light();
                  void markRead(item.id);
                }}
                style={({ pressed }) => [
                  styles.oceanCard,
                  !item.isRead && styles.oceanCardUnread,
                  pressed && styles.oceanCardPressed,
                ]}
              >
                {/* Left Icon (w-8 h-8 / size 32) */}
                <View style={styles.iconBox}>
                  <AppIcon
                    name={!item.isRead ? 'Bell' : 'CheckCircle'}
                    size={32}
                    color={!item.isRead ? '#00C7BE' : '#FFFFFF'}
                    variant="solar-bold"
                  />
                </View>

                {/* Text Left Layout */}
                <View style={styles.textBox}>
                  <AppText style={styles.subText}>
                    {formatDate(item.createdAt)} • {item.isRead ? 'READ' : 'NEW UPDATE'}
                  </AppText>
                  <AppText style={styles.titleText}>{item.title}</AppText>
                  {item.message ? (
                    <AppText style={styles.msgText} numberOfLines={2}>
                      {item.message}
                    </AppText>
                  ) : null}
                </View>

                {/* Right Badge/Chevron */}
                {!item.isRead ? (
                  <View style={styles.oceanDotBadge}>
                    <AppText style={styles.oceanDotText}>NEW</AppText>
                  </View>
                ) : (
                  <AppIcon name="ChevronRight" size={20} color="#666666" variant="solar-bold" />
                )}
              </Pressable>
            ))
          )}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 3 },
  title: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: INK },
  subtitle: { fontSize: 14, fontWeight: '700', color: MUTED },

  // Inbox Pill Button (Example 1)
  inboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0071E3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#0071E3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  inboxBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  neonBadgePill: {
    backgroundColor: '#00C7BE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neonBadgeNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Notification List & Ocean Cards
  listContainer: { gap: 16 },
  oceanCard: {
    backgroundColor: '#0071E3',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#0071E3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  oceanCardUnread: {
    backgroundColor: '#0056D2',
    borderWidth: 1,
    borderColor: 'rgba(0, 199, 190, 0.6)',
  },
  oceanCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
    gap: 4,
  },
  subText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  msgText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontWeight: '500',
  },
  oceanDotBadge: {
    backgroundColor: '#00C7BE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oceanDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  error: { color: '#FF3B30', fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});

import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppEmptyState } from '@/src/components/AppState';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';
import { theme } from '@/src/constants/theme';
import { useNotifications } from '@/src/hooks/useNotifications';
import { usePreferences } from '@/src/hooks/usePreferences';
import type { AppNotification } from '@/src/types/models';

type StaffNotificationRole = 'sales' | 'printer';

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function priorityTone(notification: AppNotification) {
  if (notification.priority === 'high') return { color: '#FF3B30', bg: '#FFF1F0', label: 'High' };
  if (notification.priority === 'medium') return { color: '#FF9500', bg: '#FFF7ED', label: 'Medium' };
  return { color: '#007AFF', bg: '#EFF6FF', label: 'Info' };
}

export function StaffNotificationsScreen({
  role,
  subtitle,
}: {
  role: StaffNotificationRole;
  subtitle: string;
}) {
  const { colors } = usePreferences();
  const { items, unreadCount, error, markRead } = useNotifications();
  const sorted = useMemo(() => items, [items]);
  const accent = role === 'printer' ? '#007AFF' : '#FF9500';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AppIcon name="ChevronLeft" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroIconWrap}>
            <SquircleIconTile name="Bell" sizeKey="md" iconColor={accent} />
            {unreadCount > 0 ? <View style={styles.heroUnreadDot} /> : null}
          </View>
        </View>

        <AppText style={styles.heroKicker}>{subtitle}</AppText>
        <AppText style={styles.heroTitle}>Notifications</AppText>
        <AppText style={styles.heroSub}>
          {unreadCount > 0
            ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
            : 'All updates are read'}
        </AppText>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={[styles.errorBanner, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <AppIcon name="Info" size={16} color={colors.textMuted} />
            <AppText style={[styles.errorText, { color: colors.textMuted }]}>{error}</AppText>
          </View>
        ) : null}

        {sorted.length === 0 ? (
          <AppEmptyState
            title="You're all caught up"
            description="No notifications for this account yet."
            iconName="Bell"
            role={role}
          />
        ) : (
          sorted.map((notification) => {
            const tone = priorityTone(notification);
            return (
              <Pressable
                key={notification.id}
                accessibilityRole="button"
                onPress={() => void markRead(notification.id)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: notification.isRead ? colors.surface : '#FFFFFF',
                    borderColor: notification.isRead ? colors.border : 'rgba(0,122,255,0.18)',
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: tone.bg }]}>
                  <AppIcon name="Bell" size={17} color={tone.color} />
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <AppText style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {notification.title}
                    </AppText>
                    <AppText style={[styles.rowDate, { color: colors.textMuted }]}>
                      {formatDate(notification.createdAt)}
                    </AppText>
                  </View>
                  {notification.message ? (
                    <AppText style={[styles.message, { color: colors.textMuted }]} numberOfLines={2}>
                      {notification.message}
                    </AppText>
                  ) : null}
                  <View style={styles.rowFooter}>
                    <View style={[styles.priorityPill, { backgroundColor: tone.bg }]}>
                      <AppText style={[styles.priorityText, { color: tone.color }]}>{tone.label}</AppText>
                    </View>
                    {!notification.isRead ? (
                      <AppText style={[styles.unreadText, { color: accent }]}>Unread</AppText>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroTop: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrap: {
    position: 'relative',
  },
  heroUnreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  heroSub: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 14,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  rowDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  message: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  rowFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});

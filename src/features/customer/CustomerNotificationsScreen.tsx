import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useNotifications } from '@/src/hooks/useNotifications';

const INK = '#111111';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const BRAND = '#2596BE';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CustomerNotificationsScreen() {
  const { items, unreadCount, markRead, error } = useNotifications();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <AppIcon name="ChevronLeft" size={22} color={INK} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Notifications</AppText>
            <AppText style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}</AppText>
          </View>
        </View>

        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        <View style={styles.list}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <AppIcon name="Bell" size={34} color="#C7C7CC" />
              <AppText style={styles.emptyTitle}>No updates yet</AppText>
              <AppText style={styles.emptySub}>Card, order, and profile updates will appear here.</AppText>
            </View>
          ) : (
            items.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => void markRead(item.id)}
                style={({ pressed }) => [styles.row, index === items.length - 1 && styles.rowLast, pressed && styles.pressed]}
              >
                <View style={[styles.dot, !item.isRead && styles.dotUnread]} />
                <View style={styles.rowCopy}>
                  <AppText style={styles.rowTitle}>{item.title}</AppText>
                  {item.message ? <AppText style={styles.rowMsg} numberOfLines={2}>{item.message}</AppText> : null}
                </View>
                <AppText style={styles.date}>{formatDate(item.createdAt)}</AppText>
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
  content: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 120, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 3 },
  title: { fontSize: 36, lineHeight: 39, fontWeight: '900', color: INK },
  subtitle: { fontSize: 14, fontWeight: '700', color: MUTED },
  list: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden' },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(17,17,17,0.06)' },
  rowLast: { borderBottomWidth: 0 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D1D6' },
  dotUnread: { backgroundColor: BRAND },
  rowCopy: { flex: 1, gap: 3, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '900', color: INK },
  rowMsg: { fontSize: 12, fontWeight: '700', color: MUTED, lineHeight: 17 },
  date: { fontSize: 11, fontWeight: '800', color: MUTED },
  empty: { padding: 34, alignItems: 'center', gap: 9 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: INK },
  emptySub: { fontSize: 13, fontWeight: '700', color: MUTED, textAlign: 'center', lineHeight: 18 },
  error: { color: '#FF3B30', fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});

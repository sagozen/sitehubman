/**
 * CustomerConnectionsScreen — clean, matches the guest DNA. One page: simple
 * header + activity list with date-range filter. No QR/Scan/Card clutter,
 * no giant "Connections / People around your card" title.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { memo, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { formatRelative } from '@/src/services/customerConnectionsService';

// Tokens (match guest / sales)
const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const BG = '#F7F7F8';
const SURFACE = '#FFFFFF';
const ACCENT = '#FF5C8D';

type Range = 'today' | 'week' | 'all';
const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'Week' },
  { key: 'all',   label: 'All' },
];

// Icons available in AppIcon
type RowIcon = 'ScanLine' | 'Eye' | 'Users';

type ActivityRow = {
  id: string;
  icon: RowIcon;
  title: string;
  detail: string;
  count: number;
  accent: string;
  route?: string;
};

export function CustomerConnectionsScreen() {
  const { user } = useAuth();
  const { data, loading, error, refreshing, refresh } = useCustomerConnections(user);
  const [range, setRange] = useState<Range>('today');

  const firstName = (user?.displayName || 'You').split(' ')[0] || 'You';
  const initial = (firstName[0] || 'Y').toUpperCase();

  // Build activity rows from analytics + cards
  const rows: ActivityRow[] = useMemo(() => {
    if (!data) return [];
    const a = data.analytics;
    const cards = data.cards ?? [];
    const activeCards = cards.filter((c) => c.status === 'active').length;
    return [
      {
        id: 'taps',
        icon: 'Users',
        title: 'NFC taps',
        detail: 'People who tapped your card',
        count: a.totalNfcTaps,
        accent: ACCENT,
      },
      {
        id: 'qr',
        icon: 'ScanLine',
        title: 'QR scans',
        detail: 'Camera and screen scans',
        count: a.totalQrScans,
        accent: '#007AFF',
      },
      {
        id: 'views',
        icon: 'Eye',
        title: 'Profile views',
        detail: `${a.uniqueVisitors} unique visitors`,
        count: a.totalProfileViews,
        accent: '#34C759',
      },
      {
        id: 'cards',
        icon: 'Users',
        title: 'Active cards',
        detail: cards.length === 0 ? 'No cards yet' : `${cards.length} on file`,
        count: activeCards,
        accent: '#FF9500',
        route: appRoutes.guestDesign,
      },
    ];
  }, [data]);

  const lastActivity = data?.analytics?.lastActivityAt
    ? `Last activity · ${formatRelative(data.analytics.lastActivityAt)}`
    : 'No activity yet';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={INK} />
        }
      >
        {/* Header (matches dashboard / sales DNA) */}
        <View style={s.header}>
          <View style={s.userPill}>
            <View style={s.avatar}>
              <AppText style={s.avatarText}>{initial}</AppText>
            </View>
            <View>
              <AppText style={s.hello}>Customer</AppText>
              <AppText style={s.name} numberOfLines={1}>{firstName}</AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={({ pressed }) => [s.bell, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(appRoutes.scan)}
              accessibilityLabel="Scan"
            >
              <AppIcon name="ScanLine" size={20} color={INK} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.newBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
              onPress={() => router.push(appRoutes.guestDesign)}
              accessibilityLabel="Share card"
            >
              <AppText style={s.newPlus}>↗</AppText>
            </Pressable>
          </View>
        </View>

        {/* Section title + filter */}
        <View style={s.sectionHead}>
          <View>
            <AppText style={s.sectionTitle}>Activity</AppText>
            <AppText style={s.sectionSub}>{lastActivity}</AppText>
          </View>
          <FilterDropdown value={range} onChange={setRange} />
        </View>

        {/* Activity list (hairline-divided, like guest) */}
        {loading && rows.length === 0 ? (
          <View style={s.loadingWrap}>
            <AppText style={s.muted}>Loading…</AppText>
          </View>
        ) : error ? (
          <View style={s.errorCard}>
            <AppText style={s.errorText}>{error}</AppText>
          </View>
        ) : (
          <View style={s.list}>
            {rows.map((row, idx) => (
              <ActivityRowItem
                key={row.id}
                row={row}
                isLast={idx === rows.length - 1}
                onPress={() => {
                  if (row.route) {
                    router.push(row.route as any);
                  } else {
                    Alert.alert(row.title, `${row.count.toLocaleString()} ${row.detail.toLowerCase()}`);
                  }
                }}
              />
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </IosScrollView>
    </SafeAreaView>
  );
}

// ─── Filter dropdown (date-range picker) ───────────────────────────────────
function FilterDropdown({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const [open, setOpen] = useState(false);
  const current = RANGES.find((r) => r.key === value)?.label ?? 'All';

  return (
    <View>
      <Pressable
        style={({ pressed }) => [fd.btn, pressed && { opacity: 0.7 }]}
        onPress={() => setOpen((o) => !o)}
        accessibilityLabel="Filter by date"
      >
        <AppIcon name="Calendar" size={14} color={INK} />
        <AppText style={fd.btnText}>{current}</AppText>
        <View style={open ? fd.chevOpen : fd.chevClosed}>
          <AppIcon name="ChevronRight" size={12} color={MUTED} />
        </View>
      </Pressable>

      {open ? (
        <View style={fd.menu}>
          {RANGES.map((r) => (
            <Pressable
              key={r.key}
              style={[fd.menuItem, r.key === value && fd.menuItemActive]}
              onPress={() => { onChange(r.key); setOpen(false); }}
            >
              <AppText style={[fd.menuText, r.key === value && fd.menuTextActive]}>{r.label}</AppText>
              {r.key === value ? <AppIcon name="Check" size={14} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const fd = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: SURFACE, borderRadius: 999,
  },
  btnText: { fontSize: 12, fontWeight: '700', color: INK, letterSpacing: -0.1 },
  chevClosed: { transform: [{ rotate: '90deg' }] },
  chevOpen:   { transform: [{ rotate: '-90deg' }] },
  menu: {
    position: 'absolute', top: 40, right: 0,
    backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 6,
    minWidth: 120, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  menuItemActive: { backgroundColor: INK },
  menuText: { fontSize: 13, fontWeight: '600', color: INK },
  menuTextActive: { color: '#fff' },
});

// ─── Activity row (hairline divider, no box) ───────────────────────────────
const ActivityRowItem = memo(function ActivityRowItem({
  row, isLast, onPress,
}: {
  row: ActivityRow;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [ar.row, pressed && { opacity: 0.6 }]}
      onPress={onPress}
    >
      <View style={[ar.icon, { backgroundColor: `${row.accent}1F` }]}>
        <AppIcon name={row.icon} size={18} color={row.accent} />
      </View>
      <View style={ar.copy}>
        <AppText style={ar.title} numberOfLines={1}>{row.title}</AppText>
        <AppText style={ar.detail} numberOfLines={1}>{row.detail}</AppText>
      </View>
      <AppText style={ar.count}>{row.count.toLocaleString()}</AppText>
    </Pressable>
  );
});

const ar = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.08)',
  },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  detail: { fontSize: 12, fontWeight: '500', color: MUTED },
  count: { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.4 },
});

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 80 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16, paddingBottom: 4,
  },
  userPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SURFACE, paddingLeft: 6, paddingRight: 14, paddingVertical: 6,
    borderRadius: 999,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  hello: { fontSize: 11, fontWeight: '600', color: MUTED, letterSpacing: 0.4, textTransform: 'uppercase' },
  name: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: -0.2, marginTop: -1 },
  bell: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center',
  },
  newBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: INK,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: INK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  newPlus: { color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 22, marginTop: -1 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 32, marginBottom: 14,
  },
  sectionTitle: { fontSize: 28, fontWeight: '800', color: INK, letterSpacing: -0.6 },
  sectionSub: { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 4 },

  list: {},
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  muted: { fontSize: 13, fontWeight: '600', color: MUTED },

  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 16, padding: 14,
    marginTop: 8,
  },
  errorText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
});

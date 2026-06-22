import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { TapMomentCardMemo, type TapMoment, type TapMomentSource } from '@/src/components/TapMomentCard';
import { ConfettiBurst } from '@/src/components/ConfettiBurst';
import { LiveTapSuccess } from '@/src/components/LiveTapSuccess';
import { MomentDetailSheet } from '@/src/components/MomentDetailSheet';
import { SEED_MOMENTS, SEED_MOMENT_LABELS, buildSeedAnalytics, getSeedSlugUrl } from '@/src/data/seedMoments';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { formatRelative } from '@/src/services/customerConnectionsService';
import { HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

const BRAND = '#007AFF';
const MUTED = '#6E6E73';

type MomentBucket = {
  label: string;
  moments: TapMoment[];
};

type SortOrder = 'newest' | 'oldest';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'all';
type SourceFilter = 'all' | TapMomentSource;

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: '3 months' },
  { id: 'all', label: 'All time' },
];

const SOURCE_FILTERS: { id: SourceFilter; label: string; icon: AppIconName | null }[] = [
  { id: 'all', label: 'All sources', icon: null },
  { id: 'nfc', label: 'NFC', icon: 'Nfc' as AppIconName },
  { id: 'qr', label: 'QR', icon: 'QrCode' as AppIconName },
  { id: 'view', label: 'Views', icon: 'Eye' as AppIconName },
  { id: 'share', label: 'Share', icon: 'Share' as AppIconName },
];

/**
 * ConnectionsMomentsScreen - the killer feature timeline view.
 *
 * Replaces the old list-of-stats with a visual timeline of "moments" -
 * high-fidelity cards for every connection event. This is the single
 * biggest UX differentiator vs. HiHello / Popl / Linq / Mobilo / TapTap.
 *
 * Filter by date range (Today / This week / This month / 3 months / All)
 * and source (NFC / QR / Views / Share) is the primary navigation;
 * everything else (sort, follow-up, detail) supports the timeline.
 *
 * Data flows from existing `useCustomerConnections` hook so we don't
 * need to touch backend services.
 */

export function ConnectionsMomentsScreen() {
  const { data, refreshing, refresh } = useCustomerConnections(null);
  const { colors, isDark } = usePreferences();
  const [celebratingFollowUp, setCelebratingFollowUp] = useState<string | null>(null);
  const [celebratingTap, setCelebratingTap] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [activeMoment, setActiveMoment] = useState<TapMoment | null>(null);
  const [activeSlugUrl, setActiveSlugUrl] = useState<string | null>(null);

  const profile = data?.profiles?.[0];
  const publicUrl = profile?.slug ? buildSlugProfileUrl(profile.slug) : null;
  const seedAnalytics = useMemo(() => buildSeedAnalytics(), []);
  const analytics = data?.analytics ?? seedAnalytics;
  const profileHost = useMemo(() => {
    if (publicUrl) {
      try {
        const u = new URL(publicUrl);
        return `${u.protocol}//${u.host}`;
      } catch {
        return 'https://sitehub.app';
      }
    }
    return 'https://sitehub.app';
  }, [publicUrl]);

  /**
   * Apply date-range + source filter first (cheap), then sort (O(n log n)).
   * Keeping the filter pipeline simple makes the timeline feel instant
   * even with hundreds of moments in memory.
   */
  const filteredMoments = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const cutoff =
      dateRange === 'today' ? now - day
      : dateRange === 'week' ? now - 7 * day
      : dateRange === 'month' ? now - 30 * day
      : dateRange === 'quarter' ? now - 90 * day
      : 0;
    return SEED_MOMENTS.filter((moment) => {
      if (sourceFilter !== 'all' && moment.source !== sourceFilter) return false;
      if (cutoff > 0 && toMs(moment.occurredAt) < cutoff) return false;
      return true;
    });
  }, [dateRange, sourceFilter]);

  const sortedMoments = useMemo(() => {
    const copy = filteredMoments.slice();
    copy.sort((a, b) => {
      const da = toMs(a.occurredAt);
      const db = toMs(b.occurredAt);
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return copy;
  }, [filteredMoments, sortOrder]);

  const buckets = useMemo(() => buildMomentBuckets(sortedMoments), [sortedMoments]);
  const timelineRows = useMemo(
    () => buildTimelineRows(buckets, sortOrder === 'oldest'),
    [buckets, sortOrder],
  );
  const hasMoments = timelineRows.length > 0;

  const renderTimelineItem: ListRenderItem<TimelineRow> = useCallback(
    ({ item, index }) => {
      if (item.kind === 'header') {
        return (
          <View style={styles.bucketHead}>
            <AppText style={[styles.bucketLabel, { color: isDark ? 'rgba(235,235,245,0.7)' : MUTED }]}>
              {item.label}
            </AppText>
            <View style={[styles.bucketLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]} />
            <AppText style={[styles.bucketCount, { color: isDark ? 'rgba(235,235,245,0.5)' : MUTED }]}>
              {item.count}
            </AppText>
          </View>
        );
      }
      return (
        <View style={styles.momentSpacing}>
          <TapMomentCardMemo
            moment={item.moment}
            index={index}
            relativeLabel={SEED_MOMENT_LABELS[item.moment.id]}
            onPress={handleMomentPress}
            onFollowUp={handleFollowUp}
          />
        </View>
      );
    },
    [handleFollowUp, handleMomentPress, isDark],
  );

  const keyExtractor = useCallback((item: TimelineRow) => item.key, []);
  const itemSeparator = useCallback(() => <View style={styles.rowSeparator} />, []);

  const handleFollowUp = useCallback((moment: TapMoment) => {
    setCelebratingFollowUp(moment.id);
    setTimeout(() => setCelebratingFollowUp(null), 1400);
  }, []);

  const handleMomentPress = useCallback((moment: TapMoment) => {
    HapticTap.medium();
    const slugUrl = getSeedSlugUrl(moment.id, profileHost);
    setActiveMoment(moment);
    setActiveSlugUrl(slugUrl);
  }, [profileHost]);

  const closeDetail = useCallback(() => {
    setActiveMoment(null);
    setActiveSlugUrl(null);
  }, []);

  const handleSortToggle = useCallback(() => {
    HapticTap.selection();
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  }, []);

  const handleShareDemo = useCallback(() => {
    setCelebratingTap(true);
  }, []);

  const sortedBuckets = useMemo(() => {
    // When sorting oldest first, reverse bucket order so "Earlier" appears at top.
    return sortOrder === 'oldest' ? buckets.slice().reverse() : buckets;
  }, [buckets, sortOrder]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <IosScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={BRAND} />
        }
      >
        {/* Hero header — quiet */}
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText style={[styles.eyebrow, { color: isDark ? 'rgba(235,235,245,0.6)' : MUTED }]}>
              Network
            </AppText>
            <AppText style={[styles.title, { color: colors.textPrimary }]}>Moments</AppText>
          </View>
          <Pressable
            onPress={() => router.push(appRoutes.scan)}
            style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Scan QR"
          >
            <AppIcon name="ScanLine" size={18} color={BRAND} />
          </Pressable>
        </View>

        {/* Quiet stats strip (no panel, hairline dividers) */}
        <View style={styles.statsStrip}>
          <View style={styles.statBlock}>
            <AppText style={[styles.statNumber, { color: colors.textPrimary }]}>
              {analytics?.uniqueVisitors ?? 0}
            </AppText>
            <AppText style={[styles.statLabel, { color: isDark ? 'rgba(235,235,245,0.62)' : MUTED }]}>
              People
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)' }]} />
          <View style={styles.statBlock}>
            <AppText style={[styles.statNumber, { color: colors.textPrimary }]}>
              {(analytics?.totalNfcTaps ?? 0) + (analytics?.totalQrScans ?? 0)}
            </AppText>
            <AppText style={[styles.statLabel, { color: isDark ? 'rgba(235,235,245,0.62)' : MUTED }]}>
              Exchanges
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)' }]} />
          <View style={styles.statBlock}>
            <AppText style={[styles.statNumber, styles.statNumberSm, { color: colors.textPrimary }]}>
              {analytics?.lastActivityAt ? formatRelative(analytics.lastActivityAt) : '—'}
            </AppText>
            <AppText style={[styles.statLabel, { color: isDark ? 'rgba(235,235,245,0.62)' : MUTED }]}>
              Last activity
            </AppText>
          </View>
        </View>

        {/* Date range filter chips */}
        <View style={styles.filterRow}>
          <AppText style={[styles.filterLabel, { color: isDark ? 'rgba(235,235,245,0.6)' : MUTED }]}>
            Date
          </AppText>
          <View style={styles.chipRow}>
            {DATE_RANGES.map((range) => {
              const active = dateRange === range.id;
              return (
                <Pressable
                  key={range.id}
                  onPress={() => {
                    HapticTap.selection();
                    setDateRange(range.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${range.label}`}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {range.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Source filter chips */}
        <View style={styles.filterRow}>
          <AppText style={[styles.filterLabel, { color: isDark ? 'rgba(235,235,245,0.6)' : MUTED }]}>
            Source
          </AppText>
          <View style={styles.chipRow}>
            {SOURCE_FILTERS.map((src) => {
              const active = sourceFilter === src.id;
              return (
                <Pressable
                  key={src.id}
                  onPress={() => {
                    HapticTap.selection();
                    setSourceFilter(src.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${src.label}`}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  {src.icon ? (
                    <AppIcon
                      name={src.icon}
                      size={12}
                      color={active ? '#FFFFFF' : BRAND}
                    />
                  ) : null}
                  <AppText
                    style={[
                      styles.chipText,
                      src.icon ? styles.chipTextWithIcon : null,
                      active && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {src.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sort + count strip */}
        <View style={styles.sortStripWrap}>
          <Pressable
            onPress={handleSortToggle}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sortOrder === 'newest' ? 'newest first' : 'oldest first'}`}
            style={({ pressed }) => [styles.sortStrip, pressed && styles.pressed]}
          >
            <View style={styles.sortLeft}>
              <AppIcon
                name={sortOrder === 'newest' ? 'Clock' : 'History'}
                size={14}
                color={BRAND}
              />
              <AppText style={styles.sortLabel}>
                {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
              </AppText>
            </View>
            <View style={styles.sortMetaRow}>
              <AppText style={styles.sortCount}>
                {sortedMoments.length} moment{sortedMoments.length === 1 ? '' : 's'}
              </AppText>
              <AppIcon name="ChevronRight" size={12} color="rgba(0,0,0,0.32)" />
            </View>
          </Pressable>
        </View>

        {/* Moments timeline - virtualized FlatList of header + moment rows */}
        {hasMoments ? (
          <FlatList
            data={timelineRows}
            keyExtractor={keyExtractor}
            renderItem={renderTimelineItem}
            ItemSeparatorComponent={itemSeparator}
            scrollEnabled={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews
            contentContainerStyle={styles.timelineList}
          />
        ) : null}
        ) : null}

        {/* Filtered-empty state (filter excludes everything). */}
        {!hasMoments && SEED_MOMENTS.length > 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <AppIcon name="Calendar" size={36} color={BRAND} />
            </View>
            <AppText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No moments match your filters
            </AppText>
            <AppText style={[styles.emptyBody, { color: MUTED }]}>
              {`Try widening the date range or switching the source to \u201CAll sources\u201D.`}
            </AppText>
            <Pressable
              onPress={() => {
                HapticTap.selection();
                setDateRange('all');
                setSourceFilter('all');
              }}
              style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
            >
              <AppIcon name="RefreshCw" size={16} color="#FFFFFF" />
              <AppText style={styles.emptyCtaText}>Reset filters</AppText>
            </Pressable>
          </View>
        ) : null}

        {/* Empty state (no moments at all). */}
        {!hasMoments && SEED_MOMENTS.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <AppIcon name="Nfc" size={48} color={BRAND} />
            </View>
            <AppText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Your first moment is waiting
            </AppText>
            <AppText style={[styles.emptyBody, { color: MUTED }]}>
              {`Tap your card on someone\u2019s phone or have them scan your QR. Every connection will land here as a memory you can revisit.`}
            </AppText>
            <Pressable
              onPress={handleShareDemo}
              style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
            >
              <AppIcon name="ScanLine" size={18} color="#FFFFFF" />
              <AppText style={styles.emptyCtaText}>See how it feels</AppText>
            </Pressable>
          </View>
        ) : null}

      </IosScrollView>

      {/* Confetti on follow-up done - lazy mounted only when active */}
      {celebratingFollowUp ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiBurst count={18} origin={{ x: 0.5, y: 0.55 }} durationMs={1100} />
        </View>
      ) : null}

      {/* Full-screen tap success - lazy mounted only when active */}
      {celebratingTap ? (
        <LiveTapSuccess
          visible={celebratingTap}
          title="Card shared"
          subtitle={publicUrl ?? 'Your identity is one tap away.'}
          onDismiss={() => setCelebratingTap(false)}
        />
      ) : null}

      {/* Moment detail bottom sheet */}
      <MomentDetailSheet
        visible={activeMoment !== null}
        moment={activeMoment}
        slugUrl={activeSlugUrl}
        onClose={closeDetail}
        onFollowUp={handleFollowUp}
      />
    </SafeAreaView>
  );
}

/**
 * Bucket the seed tap moments into Today / Yesterday / This week / Earlier.
 *
 * Once a Firestore `tap_events` collection is available, swap this for a
 * direct query - the shape of TapMoment stays the same.
 */
function buildMomentBuckets(moments: TapMoment[]): MomentBucket[] {
  if (moments.length === 0) return [];

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const today: TapMoment[] = [];
  const yesterday: TapMoment[] = [];
  const week: TapMoment[] = [];
  const earlier: TapMoment[] = [];

  for (const moment of moments) {
    const age = (now - toMs(moment.occurredAt)) / day;
    if (age < 1) today.push(moment);
    else if (age < 2) yesterday.push(moment);
    else if (age < 7) week.push(moment);
    else earlier.push(moment);
  }

  const buckets: MomentBucket[] = [];
  if (today.length) buckets.push({ label: 'Today', moments: today });
  if (yesterday.length) buckets.push({ label: 'Yesterday', moments: yesterday });
  if (week.length) buckets.push({ label: 'This week', moments: week });
  if (earlier.length) buckets.push({ label: 'Earlier', moments: earlier });
  return buckets;
}

/**
 * Flattened timeline row - either a sticky-style header or a moment card.
 * Flattening lets us push the whole thing through one virtualized FlatList
 * so off-screen items don't cost a single render.
 */
type TimelineRow =
  | { kind: 'header'; key: string; label: string; count: number }
  | { kind: 'moment'; key: string; moment: TapMoment };

function buildTimelineRows(
  buckets: MomentBucket[],
  reversed: boolean,
): TimelineRow[] {
  const ordered = reversed ? buckets.slice().reverse() : buckets;
  const rows: TimelineRow[] = [];
  for (const bucket of ordered) {
    if (bucket.moments.length === 0) continue;
    rows.push({ kind: 'header', key: `h-${bucket.label}`, label: bucket.label, count: bucket.moments.length });
    for (const moment of bucket.moments) {
      rows.push({ kind: 'moment', key: `m-${moment.id}`, moment });
    }
  }
  return rows;
}

function toMs(input: Date | number | string): number {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') return input;
  return new Date(input).getTime();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, gap: 16, paddingBottom: 140 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 26, lineHeight: 30, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 19, fontWeight: '500', maxWidth: 320 },
  scanButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,122,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  statNumberSm: {
    fontSize: 13,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  timeline: {
    gap: 24,
  },
  bucket: {
    gap: 12,
  },
  bucketHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bucketLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bucketLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  bucketCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  momentSpacing: {
    marginBottom: 12,
  },
  filterRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,122,255,0.10)',
  },
  chipActive: {
    backgroundColor: '#0A0C12',
  },
  chipPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  chipText: {
    color: BRAND,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  chipTextWithIcon: {
    marginLeft: 2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sortStripWrap: {
    paddingHorizontal: 4,
  },
  sortStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,122,255,0.08)',
  },
  sortLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND,
    letterSpacing: 0.2,
  },
  sortMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.42)',
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,122,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyCta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#0A0C12',
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

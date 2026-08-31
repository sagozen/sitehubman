import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { ConfettiBurst } from '@/src/components/ConfettiBurst';
import { FollowUpBanner } from '@/src/components/FollowUpBanner';
import { LiveTapSuccess } from '@/src/components/LiveTapSuccess';
import { MomentDetailSheet } from '@/src/components/MomentDetailSheet';
import { SEED_MOMENTS, SEED_MOMENT_LABELS, getSeedSlugUrl } from '@/src/data/seedMoments';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { useConnectionIntelligence } from '@/src/hooks/useConnectionIntelligence';
import { getLeadsForUser } from '@/src/services/leadService';
import { useAuth } from '@/src/hooks/useAuth';
import { ALL_TAGS, type ConnectionTagId } from '@/src/services/connectionsIntelligenceService';
import { HapticTap } from '@/src/utils/haptics';
import { pageThemes } from '@/src/constants/pageThemes';

const PAGE_THEME = pageThemes.leads;
const BRAND = PAGE_THEME.accent;
const MUTED = PAGE_THEME.muted;

function buildSlugUrl(slug: string) {
  return `https://sitehub.app/${slug}`;
}

function ConnectionRowSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonAvatar, { backgroundColor: bg }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonName, { backgroundColor: bg }]} />
        <View style={[styles.skeletonSub, { backgroundColor: bg }]} />
      </View>
      <View style={[styles.skeletonAction, { backgroundColor: bg }]} />
    </View>
  );
}

/**
 * ConnectionsMomentsScreen — Phase 2: Intelligence & Automation
 *
 * New in Phase 2:
 *  1. FollowUpBanner — slides from top when a connection is overdue for follow-up
 *  2. Tag filter bar — horizontal pill chips for Smart Search & Categorization
 *  3. MomentDetailSheet extended — tag picker + contact export sheet
 */
export function ConnectionsMomentsScreen() {
  const { data, refreshing, refresh } = useCustomerConnections(null);
  const { user } = useAuth();
  const isDark = true;

  const [realLeads, setRealLeads] = useState<TapMoment[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    getLeadsForUser(user.id).then((leads) => {
      const moments: TapMoment[] = leads.map(l => ({
        id: l.id,
        name: l.name,
        subtitle: l.company || l.email || l.phone || 'Lead Captured',
        source: 'link',
        occurredAt: new Date(l.capturedAt).getTime(),
        note: l.note,
        phone: l.phone,
        email: l.email,
        needsFollowUp: true,
      }));
      setRealLeads(moments);
    }).catch(console.error);
  }, [user?.id, refreshing]);

  const [celebratingFollowUp, setCelebratingFollowUp] = useState<string | null>(null);
  const [celebratingTap, setCelebratingTap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState<ConnectionTagId | null>(null);
  const [activeMoment, setActiveMoment] = useState<TapMoment | null>(null);
  const [activeSlugUrl, setActiveSlugUrl] = useState<string | null>(null);

  const { momentId } = useLocalSearchParams<{ momentId?: string }>();

  const profile = data?.profiles?.[0];
  const publicUrl = profile?.slug ? buildSlugUrl(profile.slug) : null;
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

  // All seed moments (merged with real leads)
  const allMoments = useMemo(() => [...realLeads, ...SEED_MOMENTS], [realLeads]);

  // ── Phase 2: intelligence hook ────────────────────────────────────────────
  const {
    nudges,
    tagsMap,
    toggleTagForMoment,
    dismissNudge,
  } = useConnectionIntelligence(allMoments);

  const topNudge = nudges[0] ?? null;

  // ── Filtering: text search + tag filter ──────────────────────────────────
  const filteredMoments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMoments.filter((m) => {
      if (activeTagFilter) {
        const tags = tagsMap[m.id] ?? [];
        if (!tags.includes(activeTagFilter)) return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.subtitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allMoments, searchQuery, activeTagFilter, tagsMap]);

  // ── Deep-link: open moment from notification ──────────────────────────────
  useEffect(() => {
    if (momentId) {
      const match = SEED_MOMENTS.find((m) => m.id === momentId);
      if (match) {
        const slugUrl = getSeedSlugUrl(match.id, profileHost);
        setActiveMoment(match);
        setActiveSlugUrl(slugUrl);
      }
    }
  }, [momentId, profileHost]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleMomentPress = useCallback((moment: TapMoment) => {
    HapticTap.medium();
    const slugUrl = getSeedSlugUrl(moment.id, profileHost);
    setActiveMoment(moment);
    setActiveSlugUrl(slugUrl);
  }, [profileHost]);

  const handleFollowUp = useCallback((moment: TapMoment) => {
    setCelebratingFollowUp(moment.id);
    setTimeout(() => setCelebratingFollowUp(null), 1400);
  }, []);

  const handleNudgeAction = useCallback((nudgeMomentId: string) => {
    const match = allMoments.find((m) => m.id === nudgeMomentId);
    if (match) {
      const slugUrl = getSeedSlugUrl(match.id, profileHost);
      setActiveMoment(match);
      setActiveSlugUrl(slugUrl);
    }
    void dismissNudge(nudgeMomentId);
  }, [allMoments, profileHost, dismissNudge]);

  const handleToggleTagFilter = useCallback((tagId: ConnectionTagId) => {
    HapticTap.light();
    setActiveTagFilter((prev) => (prev === tagId ? null : tagId));
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderStory = ({ item }: { item: TapMoment }) => (
    <Pressable
      onPress={() => handleMomentPress(item)}
      style={styles.storyContainer}
    >
      <View style={styles.storyRing}>
        <AppAvatar
          name={item.name}
          size={64}
          style={styles.storyAvatar}
        />
        <View style={styles.storyBadge}>
          <AppIcon name="Add" size={10} color="#000000" />
        </View>
      </View>
      <AppText style={[styles.storyName, { color: PAGE_THEME.text }]} numberOfLines={1}>
        {item.name}
      </AppText>
    </Pressable>
  );

  const renderConversation: ListRenderItem<TapMoment> = useCallback(
    ({ item }) => {
      const timeLabel = SEED_MOMENT_LABELS[item.id] ?? '';
      const momentTags = tagsMap[item.id] ?? [];
      return (
        <Pressable
          onPress={() => handleMomentPress(item)}
          style={({ pressed }) => [
            styles.conversationRow,
            pressed && styles.pressed,
          ]}
        >
          <AppAvatar
            name={item.name}
            size={56}
          />
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <AppText style={[styles.conversationName, { color: PAGE_THEME.text }]} numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={styles.conversationTime}>{timeLabel}</AppText>
            </View>
            <View style={styles.conversationSubtitleRow}>
              <AppText style={[styles.conversationSubtitle, { color: MUTED }]} numberOfLines={1}>
                {item.subtitle || 'Connected'}
              </AppText>
              {item.needsFollowUp && (
                <View style={styles.followUpBadge}>
                  <AppText style={styles.followUpText}>Follow up</AppText>
                </View>
              )}
              {/* Show first tag pill inline */}
              {momentTags.length > 0 && (() => {
                const tag = ALL_TAGS.find((t) => t.id === momentTags[0]);
                if (!tag) return null;
                return (
                  <View style={styles.inlineTagPill}>
                    <AppText style={styles.inlineTagText}>
                      {tag.emoji} {tag.label}
                    </AppText>
                  </View>
                );
              })()}
            </View>
          </View>
        </Pressable>
      );
    },
    [handleMomentPress, isDark, tagsMap],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>

      {/* Phase 2: Intelligent follow-up banner */}
      <FollowUpBanner
        nudge={topNudge}
        totalCount={nudges.length}
        onDismiss={(id) => void dismissNudge(id)}
        onAction={handleNudgeAction}
      />

      <View style={styles.header}>
        <PageHeader
          theme={PAGE_THEME}
          title="Moments"
          subtitle={`${filteredMoments.length} moments captured.`}
          compact
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search moments"
              style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
              onPress={() => {
                HapticTap.light();
                setShowSearch((prev) => !prev);
              }}
            >
              <AppIcon name="Search" size={20} color={BRAND} />
            </Pressable>
          }
        />
      </View>

      {/* Event Scanner Mode (Phase 4) */}
      <View style={styles.scannerBanner}>
        <Pressable
          style={({ pressed }) => [styles.scannerBtn, pressed && styles.pressed]}
          onPress={() => {
            HapticTap.medium();
            router.push('/customer/event-scanner' as any);
          }}
        >
          <View style={styles.scannerIconWrap}>
            <AppIcon name="ScanLine" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.scannerTitle}>Event Scanner Mode</AppText>
            <AppText style={styles.scannerSub}>High-speed lead retrieval</AppText>
          </View>
          <AppIcon name="ChevronRight" size={20} color="rgba(255,255,255,0.3)" />
        </Pressable>
      </View>

      {/* Stories bar */}
      <View style={styles.storiesContainer}>
        <FlatList
          horizontal
          data={allMoments.slice(0, 10)}
          renderItem={renderStory}
          keyExtractor={(item) => `story-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
        />
      </View>

      {/* Search bar (toggled via header search icon) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Search"
              placeholderTextColor={MUTED}
              style={[styles.searchInput, { color: PAGE_THEME.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon name="X" size={16} color={MUTED} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Phase 2: Tag filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagFilterList}
        style={styles.tagFilterBar}
        bounces={false}
      >
        <Pressable
          onPress={() => setActiveTagFilter(null)}
          style={[styles.tagFilterChip, !activeTagFilter && styles.tagFilterChipActive]}
        >
          <AppText style={[styles.tagFilterText, !activeTagFilter && styles.tagFilterTextActive]}>
            All
          </AppText>
        </Pressable>
        {ALL_TAGS.map((tag) => {
          const active = activeTagFilter === tag.id;
          return (
            <Pressable
              key={tag.id}
              onPress={() => handleToggleTagFilter(tag.id)}
              style={[
                styles.tagFilterChip,
                active && { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
              ]}
            >
              <AppText style={styles.tagFilterEmoji}>{tag.emoji}</AppText>
              <AppText style={[styles.tagFilterText, active && { color: '#000000', fontWeight: '800' }]}>
                {tag.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Conversations list */}
      <FlatList
        data={filteredMoments}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.conversationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={BRAND} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText style={styles.emptyIcon}>🔍</AppText>
            <AppText style={[styles.emptyTitle, { color: MUTED }]}>No connections found</AppText>
            <AppText style={[styles.emptySubtitle, { color: MUTED }]}>
              {activeTagFilter
                ? 'No one tagged yet. Tap a connection and add a tag first.'
                : 'Try a different search term.'}
            </AppText>
          </View>
        }
      />

      {/* Confetti */}
      {celebratingFollowUp ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiBurst count={18} origin={{ x: 0.5, y: 0.55 }} durationMs={1100} />
        </View>
      ) : null}

      {/* Live tap success overlay */}
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
        moment={activeMoment!}
        slugUrl={activeSlugUrl ?? ''}
        tags={activeMoment ? (tagsMap[activeMoment.id] ?? []) : []}
        onToggleTag={toggleTagForMoment}
        onClose={() => {
          setActiveMoment(null);
          setActiveSlugUrl(null);
        }}
        onFollowUp={handleFollowUp}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE_THEME.canvas },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PAGE_THEME.accentSoft,
    borderWidth: 1,
    borderColor: PAGE_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stories
  storiesContainer: { paddingVertical: 10 },
  storiesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storyContainer: {
    alignItems: 'center',
    gap: 4,
  },
  storyRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  storyAvatar: { borderRadius: 30 },
  storyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  storyName: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Scanner Banner
  scannerBanner: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  scannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,122,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scannerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    backgroundColor: PAGE_THEME.surface,
    borderWidth: 1,
    borderColor: PAGE_THEME.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 4,
    color: PAGE_THEME.text,
    fontFamily: 'SF-Pro-Display-Regular',
  },

  // Tag filter bar
  tagFilterBar: { flexGrow: 0, marginBottom: 4 },
  tagFilterList: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: PAGE_THEME.surface,
    borderWidth: 1,
    borderColor: PAGE_THEME.border,
  },
  tagFilterChipActive: {
    backgroundColor: BRAND,
  },
  tagFilterEmoji: { fontSize: 12 },
  tagFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  tagFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Conversation list
  conversationsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  quickSmsBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: PAGE_THEME.accentSoft,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  conversationInfo: {
    flex: 1,
    gap: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  conversationTime: {
    fontSize: 13,
    color: MUTED,
  },
  conversationSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  conversationSubtitle: {
    fontSize: 14,
    flex: 1,
  },
  followUpBadge: {
    backgroundColor: PAGE_THEME.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followUpText: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND,
  },
  inlineTagPill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'SF-Pro-Display-Regular',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonName: {
    width: '40%',
    height: 14,
    borderRadius: 4,
  },
  skeletonSub: {
    width: '65%',
    height: 10,
    borderRadius: 4,
  },
  skeletonAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

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
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { ConfettiBurst } from '@/src/components/ConfettiBurst';
import { FollowUpBanner } from '@/src/components/FollowUpBanner';
import { LiveTapSuccess } from '@/src/components/LiveTapSuccess';
import { MomentDetailSheet } from '@/src/components/MomentDetailSheet';
import { SEED_MOMENTS, SEED_MOMENT_LABELS, getSeedSlugUrl } from '@/src/data/seedMoments';
import { useCustomerConnections } from '@/src/hooks/useCustomerConnections';
import { useConnectionIntelligence } from '@/src/hooks/useConnectionIntelligence';
import { ALL_TAGS, type ConnectionTagId } from '@/src/services/connectionsIntelligenceService';
import { HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

const BRAND = '#007AFF';
const MUTED = '#6E6E73';

function buildSlugUrl(slug: string) {
  return `https://sitehub.app/${slug}`;
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
  const { colors, isDark } = usePreferences();

  const [celebratingFollowUp, setCelebratingFollowUp] = useState<string | null>(null);
  const [celebratingTap, setCelebratingTap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // All seed moments (will be replaced by Firestore query in Phase 3)
  const allMoments = useMemo(() => SEED_MOMENTS, []);

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
      <View style={[styles.storyRing, { borderColor: BRAND }]}>
        <AppAvatar
          name={item.name}
          size={64}
          style={styles.storyAvatar}
        />
        <View style={styles.storyBadge}>
          <AppIcon name="Add" size={10} color="#FFFFFF" />
        </View>
      </View>
      <AppText style={[styles.storyName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
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
              <AppText style={[styles.conversationName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
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
                  <View style={[styles.inlineTagPill, { backgroundColor: tag.color + '22' }]}>
                    <AppText style={[styles.inlineTagText, { color: tag.color }]}>
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>

      {/* Phase 2: Intelligent follow-up banner */}
      <FollowUpBanner
        nudge={topNudge}
        totalCount={nudges.length}
        onDismiss={(id) => void dismissNudge(id)}
        onAction={handleNudgeAction}
      />

      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Chats
        </AppText>
        <Pressable style={styles.headerIcon}>
          <AppIcon name="Camera" size={24} color={BRAND} />
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

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#2C2C2E' : '#F0F0F2' }]}>
          <AppIcon name="Search" size={18} color={MUTED} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={MUTED}
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
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
                active && { backgroundColor: tag.color, borderColor: tag.color },
              ]}
            >
              <AppText style={styles.tagFilterEmoji}>{tag.emoji}</AppText>
              <AppText style={[styles.tagFilterText, active && styles.tagFilterTextActive]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIcon: { padding: 8 },

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
    borderWidth: 2,
  },
  storyAvatar: { borderRadius: 30 },
  storyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BRAND,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyName: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 4,
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
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tagFilterChipActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
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
  pressed: { opacity: 0.7 },
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
    backgroundColor: 'rgba(0,122,255,0.1)',
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inlineTagText: {
    fontSize: 10,
    fontWeight: '700',
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
});

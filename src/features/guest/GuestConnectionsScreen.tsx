import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { ConfettiBurst } from '@/src/components/ConfettiBurst';
import { LiveTapSuccess } from '@/src/components/LiveTapSuccess';
import { MomentDetailSheet } from '@/src/components/MomentDetailSheet';
import { SEED_MOMENTS, SEED_MOMENT_LABELS, getSeedSlugUrl } from '@/src/data/seedMoments';
import { useGuestActionStats } from '@/src/hooks/useGuestActionStats';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

const BRAND = '#007AFF';
const MUTED = '#6E6E73';

const GUEST_ACTIONS = [
  { icon: 'QrCode', label: 'Share QR', route: '/qr-generator' },
  { icon: 'ScanLine', label: 'Scan NFC', route: '/scan' },
  { icon: 'CreditCard', label: 'Design', route: '/guest-design' },
  { icon: 'Package', label: 'Track', route: '/guest-track-order' },
];

export function GuestConnectionsScreen() {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { openPreview } = useGuestActionStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMoment, setActiveMoment] = useState<TapMoment | null>(null);
  const [activeSlugUrl, setActiveSlugUrl] = useState<string | null>(null);
  const [celebratingTap, setCelebratingTap] = useState(false);

  // For demo purposes, we use SEED_MOMENTS as our "connections"
  const allMoments = useMemo(() => SEED_MOMENTS, []);

  const filteredMoments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMoments;
    return allMoments.filter((m) => 
      m.name.toLowerCase().includes(q) || 
      (m.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [allMoments, searchQuery]);

  const handleMomentPress = useCallback((moment: TapMoment) => {
    const slugUrl = getSeedSlugUrl(moment.id, 'https://sitehub.app');
    setActiveMoment(moment);
    setActiveSlugUrl(slugUrl);
  }, []);

  const handleAction = (action: any) => {
    if (action.label === 'Preview Bio') {
      openPreview();
      return;
    }
    if (action.route) router.push(action.route as any);
  };

  const renderStory = ({ item, index }: { item: TapMoment; index: number }) => (
    <Pressable 
      onPress={() => handleMomentPress(item)}
      style={styles.storyContainer}
    >
      <View style={[styles.storyRing, { borderColor: BRAND }]}>
        <AppAvatar 
          name={item.name} 
          size={64} 
          isOnline={index % 3 === 0}
          style={styles.storyAvatar}
        />
      </View>
      <AppText style={styles.storyName} numberOfLines={1}>
        {item.name}
      </AppText>
    </Pressable>
  );

  const renderConversation: ListRenderItem<TapMoment> = useCallback(
    ({ item, index }) => {
      const timeLabel = SEED_MOMENT_LABELS[item.id] ?? '';
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
            isOnline={index % 2 === 0}
          />
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <AppText style={styles.conversationName} numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={styles.conversationTime}>{timeLabel}</AppText>
            </View>
            <View style={styles.conversationSubtitleRow}>
              <AppText style={styles.conversationSubtitle} numberOfLines={1}>
                {item.subtitle || 'Connected'}
              </AppText>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleMomentPress],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Discover</AppText>
        <Pressable style={styles.headerIcon}>
          <AppIcon name="Users" size={24} color={BRAND} />
        </Pressable>
      </View>

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

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <AppIcon name="Search" size={18} color={MUTED} />
          <TextInput
            placeholder="Search connections..."
            placeholderTextColor={MUTED}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.actionStrip}>
        {GUEST_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => handleAction(action)}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          >
            <AppIcon name={action.icon as any} size={24} color={BRAND} />
            <AppText style={styles.actionLabel}>{action.label}</AppText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => requireAccount(undefined, { message: 'Sign in to see your history.' })}
          style={styles.actionBtn}
        >
          <AppIcon name="Lock" size={24} color={MUTED} />
          <AppText style={[styles.actionLabel, { color: MUTED }]}>History</AppText>
        </Pressable>
      </View>

      <FlatList
        data={filteredMoments}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.conversationsList}
        showsVerticalScrollIndicator={false}
      />

      <MomentDetailSheet
        visible={activeMoment !== null}
        moment={activeMoment!}
        slugUrl={activeSlugUrl ?? ''}
        onClose={() => {
          setActiveMoment(null);
          setActiveSlugUrl(null);
        }}
        onFollowUp={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIcon: {
    padding: 4,
  },
  storiesContainer: {
    paddingVertical: 8,
  },
  storiesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storyContainer: {
    alignItems: 'center',
    gap: 6,
  },
  storyRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
  },
  storyAvatar: {
    borderRadius: 30,
  },
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
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F0F0F2',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  conversationsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  pressed: {
    opacity: 0.6,
  },
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
    fontSize: 14,
    color: MUTED,
  },
  conversationSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationSubtitle: {
    fontSize: 15,
    flex: 1,
    opacity: 0.8,
  },
  actionStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});

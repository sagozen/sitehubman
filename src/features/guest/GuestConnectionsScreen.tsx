import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  Animated,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { ConnectionCardV2 } from '@/src/components/ConnectionCardV2';
import { useDebounce } from '@/src/hooks/useDebounce';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { pageThemes } from '@/src/constants/pageThemes';
import { SEED_MOMENTS } from '@/src/data/seedMoments';
import { useGuestActionStats } from '@/src/hooks/useGuestActionStats';
import { HapticTap } from '@/src/utils/haptics';

const THEME = pageThemes.leads;
const CARD_GAP = 8;
const CARD_RATIO = 1.0;
const HEADER_ESTIMATE = 190;

export function GuestConnectionsScreen() {
  const { width: sw } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { openPreview } = useGuestActionStats();

  // Custom Popup Modal state
  const [selectedContact, setSelectedContact] = useState<TapMoment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'recent' | 'vip' | 'followup'>('all');

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const numColumns = 1;
  const rowHeight = 84;

  const allMoments = useMemo(() => SEED_MOMENTS, []);
  const debouncedSearch = useDebounce(query, 300);

  const filteredMoments = useMemo(() => {
    let result = allMoments;
    if (activeCategory === 'vip') {
      result = result.filter(m => (m.name || '').includes('CEO') || (m.subtitle || '').toLowerCase().includes('founder') || (m.subtitle || '').toLowerCase().includes('director') || (m.subtitle || '').toLowerCase().includes('head'));
    } else if (activeCategory === 'recent') {
      result = result.slice(0, 5);
    }
    if (!debouncedSearch.trim()) return result;
    const lower = debouncedSearch.toLowerCase();
    return result.filter((moment) =>
      `${moment.name} ${moment.subtitle ?? ''}`
        .toLowerCase()
        .includes(lower),
    );
  }, [allMoments, activeCategory, debouncedSearch]);

  // Open custom popup with hardware-accelerated animated overlay
  const handleOpenPopup = useCallback((contact: TapMoment) => {
    HapticTap.light();
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.92);
    setSelectedContact(contact);
    setModalVisible(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 110,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Close custom popup smoothly
  const handleClosePopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedContact(null);
    });
  }, [fadeAnim, scaleAnim]);

  const renderGridItem = useCallback(
    ({ item }: { item: TapMoment; index: number }) => (
      <ConnectionCardV2 
        name={item.name || ''} 
        title={item.subtitle} 
        onPress={() => handleOpenPopup(item)} 
        style={{ marginBottom: 8 }}
      />
    ),
    [handleOpenPopup],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Controls row above: Search bar + Date filter */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
            <AppIcon name="Search" size={16} color={THEME.muted} />
            <TextInput
              placeholder="Search leads & contacts..."
              placeholderTextColor={THEME.muted}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={10}
                accessibilityLabel="Clear search"
              >
                <AppIcon name="X" size={15} color={THEME.muted} />
              </Pressable>
            ) : null}
          </View>

          {/* Date Filter pill next to search */}
          <Pressable
            style={({ pressed }) => [styles.yearSelector, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.light();
            }}
          >
            <AppIcon name="Calendar" size={14} color={THEME.accent} />
            <AppText style={styles.yearText} weight="bold">2026</AppText>
          </Pressable>
        </View>

        {/* Quick Category Chips */}
        <View style={styles.categoryRow}>
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'recent', label: 'Recent' },
            { id: 'vip', label: 'VIP / Exec' },
          ].map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => { HapticTap.selection(); setActiveCategory(cat.id as any); }}
              style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            >
              <AppText style={[styles.categoryChipText, activeCategory === cat.id && styles.categoryChipTextActive]} weight="bold">
                {cat.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Subtitle count below */}
        <AppText style={styles.momentsCountText} weight="bold">
          {filteredMoments.length} moments captured · 60FPS Contact OS
        </AppText>
      </View>
    ),
    [activeCategory, filteredMoments.length, query],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        {/* Responsive Grid with FlatList optimizations */}
        <FlatList
          key={`list-cols-${numColumns}`}
          data={filteredMoments}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_, index) => ({
            length: rowHeight,
            offset: HEADER_ESTIMATE + Math.floor(index / 2) * rowHeight,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppIcon name="Search" size={28} color={THEME.accent} />
              <AppText style={styles.emptyTitle}>No matching leads</AppText>
              <AppText style={styles.emptySubtitle}>
                Try a name or company keyword.
              </AppText>
            </View>
          }
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={60}
          windowSize={4}
          removeClippedSubviews={true}
        />

      {/* Custom Absolute Animated Overlay Popup */}
      {modalVisible && (
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleClosePopup}
          />

          <Animated.View
            style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}
          >
            {/* Profile Overview */}
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarCircle}>
                <AppText style={styles.modalAvatarLetter} weight="bold">
                  {selectedContact?.name?.[0].toUpperCase()}
                </AppText>
              </View>
              <AppText
                style={styles.modalTitle}
                weight="extrabold"
                numberOfLines={1}
              >
                {selectedContact?.name}
              </AppText>
              <AppText
                style={styles.modalSubtitle}
                weight="semibold"
                numberOfLines={1}
              >
                {selectedContact?.subtitle || 'Connected partner'}
              </AppText>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.viewBioBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  HapticTap.medium();
                  handleClosePopup();
                  openPreview();
                }}
              >
                <AppIcon name="User" size={16} color="#000000" />
                <AppText style={styles.viewBioText} weight="bold">
                  View Profile
                </AppText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.pressed,
                ]}
                onPress={handleClosePopup}
              >
                <AppText style={styles.cancelText} weight="bold">
                  Dismiss
                </AppText>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  // Header styles
  headerContainer: {
    width: '100%',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: THEME.canvas,
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    color: THEME.text,
    fontSize: 14,
    flex: 1,
    padding: 0,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryChipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: '#000000',
  },
  momentsCountText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontFamily: 'SF-Pro-Display-Regular',
    marginTop: 2,
  },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 56 },
  emptyTitle: { color: THEME.text, fontSize: 17, fontWeight: '800' },
  emptySubtitle: { color: THEME.muted, fontSize: 13, fontWeight: '600' },
  // Custom Absolute Animated Overlay styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalCard: {
    width: 290,
    backgroundColor: THEME.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  modalAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.accentSoft,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalAvatarLetter: {
    color: THEME.accent,
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 4,
    width: '100%',
  },
  modalSubtitle: {
    fontSize: 13,
    color: THEME.muted,
    textAlign: 'center',
    width: '100%',
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  viewBioBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBioText: {
    color: THEME.onAccent,
    fontSize: 15,
  },
  addContactBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContactText: {
    color: THEME.text,
    fontSize: 15,
  },
  cancelBtn: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    color: THEME.muted,
    fontSize: 14,
  },
});

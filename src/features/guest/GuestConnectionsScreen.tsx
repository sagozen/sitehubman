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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { pageThemes } from '@/src/constants/pageThemes';
import { SEED_MOMENTS } from '@/src/data/seedMoments';
import { useGuestActionStats } from '@/src/hooks/useGuestActionStats';
import { HapticTap } from '@/src/utils/haptics';

const THEME = pageThemes.leads;
const CARD_GAP = 8;
const CARD_RATIO = 16 / 9;
const HEADER_ESTIMATE = 170;

const SOURCE_META = {
  nfc: { icon: 'Nfc', label: 'NFC tap', color: '#32D583' },
  qr: { icon: 'QrCode', label: 'QR scan', color: '#5B8BFF' },
  view: { icon: 'Eye', label: 'Profile view', color: '#F79009' },
  share: { icon: 'Share', label: 'Shared link', color: '#F04438' },
  link: { icon: 'Link', label: 'Web tap', color: '#A855F7' },
} as const;

type GuestMomentCardProps = {
  item: TapMoment;
  cardWidth: number;
  onPress: (item: TapMoment) => void;
};

const GuestMomentCard = memo(function GuestMomentCard({
  item,
  cardWidth,
  onPress,
}: GuestMomentCardProps) {
  const meta = SOURCE_META[item.source];

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.gridCard,
        { width: cardWidth, height: Math.round(cardWidth * CARD_RATIO) },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardGlow} />
      <View style={styles.cardTopRow}>
        <View style={styles.avatarCircle}>
          <AppText style={styles.avatarLetter} weight="bold">
            {(item.initial ?? item.name?.[0] ?? '?').toUpperCase()}
          </AppText>
        </View>
        <View style={[styles.sourcePill, { borderColor: `${meta.color}55`, backgroundColor: `${meta.color}18` }]}>
          <AppIcon name={meta.icon} size={13} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.cardBody}>
        <AppText style={styles.gridName} numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText style={styles.gridSubtitle} numberOfLines={1}>
          {item.subtitle || 'NFC connection'}
        </AppText>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.signalDot, { backgroundColor: meta.color }]} />
        <AppText style={styles.signalText} numberOfLines={1}>
          {meta.label}
        </AppText>
      </View>
    </Pressable>
  );
});

export function GuestConnectionsScreen() {
  const { width: sw } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { openPreview } = useGuestActionStats();

  // Custom Popup Modal state
  const [selectedContact, setSelectedContact] = useState<TapMoment | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const numColumns = sw >= 480 ? 3 : 2;
  const gridWidth = Math.floor((Math.min(sw, 640) - 32 - (numColumns - 1) * CARD_GAP) / numColumns);
  const rowHeight = Math.round(gridWidth * CARD_RATIO) + CARD_GAP;

  const allMoments = useMemo(() => SEED_MOMENTS, []);
  const filteredMoments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allMoments;
    return allMoments.filter((moment) =>
      `${moment.name} ${moment.subtitle ?? ''}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [allMoments, query]);

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
    ({ item }: { item: TapMoment }) => (
      <GuestMomentCard item={item} cardWidth={gridWidth} onPress={handleOpenPopup} />
    ),
    [gridWidth, handleOpenPopup],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <PageHeader
          theme={THEME}
          title="Moments"
          subtitle={`${filteredMoments.length} moments captured.`}
          compact
        />

        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Search"
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
        </View>
      </View>
    ),
    [filteredMoments.length, query],
  );

  return (
    <View style={styles.safe}>
      <View style={styles.content}>
        {/* Responsive Grid with FlatList optimizations */}
        <FlatList
        key={`grid-cols-${numColumns}`}
        data={filteredMoments}
        keyExtractor={(item) => item.id}
        renderItem={renderGridItem}
        numColumns={numColumns}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.gridContent,
          { paddingTop: Math.max(insets.top, 0) },
        ]}
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

        // FlatList rendering performance optimizations
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
    </View>
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
    paddingBottom: 110,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  gridCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    position: 'relative',
    padding: 12,
    justifyContent: 'space-between',
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
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: THEME.canvas,
    gap: 16,
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
    backgroundColor: THEME.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.border,
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
    backgroundColor: THEME.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  yearText: {
    color: THEME.accent,
    fontSize: 13,
  },
  cardGlow: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.accentSoft,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  sourcePill: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  signalText: { color: THEME.muted, fontSize: 9, fontWeight: '900' },
  cardBody: {
    gap: 3,
  },
  gridName: {
    color: THEME.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  gridSubtitle: {
    color: THEME.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 18,
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

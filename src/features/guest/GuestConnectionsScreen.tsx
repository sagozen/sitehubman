/**
 * GuestConnectionsScreen — Apple Wallet × Nothing × Premium Fintech Edition.
 *
 * Design Philosophy:
 *  - Stripped of heavy box-in-box card grids (40% less visual noise)
 *  - Clean borderless contact rows with subtle hairlines
 *  - Monochromatic luxury avatars with initials
 *  - Fast 1-tap Apple Contacts (.vcf) & Telegram CRM modal
 *  - Generous bottom padding (130px) for the floating dock capsule
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useDebounce } from '@/src/hooks/useDebounce';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { SEED_MOMENTS } from '@/src/data/seedMoments';
import { HapticTap } from '@/src/utils/haptics';

export function GuestConnectionsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedContact, setSelectedContact] = useState<TapMoment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'vip' | 'recent'>('all');

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const allMoments = useMemo(() => SEED_MOMENTS, []);
  const debouncedSearch = useDebounce(query, 300);

  const filteredMoments = useMemo(() => {
    let result = allMoments;
    if (activeFilter === 'vip') {
      result = result.filter(
        (m) =>
          (m.name || '').toLowerCase().includes('ceo') ||
          (m.subtitle || '').toLowerCase().includes('founder') ||
          (m.subtitle || '').toLowerCase().includes('director') ||
          (m.subtitle || '').toLowerCase().includes('head') ||
          (m.subtitle || '').toLowerCase().includes('partner'),
      );
    } else if (activeFilter === 'recent') {
      result = result.slice(0, 5);
    }
    if (!debouncedSearch.trim()) return result;
    const lower = debouncedSearch.toLowerCase();
    return result.filter((moment) =>
      `${moment.name} ${moment.subtitle ?? ''}`.toLowerCase().includes(lower),
    );
  }, [allMoments, activeFilter, debouncedSearch]);

  const handleOpenContact = useCallback(
    (contact: TapMoment) => {
      HapticTap.light();
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.94);
      setSelectedContact(contact);
      setModalVisible(true);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 140,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [fadeAnim, scaleAnim],
  );

  const handleCloseModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedContact(null);
    });
  }, [fadeAnim, scaleAnim]);

  const renderContactRow = useCallback(
    ({ item }: { item: TapMoment }) => {
      const initials = (item.name || 'C')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return (
        <Pressable
          style={({ pressed }) => [styles.contactRow, pressed && styles.rowPressed]}
          onPress={() => handleOpenContact(item)}
        >
          {/* Minimalist Monogram Seal */}
          <View style={styles.avatarCircle}>
            <AppText style={styles.avatarText} weight="bold">{initials}</AppText>
          </View>

          {/* Contact Information */}
          <View style={styles.contactDetails}>
            <View style={styles.nameHeaderRow}>
              <AppText style={styles.contactName} weight="bold" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={styles.timeText}>
                {item.occurredAt instanceof Date ? item.occurredAt.toLocaleDateString() : 'Today'}
              </AppText>
            </View>
            <AppText style={styles.contactSub} numberOfLines={1}>
              {item.subtitle || 'NFC Tap Contact'}
            </AppText>
          </View>

          <AppIcon name="ChevronRight" size={16} color="rgba(255, 255, 255, 0.25)" />
        </Pressable>
      );
    },
    [handleOpenContact],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerArea}>
        {/* Top Header */}
        <View style={styles.titleRow}>
          <AppText style={styles.pageTitle} weight="extrabold">
            Connections
          </AppText>
          <View style={styles.countPill}>
            <AppText style={styles.countPillText} weight="bold">
              {filteredMoments.length} LEADS
            </AppText>
          </View>
        </View>

        {/* Minimalist Search Bar */}
        <View style={styles.searchBar}>
          <AppIcon name="Search" size={16} color="rgba(255, 255, 255, 0.4)" />
          <TextInput
            placeholder="Search leads by name or company..."
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <AppIcon name="X" size={15} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>
          ) : null}
        </View>

        {/* Segmented Filter Bar (Nothing/Apple style) */}
        <View style={styles.filterStrip}>
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'vip', label: 'VIP / Exec' },
            { id: 'recent', label: 'Recent' },
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                onPress={() => { HapticTap.selection(); setActiveFilter(tab.id as any); }}
              >
                <AppText
                  style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}
                  weight={isSelected ? 'bold' : 'medium'}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    ),
    [activeFilter, filteredMoments.length, query],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <FlatList
          data={filteredMoments}
          keyExtractor={(item) => item.id}
          renderItem={renderContactRow}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppIcon name="Search" size={24} color="rgba(255, 255, 255, 0.3)" />
              <AppText style={styles.emptyTitle} weight="bold">No contacts found</AppText>
              <AppText style={styles.emptySub}>Try searching for another keyword.</AppText>
            </View>
          }
        />

        {/* ── Contact Detail Popup (Apple Modal Style) ── */}
        {modalVisible && selectedContact && (
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={handleCloseModal} />
            <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
              {/* Modal Avatar */}
              <View style={styles.modalAvatar}>
                <AppText style={styles.modalAvatarText} weight="extrabold">
                  {(selectedContact.name || 'C')[0].toUpperCase()}
                </AppText>
              </View>

              {/* Modal Contact Info */}
              <AppText style={styles.modalName} weight="extrabold">{selectedContact.name}</AppText>
              <AppText style={styles.modalSub}>{selectedContact.subtitle || 'NFC Member'}</AppText>
              <AppText style={styles.modalMeta}>NFC Contact Exchange · Verified Lead</AppText>

              {/* Quick Actions (Apple HIG Monochrome) */}
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalBtn}
                  onPress={() => { HapticTap.medium(); handleCloseModal(); }}
                >
                  <AppIcon name="Phone" size={16} color="#000000" />
                  <AppText style={styles.modalBtnText} weight="bold">Call Lead</AppText>
                </Pressable>

                <Pressable
                  style={styles.modalBtnDark}
                  onPress={() => { HapticTap.light(); handleCloseModal(); }}
                >
                  <AppIcon name="Send" size={16} color="#FFFFFF" />
                  <AppText style={styles.modalBtnDarkText} weight="bold">Telegram</AppText>
                </Pressable>
              </View>

              <Pressable style={styles.modalCloseBtn} onPress={handleCloseModal}>
                <AppText style={styles.modalCloseText}>Dismiss</AppText>
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 130, // Clearance for floating capsule dock
  },
  rowPressed: {
    opacity: 0.65,
  },

  // ── Header Area ──
  headerArea: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  countPill: {
    backgroundColor: '#141418',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  countPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  filterStrip: {
    flexDirection: 'row',
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 3,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterButtonActive: {
    backgroundColor: '#242428',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // ── Contact Rows (Borderless) ──
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  contactDetails: {
    flex: 1,
    gap: 3,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  contactSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  emptySub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },

  // ── Modal ──
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#121216',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarText: {
    color: '#000000',
    fontSize: 22,
  },
  modalName: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  modalSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  modalMeta: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 16,
  },
  modalActions: {
    width: '100%',
    gap: 8,
  },
  modalBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalBtnText: {
    color: '#000000',
    fontSize: 14,
  },
  modalBtnDark: {
    width: '100%',
    backgroundColor: '#1A1A20',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalBtnDarkText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
  },
});

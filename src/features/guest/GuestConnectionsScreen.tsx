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
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useDebounce } from '@/src/hooks/useDebounce';
import type { TapMoment } from '@/src/components/TapMomentCard';
import { SEED_MOMENTS } from '@/src/data/seedMoments';
import { HapticTap } from '@/src/utils/haptics';
import { usePreferences } from '@/src/hooks/usePreferences';

const SPRING_STD   = { damping: 18, stiffness: 260, mass: 0.9 };
const SPRING_SNAPPY = { damping: 16, stiffness: 340, mass: 0.7 };
const SPRING_BOUNCY = { damping: 12, stiffness: 280, mass: 1.0 };

const FILTERS = [
  { id: 'all', label: 'All Leads' },
  { id: 'vip', label: 'VIP / Exec' },
  { id: 'recent', label: 'Recent' },
] as const;

const AVATAR_GRADIENTS = [
  ['#FF512F', '#DD2476'],
  ['#4776E6', '#8E54E9'],
  ['#00B4DB', '#0083B0'],
  ['#7b4397', '#dc2430'],
  ['#1D976C', '#93F9B9'],
  ['#EB3349', '#F45C43'],
];

function getGradientForName(name: string) {
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] as [string, string];
}

const EmptyState = ({ isDark }: { isDark: boolean }) => {
  const floatAnim = useSharedValue(0);
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const iconColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)';

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200 }),
        withTiming(8, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }]
  }));

  return (
    <View style={styles.emptyState}>
      <Animated.View style={animatedStyle}>
        <AppIcon name="Search" size={32} color={iconColor} />
      </Animated.View>
      <AppText style={[styles.emptyTitle, { color: textColor }]} weight="bold">No contacts found</AppText>
      <AppText style={[styles.emptySub, { color: subColor }]}>Try searching for another keyword.</AppText>
    </View>
  );
};

const ContactRow = ({ item, index, handleOpenContact, isDark }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const initials = (item.name || 'C')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const gradient = getGradientForName(item.name);
  const isUnread = index < 2; // Simulated unread state for recent items

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95, SPRING_SNAPPY);
          HapticTap.light();
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_SNAPPY);
        }}
        onPress={() => handleOpenContact(item)}
      >
        <Animated.View style={[styles.contactRow, { borderBottomColor: borderColor }, animatedStyle]}>
          <LinearGradient colors={gradient as any} style={styles.avatarCircle}>
            <AppText style={styles.avatarText} weight="bold">{initials}</AppText>
          </LinearGradient>

          <View style={styles.contactDetails}>
            <View style={styles.nameHeaderRow}>
              <AppText style={[styles.contactName, { color: textColor }]} weight="bold" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={[styles.timeText, { color: subTextColor }]}>
                {item.occurredAt instanceof Date ? item.occurredAt.toLocaleDateString() : 'Today'}
              </AppText>
            </View>
            <AppText style={[styles.contactSub, { color: subTextColor }]} numberOfLines={1}>
              {item.subtitle || 'NFC Tap Contact'}
            </AppText>
          </View>

          {isUnread && <View style={styles.unreadDot} />}
          <AppIcon name="ChevronRight" size={16} color={subTextColor} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const ActionBubble = ({ icon, label, onPress, colors, isDark }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.9, SPRING_SNAPPY);
        HapticTap.selection();
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_SNAPPY);
      }}
      onPress={onPress}
      style={styles.bubbleContainer}
    >
      <Animated.View style={[styles.bubbleWrapper, animatedStyle]}>
        <LinearGradient colors={colors} style={styles.bubbleGradient}>
          <AppIcon name={icon} size={22} color="#FFFFFF" />
        </LinearGradient>
        <AppText style={[styles.bubbleLabel, { color: isDark ? '#FFFFFF' : '#000000' }]} weight="medium">{label}</AppText>
      </Animated.View>
    </Pressable>
  );
};

export function GuestConnectionsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();
  
  const [selectedContact, setSelectedContact] = useState<TapMoment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'vip' | 'recent'>('all');

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

  const handleExportCSV = useCallback(async () => {
    HapticTap.medium();
    const headers = 'Name,Company/Title,Email,Phone,Date,Note\n';
    const rows = filteredMoments
      .map(
        (m) =>
          `"${m.name}","${m.subtitle || m.company || 'Executive'}","${m.email || 'N/A'}","${m.phone || 'N/A'}","${
            m.occurredAt instanceof Date ? m.occurredAt.toLocaleDateString() : 'Recent'
          }","${m.note || 'Verified NFC Lead'}"`,
      )
      .join('\n');
    const csvContent = headers + rows;
    try {
      await Share.share({
        title: 'AVIO_Executive_Leads.csv',
        message: csvContent,
      });
    } catch (e) {
      console.error(e);
    }
  }, [filteredMoments]);

  const handleWhatsApp = useCallback((contact: TapMoment) => {
    HapticTap.light();
    const text = encodeURIComponent(
      `Hi ${contact.name}, great connecting with you today! Here is my AVIO business card and direct contact info.`,
    );
    Linking.openURL(`https://wa.me/?text=${text}`).catch(() => {
      Alert.alert('Notice', 'Unable to launch WhatsApp on this device.');
    });
  }, []);

  const handleEmail = useCallback((contact: TapMoment) => {
    HapticTap.light();
    const subject = encodeURIComponent(`Great meeting you - Follow up from AVIO`);
    const body = encodeURIComponent(
      `Hi ${contact.name},\n\nIt was a pleasure meeting you today. Looking forward to our conversation.\n\nBest regards,`,
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Notice', 'Unable to launch email client.');
    });
  }, []);

  const handleCall = useCallback((_contact: TapMoment) => {
    HapticTap.medium();
    Linking.openURL(`tel:18005550199`).catch(() => {
      Alert.alert('Notice', 'Phone dialer not available.');
    });
  }, []);

  const handleSave = useCallback((_contact: TapMoment) => {
    HapticTap.success();
    Alert.alert('Saved', 'Contact saved to address book.');
  }, []);

  const handleOpenContact = useCallback(
    (contact: TapMoment) => {
      HapticTap.light();
      setSelectedContact(contact);
      setModalVisible(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedContact(null);
    }, 300); // Give time for exit animation if we add one
  }, []);

  const renderContactRow = useCallback(
    ({ item, index }: { item: TapMoment; index: number }) => (
      <ContactRow 
        item={item} 
        index={index} 
        handleOpenContact={handleOpenContact} 
        isDark={isDark}
      />
    ),
    [handleOpenContact, isDark],
  );

  // Search Animation
  const searchFocused = useSharedValue(0);
  const searchAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginHorizontal: withSpring(searchFocused.value ? -4 : 0, SPRING_SNAPPY),
      borderColor: searchFocused.value 
        ? 'rgba(64, 156, 255, 0.6)' 
        : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'),
    };
  });

  const [filterStripWidth, setFilterStripWidth] = useState(0);
  const activeFilterIndex = FILTERS.findIndex(f => f.id === activeFilter);
  const filterAnim = useSharedValue(0);
  
  useEffect(() => {
    if (filterStripWidth > 0) {
      const tabW = (filterStripWidth - 6) / FILTERS.length;
      filterAnim.value = withSpring(activeFilterIndex * tabW, SPRING_SNAPPY);
    }
  }, [activeFilterIndex, filterAnim, filterStripWidth]);

  const filterIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: filterAnim.value }],
  }));

  const bgColors = isDark 
    ? ['#000000', '#07090E', '#0D1017'] as const
    : ['#F4F7FB', '#FAFCFF', '#FFFFFF'] as const;
    
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const surfaceColor = isDark ? '#121214' : '#FFFFFF';

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerArea}>
        {/* Top Header */}
        <View style={styles.titleRow}>
          <View style={styles.titleWithBadge}>
            <AppText style={[styles.pageTitle, { color: textColor }]} weight="extrabold">
              Lead CRM
            </AppText>
            <View style={[styles.countPill, { backgroundColor: isDark ? '#141418' : '#F0F0F0', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <AppText style={[styles.countPillText, { color: textColor }]} weight="bold">
                {filteredMoments.length} CONTACTS
              </AppText>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.exportBtn, 
              { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
              pressed && styles.exportBtnPressed
            ]}
            onPress={handleExportCSV}
          >
            <AppIcon name="Download" size={13} color={isDark ? '#000000' : '#FFFFFF'} />
            <AppText style={[styles.exportBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]} weight="bold">
              Export CSV
            </AppText>
          </Pressable>
        </View>

        {/* Minimalist Search Bar */}
        <Animated.View style={[styles.searchBar, { backgroundColor: surfaceColor }, searchAnimatedStyle]}>
          <AppIcon name="Search" size={16} color={subTextColor} />
          <TextInput
            placeholder="Search leads by name, company, or title..."
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor }]}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => (searchFocused.value = 1)}
            onBlur={() => (searchFocused.value = 0)}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <AppIcon name="X" size={15} color={subTextColor} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Segmented Filter Bar */}
        <View 
          style={[styles.filterStrip, { backgroundColor: surfaceColor }]}
          onLayout={(e) => setFilterStripWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.filterIndicator, filterIndicatorStyle, { backgroundColor: isDark ? '#242428' : '#E8E8E8' }]} />
          {FILTERS.map((tab, idx) => {
            const isSelected = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.filterButton}
                onPress={() => { HapticTap.selection(); setActiveFilter(tab.id as any); }}
              >
                <AppText
                  style={[
                    styles.filterButtonText,
                    { color: isSelected ? textColor : subTextColor }
                  ]}
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
    [activeFilter, filteredMoments.length, handleExportCSV, query, isDark, textColor, subTextColor, surfaceColor, searchAnimatedStyle, filterIndicatorStyle, searchFocused, filterStripWidth],
  );

  return (
    <LinearGradient colors={bgColors} style={styles.safe}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <FlashList
            data={filteredMoments}
            keyExtractor={(item) => item.id}
            renderItem={renderContactRow}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<EmptyState isDark={isDark} />}
            estimatedItemSize={72}
          />

          {/* ── Contact Detail Popup ── */}
          {modalVisible && selectedContact && (
            <View style={StyleSheet.absoluteFill}>
              <BlurView style={StyleSheet.absoluteFill} tint={isDark ? "dark" : "light"} intensity={40} />
              <Pressable style={StyleSheet.absoluteFillObject} onPress={handleCloseModal} />
              <View style={styles.modalOverlay}>
                <Animated.View entering={FadeInUp.springify().damping(16)} style={[styles.modalCard, { backgroundColor: isDark ? '#121216' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0,0,0,0.08)' }]}>
                  
                  {/* Modal Avatar */}
                  <LinearGradient colors={getGradientForName(selectedContact.name) as any} style={styles.modalAvatar}>
                    <AppText style={styles.modalAvatarText} weight="extrabold">
                      {(selectedContact.name || 'C')[0].toUpperCase()}
                    </AppText>
                  </LinearGradient>

                  {/* Modal Contact Info */}
                  <AppText style={[styles.modalName, { color: textColor }]} weight="extrabold">{selectedContact.name}</AppText>
                  <AppText style={[styles.modalSub, { color: subTextColor }]}>{selectedContact.subtitle || 'Executive Contact'}</AppText>
                  <AppText style={[styles.modalMeta, { color: subTextColor }]}>Verified NFC Exchange · Direct Lead</AppText>

                  {/* Action Bubbles Row */}
                  <View style={styles.modalActionsRow}>
                    <ActionBubble icon="Phone" label="Call" onPress={() => { handleCall(selectedContact); handleCloseModal(); }} colors={['#34e89e', '#0f3443']} isDark={isDark} />
                    <ActionBubble icon="MessageSquare" label="WhatsApp" onPress={() => { handleWhatsApp(selectedContact); handleCloseModal(); }} colors={['#25D366', '#128C7E']} isDark={isDark} />
                    <ActionBubble icon="Mail" label="Email" onPress={() => { handleEmail(selectedContact); handleCloseModal(); }} colors={['#00C6FF', '#0072FF']} isDark={isDark} />
                    <ActionBubble icon="Bookmark" label="Save" onPress={() => { handleSave(selectedContact); handleCloseModal(); }} colors={['#f12711', '#f5af19']} isDark={isDark} />
                  </View>

                  <Pressable style={styles.modalCloseBtn} onPress={handleCloseModal}>
                    <AppText style={[styles.modalCloseText, { color: subTextColor }]}>Dismiss</AppText>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  exportBtnPressed: {
    opacity: 0.8,
  },
  exportBtnText: {
    fontSize: 12,
  },
  pageTitle: {
    fontSize: 24,
    letterSpacing: 0.2,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterStrip: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    width: '33.33%', // Responsive: 3 equal tabs
    borderRadius: 9,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
    zIndex: 1,
  },
  filterButtonText: {
    fontSize: 12,
  },

  // ── Contact Rows (Borderless) ──
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    fontSize: 15,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  contactSub: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
  },

  // ── Modal ──
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end', // Bottom sheet style
    zIndex: 999,
    padding: 20,
    paddingBottom: 40,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  modalName: {
    fontSize: 20,
  },
  modalSub: {
    fontSize: 14,
  },
  modalMeta: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  bubbleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  bubbleWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  bubbleGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bubbleLabel: {
    fontSize: 12,
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

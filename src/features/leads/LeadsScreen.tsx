/**
 * LeadsScreen — Screen 4: Contacts / Leads (CRM) ("Manage your captured contacts")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceRaised: '#141418',
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#2596BE',
} as const;

export interface ContactLead {
  id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  source: 'NFC Tap' | 'QR Code' | 'Link' | 'Manual';
  timeAgo: string;
  category: 'all' | 'new' | 'followup';
  notes: string;
  avatar?: any;
}

const DEFAULT_CONTACTS: ContactLead[] = [
  {
    id: 'john-smith',
    name: 'John Smith',
    company: 'ABC Corporation',
    title: 'CEO',
    phone: '+855 12 345 678',
    email: 'john@acme.com',
    source: 'NFC Tap',
    timeAgo: '2h ago',
    category: 'new',
    notes: 'Interested in enterprise smart cards. Send proposal by Friday.',
    avatar: require('@/assets/images/avatars/avatar_executive_real.jpg'),
  },
  {
    id: 'sokha-chan',
    name: 'Sokha Chan',
    company: 'ABC Group',
    title: 'Marketing Manager',
    phone: '+855 23 888 123',
    email: 'sokha.chan@abcgroup.kh',
    source: 'QR Code',
    timeAgo: '5h ago',
    category: 'new',
    notes: 'Met at FinTech showcase. Follow up on custom branding.',
    avatar: require('@/assets/images/avatars/avatar_founder_woman.jpg'),
  },
  {
    id: 'daniel-kim',
    name: 'Daniel Kim',
    company: 'Tech Solutions',
    title: 'CTO',
    phone: '+1 (555) 789-0123',
    email: 'daniel.kim@techsolutions.io',
    source: 'NFC Tap',
    timeAgo: '1d ago',
    category: 'followup',
    notes: 'Requested developer API docs for CRM integration.',
    avatar: require('@/assets/images/avatars/avatar_founder_man.jpg'),
  },
  {
    id: 'srey-pov',
    name: 'Srey Pov',
    company: 'Meta Cambodia',
    title: 'Business Development',
    phone: '+855 11 999 555',
    email: 'sreypov@metacambodia.com',
    source: 'Link',
    timeAgo: '1d ago',
    category: 'new',
    notes: 'Exchanged contact via digital pass link.',
    avatar: require('@/assets/images/avatars/avatar_founder_woman.jpg'),
  },
  {
    id: 'alex-turner',
    name: 'Alex Turner',
    company: 'Global Ventures',
    title: 'Partner',
    phone: '+44 20 7946 0912',
    email: 'alex@globalventures.co.uk',
    source: 'NFC Tap',
    timeAgo: '2d ago',
    category: 'new',
    notes: 'Interested in metal bulk cards for executive team.',
    avatar: require('@/assets/images/avatars/avatar_executive_real.jpg'),
  },
  {
    id: 'chhay-vibol',
    name: 'Chhay Vibol',
    company: 'Wing Commerce',
    title: 'Product Director',
    phone: '+855 77 444 333',
    email: 'vibol.chhay@wing.com.kh',
    source: 'QR Code',
    timeAgo: '3d ago',
    category: 'new',
    notes: 'Digital business cards rollout.',
    avatar: require('@/assets/images/avatars/avatar_founder_man.jpg'),
  },
];

export default function LeadsScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'followup'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredContacts = useMemo(() => {
    return DEFAULT_CONTACTS.filter((c) => {
      const matchTab = activeTab === 'all' || c.category === activeTab;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, searchQuery]);

  const allCount = DEFAULT_CONTACTS.length;
  const newCount = DEFAULT_CONTACTS.filter((c) => c.category === 'new').length;
  const followCount = DEFAULT_CONTACTS.filter((c) => c.category === 'followup').length;

  const handleSelectContact = (contact: ContactLead) => {
    HapticTap.light();
    router.push({
      pathname: '/leads/[leadId]',
      params: { leadId: contact.id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <AppIcon name="chevron-left" size={20} color={C.text} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="bold">
            Contacts
          </AppText>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => {
              HapticTap.light();
              setShowSearch((prev) => !prev);
            }}
            hitSlop={8}
          >
            <AppIcon name="search" size={18} color={C.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.headerIconBtn}
            onPress={() => {
              HapticTap.light();
            }}
            hitSlop={8}
          >
            <AppIcon name="filter" size={18} color={C.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Optional Search Bar */}
      {showSearch && (
        <View style={styles.searchBarWrap}>
          <View style={styles.searchBarInner}>
            <AppIcon name="search" size={16} color={C.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon name="x" size={16} color={C.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      {/* Filter Tabs: All (12) | New (5) | Follow-up (1) */}
      <View style={styles.filterTabsRow}>
        <Pressable
          style={[
            styles.filterTabPill,
            activeTab === 'all' && styles.filterTabPillActive,
          ]}
          onPress={() => {
            HapticTap.light();
            setActiveTab('all');
          }}
        >
          <AppText
            style={[
              styles.filterTabText,
              activeTab === 'all' && styles.filterTabTextActive,
            ]}
            weight={activeTab === 'all' ? 'bold' : undefined}
          >
            All ({allCount})
          </AppText>
        </Pressable>

        <Pressable
          style={[
            styles.filterTabPill,
            activeTab === 'new' && styles.filterTabPillActive,
          ]}
          onPress={() => {
            HapticTap.light();
            setActiveTab('new');
          }}
        >
          <AppText
            style={[
              styles.filterTabText,
              activeTab === 'new' && styles.filterTabTextActive,
            ]}
            weight={activeTab === 'new' ? 'bold' : undefined}
          >
            New ({newCount})
          </AppText>
        </Pressable>

        <Pressable
          style={[
            styles.filterTabPill,
            activeTab === 'followup' && styles.filterTabPillActive,
          ]}
          onPress={() => {
            HapticTap.light();
            setActiveTab('followup');
          }}
        >
          <AppText
            style={[
              styles.filterTabText,
              activeTab === 'followup' && styles.filterTabTextActive,
            ]}
            weight={activeTab === 'followup' ? 'bold' : undefined}
          >
            Follow-up ({followCount})
          </AppText>
        </Pressable>
      </View>

      {/* Contacts List */}
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          <View style={styles.contactsBox}>
            {filteredContacts.map((contact, index) => {
              const initials = contact.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <React.Fragment key={contact.id}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.contactRow,
                      pressed && styles.contactRowPressed,
                    ]}
                    onPress={() => handleSelectContact(contact)}
                  >
                    {/* Avatar */}
                    {contact.avatar ? (
                      <Image source={contact.avatar} style={styles.contactAvatarImg} />
                    ) : (
                      <View style={styles.avatarCircle}>
                        <AppText style={styles.avatarInitials} weight="bold">
                          {initials}
                        </AppText>
                      </View>
                    )}

                    {/* Details */}
                    <View style={styles.contactDetails}>
                      <AppText style={styles.contactName} weight="bold">
                        {contact.name}
                      </AppText>
                      <AppText style={styles.contactSub}>
                        {contact.company} · {contact.title}
                      </AppText>
                      <View style={styles.contactSourceRow}>
                        <AppText style={styles.sourceTag}>
                          {contact.source}
                        </AppText>
                        <AppText style={styles.dotSeparator}>·</AppText>
                        <AppText style={styles.timeAgoText}>
                          {contact.timeAgo}
                        </AppText>
                      </View>
                    </View>

                    <AppIcon name="chevron-right" size={16} color={C.textMuted} />
                  </Pressable>

                  {index < filteredContacts.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <View style={{ height: 110 }} />
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterTabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterTabPillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  filterTabText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  contactsBox: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  contactRowPressed: {
    backgroundColor: C.surfaceRaised,
  },
  contactAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: '#000000',
    marginRight: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    fontSize: 15,
    color: C.text,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    color: C.text,
  },
  contactSub: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  contactSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  sourceTag: {
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: 11,
    color: C.textMuted,
  },
  timeAgoText: {
    fontSize: 11,
    color: C.textMuted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 74,
  },
});

/**
 * LeadsScreen — 19 Captured Leads CRM (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 19 — Captured Leads List (Search, filter by intent, status pill, CSV export)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';
import {
  fetchOwnerLeads,
  toggleLeadFollowedUp,
  type QualifiedLead,
  type LeadIntent,
} from '@/src/services/leadWorkflowService';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  accentSubtle: 'rgba(37, 150, 190, 0.15)',
  success: '#34C759',
  warning: '#FF9500',
} as const;

const FILTER_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'services', label: 'Services' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'investment', label: 'Investment' },
  { id: 'networking', label: 'Networking' },
];

export default function LeadsScreen() {
  const { user } = useAuth();
  const ownerId = user?.id ?? 'demo_owner';

  const [leads, setLeads] = useState<QualifiedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchOwnerLeads(ownerId, 50);
      if (fetched.length > 0) {
        setLeads(fetched);
      } else {
        // Fallback realistic demo leads
        setLeads([
          {
            id: 'lead-1',
            ownerId,
            name: 'Sarah Chen',
            contactInfo: '+1 (555) 234-5678',
            intent: 'services',
            intentLabel: 'Services',
            note: 'Enterprise NFC rollout for 45 partner executives.',
            followedUp: false,
          },
          {
            id: 'lead-2',
            ownerId,
            name: 'Raj Patel',
            contactInfo: 'raj@patelcapital.com',
            intent: 'investment',
            intentLabel: 'Investment',
            note: 'Met at FinTech Summit. Evaluating Series A allocation.',
            followedUp: true,
          },
          {
            id: 'lead-3',
            ownerId,
            name: 'Emma Liu',
            contactInfo: 'eliu@vertexio.com',
            intent: 'partnership',
            intentLabel: 'Partnership',
            note: 'Discussing co-branded smart cards integration.',
            followedUp: false,
          },
          {
            id: 'lead-4',
            ownerId,
            name: 'David Kim',
            contactInfo: '+855 12 888 999',
            intent: 'networking',
            intentLabel: 'Networking',
            note: 'Connected at Metfone Innovation Day.',
            followedUp: true,
          },
        ]);
      }
    } catch {
      // Mock on error
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleToggle = useCallback(async (lead: QualifiedLead) => {
    if (!lead.id) return;
    HapticTap.light();
    const newStatus = !lead.followedUp;
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, followedUp: newStatus } : l))
    );
    try {
      await toggleLeadFollowedUp(lead.id, lead.followedUp);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleExportCSV = useCallback(async () => {
    HapticTap.confidentClick();
    const headers = 'Name,Contact,Intent,Note,Status\n';
    const rows = leads
      .map(
        (l) =>
          `"${l.name}","${l.contactInfo}","${l.intentLabel}","${l.note || ''}","${
            l.followedUp ? 'Followed Up' : 'Pending'
          }"`
      )
      .join('\n');
    try {
      await Share.share({
        title: 'NFC_Captured_Leads.csv',
        message: headers + rows,
      });
    } catch {
      // dismissed
    }
  }, [leads]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactInfo.toLowerCase().includes(search.toLowerCase()) ||
      (lead.note && lead.note.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      activeFilter === 'all' || lead.intent === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <AppIcon name="ChevronLeft" size={24} color={C.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <AppText style={styles.headerTitle} weight="bold">
            Captured Leads
          </AppText>
          <AppText style={styles.leadCountBadge}>{leads.length} contacts</AppText>
        </View>
        <Pressable
          onPress={handleExportCSV}
          hitSlop={10}
          style={styles.exportBtn}
        >
          <AppIcon name="share" size={18} color={C.accent} />
          <AppText style={styles.exportText} weight="medium">
            Export
          </AppText>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <AppIcon name="search" size={16} color={C.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or notes..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => {
                HapticTap.light();
                setActiveFilter(tab.id);
              }}
            >
              <AppText
                style={[styles.filterText, active && styles.filterTextActive]}
                weight={active ? 'bold' : 'regular'}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Lead List */}
      <IosScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : filteredLeads.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="Users" size={28} color={C.textMuted} />
            </View>
            <AppText style={styles.emptyTitle} weight="bold">
              No Leads Found
            </AppText>
            <AppText style={styles.emptySubtitle}>
              Tap your card or share your profile to capture contacts directly to your phone.
            </AppText>
          </View>
        ) : (
          filteredLeads.map((lead) => {
            const isFollowed = lead.followedUp;
            return (
              <Pressable
                key={lead.id}
                style={({ pressed }) => [
                  styles.leadCard,
                  pressed && styles.leadCardPressed,
                ]}
                onPress={() => {
                  HapticTap.light();
                  router.push(`/leads/${lead.id}` as any);
                }}
              >
                <View style={styles.leadHeader}>
                  <View style={styles.avatarWrap}>
                    <AppText style={styles.avatarInitials} weight="bold">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.leadInfo}>
                    <AppText style={styles.leadName} weight="bold">
                      {lead.name}
                    </AppText>
                    <AppText style={styles.leadContact}>{lead.contactInfo}</AppText>
                  </View>
                  <View
                    style={[
                      styles.intentPill,
                      { backgroundColor: C.accentSubtle },
                    ]}
                  >
                    <AppText style={styles.intentText} weight="bold">
                      {lead.intentLabel.toUpperCase()}
                    </AppText>
                  </View>
                </View>

                {lead.note && (
                  <View style={styles.noteBox}>
                    <AppText style={styles.noteText} numberOfLines={2}>
                      "{lead.note}"
                    </AppText>
                  </View>
                )}

                <View style={styles.leadFooter}>
                  <Pressable
                    style={styles.statusToggle}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggle(lead);
                    }}
                    hitSlop={8}
                  >
                    <View
                      style={[
                        styles.toggleDot,
                        { backgroundColor: isFollowed ? C.success : C.warning },
                      ]}
                    />
                    <AppText style={styles.statusLabel}>
                      {isFollowed ? 'Followed Up' : 'Needs Follow-up'}
                    </AppText>
                  </Pressable>

                  <AppIcon name="ChevronRight" size={16} color={C.textMuted} />
                </View>
              </Pressable>
            );
          })
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.4,
  },
  leadCountBadge: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1,
    borderColor: C.border,
  },
  exportText: {
    fontSize: 13,
    color: C.accent,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.surfaceRaised,
    borderColor: C.accent,
  },
  filterText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  filterTextActive: {
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    color: C.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  leadCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  leadCardPressed: {
    backgroundColor: C.surfaceRaised,
    transform: [{ scale: 0.99 }],
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 15,
    color: C.text,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  leadContact: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  intentPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  intentText: {
    fontSize: 10,
    color: C.accent,
    letterSpacing: 0.5,
  },
  noteBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftWidth: 2,
    borderLeftColor: C.accent,
  },
  noteText: {
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  leadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: C.textSecondary,
  },
});

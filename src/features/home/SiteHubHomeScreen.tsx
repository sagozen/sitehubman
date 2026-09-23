import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';
import {
  fetchOwnerLeads,
  toggleLeadFollowedUp,
  QualifiedLead,
} from '@/src/services/leadWorkflowService';
import { ConnectIntentModal } from '@/src/components/ConnectIntentModal';
import { CardSuccessShareModal } from '@/src/features/guest/CardSuccessShareModal';
import { EmptyCardState } from '@/src/components/EmptyCardState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_MAX_WIDTH = 600;

export function SiteHubHomeScreen() {
  const { user, signOutUser } = useAuth();
  const [leads, setLeads] = useState<QualifiedLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ownerId = user?.id ?? 'demo_owner';
  const ownerName = user?.displayName || 'Alexander Wright';
  const companyTitle = (user as any)?.jobTitle || 'Managing Partner · Apex Ventures';

  const triggerToast = useCallback((msg: string) => {
    HapticTap.light();
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const fetched = await fetchOwnerLeads(ownerId, 10);
      setLeads(fetched);
    } catch {
      setLeads([
        {
          id: 'lead-1',
          ownerId,
          name: 'Sarah Chen',
          contactInfo: '+1 (555) 234-5678',
          intent: 'services',
          intentLabel: 'Services',
          note: 'Enterprise NFC rollout for executive partners.',
          followedUp: false,
        },
        {
          id: 'lead-2',
          ownerId,
          name: 'Raj Patel',
          contactInfo: 'raj@patelcapital.com',
          intent: 'investment',
          intentLabel: 'Investment',
          note: 'Evaluating Series A allocation.',
          followedUp: true,
        },
        {
          id: 'lead-3',
          ownerId,
          name: 'Emma Liu',
          contactInfo: 'eliu@vertexio.com',
          intent: 'partnership',
          intentLabel: 'Partnership',
          note: 'Co-branded team onboarding.',
          followedUp: false,
        },
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFollowup = useCallback(
    async (lead: QualifiedLead) => {
      if (!lead.id) return;
      HapticTap.light();
      const newStatus = !lead.followedUp;
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, followedUp: newStatus } : l))
      );
      await toggleLeadFollowedUp(lead.id, lead.followedUp);
      triggerToast(newStatus ? 'Marked as followed up' : 'Moved to active');
    },
    [triggerToast]
  );

  const handleExportCSV = useCallback(async () => {
    HapticTap.medium();
    const headers = 'Name,Contact,Intent,Status\n';
    const rows = leads
      .map(
        (l) =>
          `"${l.name}","${l.contactInfo}","${l.intentLabel}","${
            l.followedUp ? 'Followed Up' : 'Pending'
          }"`
      )
      .join('\n');
    try {
      await Share.share({
        title: 'SiteHub_Connections.csv',
        message: headers + rows,
      });
    } catch (e) {
      console.error(e);
    }
  }, [leads]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#0A84FF"
          />
        }
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileRow}>
              <Pressable
                onPress={() => router.push('/(tabs)/profile' as any)}
                hitSlop={8}
                style={styles.avatar}
              >
                <AppText style={styles.avatarInitials} weight="bold">
                  {ownerName.substring(0, 2).toUpperCase()}
                </AppText>
              </Pressable>
              <View style={styles.profileInfo}>
                <AppText style={styles.profileName} weight="bold">
                  {ownerName}
                </AppText>
                <AppText style={styles.profileTitle} numberOfLines={1}>
                  {user?.isGuest ? 'Guest Session' : companyTitle}
                </AppText>
              </View>
            </View>

            <View style={styles.headerActions}>
              {user?.isGuest ? (
                <Pressable
                  style={styles.signInButton}
                  onPress={() => router.push('/(auth)/login' as any)}
                  hitSlop={8}
                >
                  <AppText style={styles.signInText} weight="medium">
                    Sign In
                  </AppText>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.iconButton}
                  onPress={() => {
                    HapticTap.medium();
                    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: async () => {
                          await signOutUser();
                          router.replace('/(auth)/login' as any);
                        },
                      },
                    ]);
                  }}
                  hitSlop={8}
                >
                  <AppIcon name="LogOut" size={18} color="#8E8E93" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Business Card Section */}
          {user?.isGuest && !user?.displayName ? (
            <EmptyCardState />
          ) : (
            <View style={styles.cardSection}>
              <View style={styles.cardPreview}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardChip}>
                    <AppIcon name="Radio" size={14} color="#0A84FF" />
                    <AppText style={styles.cardChipText} weight="medium">
                      NFC Active
                    </AppText>
                  </View>
                  <AppText style={styles.cardBrand} weight="bold">
                    SiteHub
                  </AppText>
                </View>

                <View style={styles.cardBody}>
                  <AppText style={styles.cardHolderName} weight="bold">
                    {ownerName}
                  </AppText>
                  <AppText style={styles.cardHolderTitle} numberOfLines={1}>
                    {companyTitle}
                  </AppText>
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.primaryActionButton}
                    onPress={() => {
                      HapticTap.light();
                      setShowShareModal(true);
                    }}
                    hitSlop={8}
                  >
                    <AppIcon name="Share2" size={16} color="#FFFFFF" />
                    <AppText style={styles.primaryActionText} weight="bold">
                      Share Card
                    </AppText>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryActionButton}
                    onPress={() => {
                      HapticTap.light();
                      setShowConnectModal(true);
                    }}
                    hitSlop={8}
                  >
                    <AppIcon name="Radio" size={16} color="#0A84FF" />
                    <AppText style={styles.secondaryActionText} weight="medium">
                      Simulate Tap
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Activity Overview */}
          <View style={styles.section}>
            <AppText style={styles.sectionHeading} weight="bold">
              Activity
            </AppText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppText style={styles.statValue} weight="bold">
                  248
                </AppText>
                <AppText style={styles.statLabel}>Card Taps</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={styles.statValue} weight="bold">
                  36
                </AppText>
                <AppText style={styles.statLabel}>Saved Contacts</AppText>
              </View>
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: '#0A84FF' }]} weight="bold">
                  {leads.length}
                </AppText>
                <AppText style={styles.statLabel}>Active Leads</AppText>
              </View>
            </View>
          </View>

          {/* Recent Connections */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionHeading} weight="bold">
                Recent Connections
              </AppText>
              <Pressable
                onPress={() => router.push('/(tabs)/connections' as any)}
                hitSlop={8}
              >
                <AppText style={styles.sectionLink} weight="medium">
                  View All
                </AppText>
              </Pressable>
            </View>

            {leads.length === 0 ? (
              <View style={styles.emptyConnections}>
                <AppText style={styles.emptyTitle} weight="medium">
                  No connections yet
                </AppText>
                <AppText style={styles.emptyText}>
                  Share your card or tap an NFC device to capture your first contact.
                </AppText>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => setShowShareModal(true)}
                  hitSlop={8}
                >
                  <AppText style={styles.emptyButtonText} weight="bold">
                    Share Card
                  </AppText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.leadsList}>
                {leads.slice(0, 4).map((lead, idx) => (
                  <View
                    key={lead.id ?? `lead-${idx}`}
                    style={styles.leadRow}
                  >
                    <View style={styles.leadAvatar}>
                      <AppText style={styles.leadInitials} weight="bold">
                        {lead.name.substring(0, 2).toUpperCase()}
                      </AppText>
                    </View>

                    <View style={styles.leadInfo}>
                      <AppText style={styles.leadName} weight="medium">
                        {lead.name}
                      </AppText>
                      <AppText style={styles.leadContact} numberOfLines={1}>
                        {lead.intentLabel ? `${lead.intentLabel} · ` : ''}{lead.contactInfo}
                      </AppText>
                    </View>

                    <Pressable
                      style={[
                        styles.checkButton,
                        lead.followedUp && styles.checkButtonDone,
                      ]}
                      onPress={() => handleToggleFollowup(lead)}
                      hitSlop={12}
                    >
                      <AppIcon
                        name={lead.followedUp ? 'Check' : 'Clock'}
                        size={14}
                        color={lead.followedUp ? '#30D158' : '#8E8E93'}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Tools */}
          <View style={styles.section}>
            <AppText style={styles.sectionHeading} weight="bold">
              Quick Actions
            </AppText>
            <View style={styles.toolsGrid}>
              <Pressable
                style={styles.toolItem}
                onPress={() => router.push('/(tabs)/profile' as any)}
                hitSlop={8}
              >
                <AppIcon name="Edit3" size={18} color="#0A84FF" />
                <AppText style={styles.toolLabel} weight="medium">
                  Edit Card
                </AppText>
              </Pressable>

              <Pressable
                style={styles.toolItem}
                onPress={() => setShowShareModal(true)}
                hitSlop={8}
              >
                <AppIcon name="QrCode" size={18} color="#0A84FF" />
                <AppText style={styles.toolLabel} weight="medium">
                  QR Code
                </AppText>
              </Pressable>

              <Pressable
                style={styles.toolItem}
                onPress={handleExportCSV}
                hitSlop={8}
              >
                <AppIcon name="Download" size={18} color="#0A84FF" />
                <AppText style={styles.toolLabel} weight="medium">
                  Export CSV
                </AppText>
              </Pressable>

              <Pressable
                style={styles.toolItem}
                onPress={() => router.push('/(tabs)/settings' as any)}
                hitSlop={8}
              >
                <AppIcon name="Settings" size={18} color="#0A84FF" />
                <AppText style={styles.toolLabel} weight="medium">
                  Settings
                </AppText>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Simple Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <AppText style={styles.toastText} weight="medium">
            {toastMessage}
          </AppText>
        </View>
      )}

      {/* Connect Intent Modal */}
      <ConnectIntentModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        ownerId={ownerId}
        ownerName={ownerName}
        onSuccess={() => loadData()}
      />

      {/* Share Modal */}
      <CardSuccessShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={`https://sitehub.app/u/${user?.id ?? 'demo'}`}
        name={ownerName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  profileTitle: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  signInText: {
    color: '#000000',
    fontSize: 13,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Business Card ──
  cardSection: {
    marginTop: 8,
    marginBottom: 28,
  },
  cardPreview: {
    backgroundColor: '#141416',
    borderRadius: 14,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  cardChipText: {
    color: '#0A84FF',
    fontSize: 11,
  },
  cardBrand: {
    color: '#8E8E93',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 24,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  cardHolderTitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#0A84FF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  secondaryActionButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: '#0A84FF',
    fontSize: 14,
  },

  // ── Sections ──
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  sectionLink: {
    color: '#0A84FF',
    fontSize: 13,
  },

  // ── Activity Stats ──
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },

  // ── Recent Connections List ──
  leadsList: {
    gap: 12,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  leadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16161A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadInitials: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  leadContact: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16161A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDone: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
  },

  // ── Empty Connections ──
  emptyConnections: {
    backgroundColor: '#141416',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0A84FF',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },

  // ── Quick Tools ──
  toolsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toolItem: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  toolLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },

  // ── Toast ──
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});

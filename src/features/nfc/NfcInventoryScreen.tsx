/**
 * NFC Inventory Management Screen
 * 
 * Track all physical NFC tags: encoded, pending, defective, in-stock
 * Critical for production scaling to 1M users
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { theme } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';

type NfcTagStatus = 'in_stock' | 'encoded' | 'pending' | 'defective' | 'returned';

interface NfcTag {
  id: string;
  uidHash: string;
  cardId?: string;
  userId?: string;
  status: NfcTagStatus;
  batchId?: string;
  writtenAt?: string;
  createdAt: Timestamp;
  lastVerifiedAt?: string;
  defectReason?: string;
}

interface InventoryStats {
  total: number;
  inStock: number;
  encoded: number;
  pending: number;
  defective: number;
}

export default function NfcInventoryScreen() {
  const router = useRouter();
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    inStock: 0,
    encoded: 0,
    pending: 0,
    defective: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<NfcTagStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Load tags with pagination
      const tagsRef = collection(db, 'nfc_tags');
      let tagsQuery = query(
        tagsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (selectedFilter !== 'all') {
        tagsQuery = query(
          tagsRef,
          where('status', '==', selectedFilter),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const [tagsSnap, statsSnap] = await Promise.all([
        getDocs(tagsQuery),
        getDocs(collection(db, 'nfc_tags')),
      ]);

      const loadedTags: NfcTag[] = tagsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as NfcTag));

      setTags(loadedTags);

      // Calculate stats
      const statsData = statsSnap.docs.reduce(
        (acc, doc) => {
          const tag = doc.data() as NfcTag;
          acc.total++;
          if (tag.status === 'in_stock') acc.inStock++;
          else if (tag.status === 'encoded') acc.encoded++;
          else if (tag.status === 'pending') acc.pending++;
          else if (tag.status === 'defective') acc.defective++;
          return acc;
        },
        { total: 0, inStock: 0, encoded: 0, pending: 0, defective: 0 }
      );

      setStats(statsData);
    } catch (error) {
      console.error('[NFC Inventory] Load failed', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleRefresh = useCallback(() => {
    HapticTap.light();
    loadInventory(true);
  }, [loadInventory]);

  const handleFilterChange = useCallback((filter: NfcTagStatus | 'all') => {
    HapticTap.light();
    setSelectedFilter(filter);
  }, []);

  const handleTagPress = useCallback((tag: NfcTag) => {
    HapticTap.medium();
    // Navigate to tag detail/edit screen
    router.push(`/nfc/tag/${tag.id}` as any);
  }, [router]);

  const handleBatchWrite = useCallback(() => {
    HapticTap.medium();
    router.push('/nfc/batch-write' as any);
  }, [router]);

  const filteredTags = useMemo(() => {
    if (selectedFilter === 'all') return tags;
    return tags.filter((tag) => tag.status === selectedFilter);
  }, [tags, selectedFilter]);

  const getStatusColor = (status: NfcTagStatus): string => {
    switch (status) {
      case 'in_stock': return '#A1A1AA';
      case 'encoded': return '#FFFFFF'; // Use white for success (monochrome)
      case 'pending': return '#A1A1AA';
      case 'defective': return '#52525B';
      case 'returned': return '#52525B';
      default: return '#A1A1AA';
    }
  };

  const getStatusLabel = (status: NfcTagStatus): string => {
    return status.replace('_', ' ').toUpperCase();
  };

  const renderStatCard = (
    label: string,
    count: number,
    filter: NfcTagStatus | 'all',
    iconName: string
  ) => {
    const isSelected = selectedFilter === filter;

    return (
      <Pressable
        style={[styles.statCard, isSelected && styles.statCardActive]}
        onPress={() => handleFilterChange(filter)}
      >
        <AppIcon name={iconName as any} size={24} color={isSelected ? '#2596BE' : '#A1A1AA'} />
        <AppText style={[styles.statCount, isSelected && styles.statCountActive]} weight="bold">
          {count}
        </AppText>
        <AppText style={[styles.statLabel, isSelected && styles.statLabelActive]}>
          {label}
        </AppText>
      </Pressable>
    );
  };

  const renderTag = ({ item }: { item: NfcTag }) => (
    <Pressable style={styles.tagCard} onPress={() => handleTagPress(item)}>
      <View style={styles.tagHeader}>
        <View style={styles.tagInfo}>
          <AppText weight="bold" style={styles.tagId}>
            {item.uidHash.slice(0, 12)}...
          </AppText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <AppText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </AppText>
          </View>
        </View>
        <AppIcon name="ChevronRight" size={20} color="#52525B" />
      </View>

      {item.cardId && (
        <AppText style={styles.tagDetail}>Card: {item.cardId.slice(0, 8)}...</AppText>
      )}
      {item.batchId && (
        <AppText style={styles.tagDetail}>Batch: {item.batchId}</AppText>
      )}
      {item.writtenAt && (
        <AppText style={styles.tagDetail}>
          Written: {new Date(item.writtenAt).toLocaleDateString()}
        </AppText>
      )}
      {item.defectReason && (
        <AppText style={[styles.tagDetail, { color: '#FF453A' }]}>
          ⚠️ {item.defectReason}
        </AppText>
      )}
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <AppIcon name="Package" size={64} color="#52525B" />
      <AppText style={styles.emptyTitle} weight="bold">
        No NFC tags found
      </AppText>
      <AppText style={styles.emptySubtitle}>
        {selectedFilter === 'all'
          ? 'Start by registering NFC tags in your inventory'
          : `No tags with status: ${selectedFilter}`}
      </AppText>
      <AppButton
        title="Start Batch Write"
        onPress={handleBatchWrite}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText style={styles.title} weight="bold">
          NFC Inventory
        </AppText>
        <AppText style={styles.subtitle}>
          Track all physical tags and production status
        </AppText>
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('All', stats.total, 'all', 'Layers')}
        {renderStatCard('Stock', stats.inStock, 'in_stock', 'Package')}
        {renderStatCard('Encoded', stats.encoded, 'encoded', 'CheckCircle')}
        {renderStatCard('Pending', stats.pending, 'pending', 'Clock')}
        {renderStatCard('Defective', stats.defective, 'defective', 'XCircle')}
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Batch Write"
          onPress={handleBatchWrite}
          leftIcon="Edit"
          variant="primary"
          style={styles.actionButton}
        />
        <AppButton
          title="Scan Tag"
          onPress={() => router.push('/nfc/write' as any)}
          leftIcon="Scan"
          variant="secondary"
          style={styles.actionButton}
        />
      </View>

      <FlatList
        data={filteredTags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredTags.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2596BE"
            colors={['#2596BE']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9A9AA0',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0E0E11',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statCardActive: {
    borderColor: '#2596BE',
    backgroundColor: '#2596BE10',
  },
  statCount: {
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 2,
  },
  statCountActive: {
    color: '#2596BE',
  },
  statLabel: {
    fontSize: 11,
    color: '#9A9AA0',
    textTransform: 'uppercase',
  },
  statLabelActive: {
    color: '#2596BE',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  tagCard: {
    backgroundColor: '#0E0E11',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tagId: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tagDetail: {
    fontSize: 13,
    color: '#9A9AA0',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9A9AA0',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});

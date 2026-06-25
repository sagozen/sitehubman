/**
 * CustomerConnectionsScreen (Moments CRM)
 * A premium, Apple-inspired CRM that groups interactions by person.
 * Built with FlatList for 60fps performance with 10k+ records.
 */
import { memo, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { AppText } from '@/src/components/AppText';

import { MomentsSearchAndFilter } from './components/moments/MomentsSearchAndFilter';
import { PersonMomentCard, type PersonMoment } from './components/moments/PersonMomentCard';

const FAKE_MOMENTS: PersonMoment[] = [
  {
    id: '1',
    name: 'Sok Dara',
    title: 'Founder',
    company: 'Mekong Labs',
    avatar: 'https://i.pravatar.cc/150?img=68',
    interactionsCount: 4,
    lastSeen: '2 hours ago',
    badge: 'Warm Lead',
    timeline: [
      { time: '09:20', action: 'NFC Tap', type: 'nfc' },
      { time: '09:45', action: 'QR Scan', type: 'qr' },
      { time: '10:10', action: 'Viewed Profile', type: 'view' },
      { time: '10:30', action: 'Saved Contact', type: 'save' },
    ]
  },
  {
    id: '2',
    name: 'Chan Rithy',
    title: 'Marketing Director',
    company: 'Smart Axiata',
    avatar: 'https://i.pravatar.cc/150?img=11',
    interactionsCount: 2,
    lastSeen: '5 hours ago',
    badge: '',
    timeline: [
      { time: '11:00', action: 'Viewed Profile', type: 'view' },
      { time: '11:15', action: 'Shared Card', type: 'share' },
    ]
  },
  {
    id: '3',
    name: 'Vanna Nget',
    title: 'CEO',
    company: 'Tech Startup',
    avatar: 'https://i.pravatar.cc/150?img=32',
    interactionsCount: 1,
    lastSeen: 'Yesterday',
    badge: 'New',
    timeline: [
      { time: '14:20', action: 'NFC Tap', type: 'nfc' },
    ]
  }
];

export function CustomerConnectionsScreen() {
  
  // Combine all Level 1 -> Level 3 content into a single ListHeaderComponent
  const renderHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      
      {/* Search and Filters */}
      <MomentsSearchAndFilter />

      {/* List Header Label */}
      <View style={styles.listSectionHeader}>
        <AppText style={styles.listSectionTitle}>Today</AppText>
      </View>
    </View>
  ), []);

  const renderItem = ({ item }: { item: PersonMoment }) => (
    <PersonMomentCard person={item} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={FAKE_MOMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F7', // iOS grey
  },
  headerContainer: {
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: -1,
  },
  listContent: {
    paddingBottom: 120, // Space for Liquid Tab Bar
  },
  listSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

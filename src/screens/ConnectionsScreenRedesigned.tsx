/**
 * Connections Screen - Redesigned
 * Using principles from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * 
 * Linear's list with Tesla's information density
 */

import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, TextInput } from 'react-native';

import { tokens } from '@/design-system/extracted-tokens';

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTIONS SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function ConnectionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const connections = [
    { id: 1, name: 'Sarah Johnson', handle: 'sarahj', date: '2 days ago', mutual: 12 },
    { id: 2, name: 'Mike Chen', handle: 'mikechen', date: '1 week ago', mutual: 8 },
    { id: 3, name: 'Emma Wilson', handle: 'emmaw', date: '2 weeks ago', mutual: 5 },
    { id: 4, name: 'David Brown', handle: 'davidb', date: '1 month ago', mutual: 15 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[tokens.typography.display]}>
          Connections
        </Text>
        <Text style={[tokens.typography.detail, { color: tokens.color.textMedium, marginTop: tokens.spacing[1] }]}>
          42 connections
        </Text>
      </View>

      {/* Search - Apple's search pattern */}
      <View style={styles.searchSection}>
        <View style={styles.searchInput}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search connections"
            placeholderTextColor={tokens.color.textLight}
            style={[tokens.typography.body, { flex: 1, color: tokens.color.text }]}
          />
        </View>
      </View>

      {/* Connections List - Linear's pattern */}
      <View style={styles.list}>
        {connections.map((connection, index) => (
          <ConnectionItem 
            key={connection.id}
            name={connection.name}
            handle={connection.handle}
            date={connection.date}
            mutual={connection.mutual}
            isLast={index === connections.length - 1}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTION ITEM - Linear's list item with Tesla's density
// ═══════════════════════════════════════════════════════════════════════════

function ConnectionItem({ 
  name, 
  handle, 
  date, 
  mutual,
  isLast 
}: { 
  name: string; 
  handle: string; 
  date: string; 
  mutual: number;
  isLast: boolean;
}) {
  return (
    <Pressable style={[
      styles.connectionItem,
      !isLast && { borderBottomWidth: 0.5, borderBottomColor: tokens.color.borderLight }
    ]}>
      <View style={styles.connectionAvatar}>
        <Text style={[tokens.typography.body, { color: tokens.color.white, fontWeight: '600' }]}>
          {name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      
      <View style={{ flex: 1, gap: tokens.spacing[1] }}>
        <Text style={[tokens.typography.body, { fontWeight: '500' }]}>
          {name}
        </Text>
        <Text style={[tokens.typography.detail, { color: tokens.color.textMedium }]}>
          @{handle} · {date}
        </Text>
      </View>
      
      <View style={styles.mutualBadge}>
        <Text style={[tokens.typography.caption, { color: tokens.color.textMedium }]}>
          {mutual} mutual
        </Text>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.white,
  },
  content: {
    paddingHorizontal: tokens.spacing.screenX,
    paddingVertical: tokens.spacing.screenY,
  },
  
  // Header
  header: {
    marginBottom: tokens.spacing[8],
  },
  
  // Search (Apple's search pattern)
  searchSection: {
    marginBottom: tokens.spacing[10],
  },
  searchInput: {
    height: 48,
    borderRadius: tokens.radius.input,
    backgroundColor: tokens.color.surfaceVariant,
    paddingHorizontal: tokens.spacing[4],
    justifyContent: 'center',
  },
  
  // List (Linear's 64px height)
  list: {
    borderRadius: tokens.radius.card,
    borderWidth: 0.5,
    borderColor: tokens.color.border,
    overflow: 'hidden',
  },
  connectionItem: {
    height: 64,
    paddingHorizontal: tokens.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  connectionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.color.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutualBadge: {
    paddingVertical: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[2],
  },
});

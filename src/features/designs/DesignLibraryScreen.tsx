/**
 * Design Library Screen
 * 
 * Saved templates and custom designs
 * Monochrome brand-compliant design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { EmptyState } from '@/src/components/EmptyState';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { useDebouncedInput } from '@/src/hooks/useDebouncedInput';
import { CardListSkeleton } from '@/src/components/SkeletonLoader';

type DesignCategory = 'all' | 'saved' | 'templates' | 'recent';

interface Design {
  id: string;
  name: string;
  category: string;
  preview: string;
  createdAt: any;
  lastUsed?: any;
  timesUsed: number;
  isFavorite: boolean;
  tags: string[];
}

export default function DesignLibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<DesignCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const debouncedSearch = useDebouncedInput(setSearchQuery, 300);

  useEffect(() => {
    loadDesigns();
  }, [category]);

  const loadDesigns = useCallback(async () => {
    try {
      setLoading(true);
      const designsRef = collection(db, 'designs');
      let designsQuery = query(
        designsRef,
        where('userId', '==', user?.id || ''),
        orderBy('createdAt', 'desc')
      );

      const designsSnap = await getDocs(designsQuery);
      const designsData = designsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Design[];

      setDesigns(designsData);
    } catch (error) {
      console.error('[DesignLibrary] Load failed', error);
      // Fallback to mock data
      setDesigns([
        {
          id: 'design_1',
          name: 'Minimalist Black',
          category: 'saved',
          preview: 'https://via.placeholder.com/300x180/18181B/FFFFFF?text=Minimalist+Black',
          createdAt: new Date(),
          timesUsed: 12,
          isFavorite: true,
          tags: ['minimal', 'professional'],
        },
        {
          id: 'design_2',
          name: 'Business Card Pro',
          category: 'templates',
          preview: 'https://via.placeholder.com/300x180/27272A/A1A1AA?text=Business+Card+Pro',
          createdAt: new Date(),
          timesUsed: 8,
          isFavorite: false,
          tags: ['business', 'professional'],
        },
        {
          id: 'design_3',
          name: 'Modern Tech',
          category: 'templates',
          preview: 'https://via.placeholder.com/300x180/2596BE/FFFFFF?text=Modern+Tech',
          createdAt: new Date(),
          timesUsed: 5,
          isFavorite: true,
          tags: ['tech', 'modern'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [category, user]);

  const handleCategoryChange = useCallback((newCategory: DesignCategory) => {
    HapticTap.light();
    setCategory(newCategory);
  }, []);

  const handleDesignPress = useCallback((design: Design) => {
    HapticTap.medium();
    // Navigate to design editor with this design loaded
    router.push(`/design/edit?designId=${design.id}` as any);
  }, [router]);

  const handleToggleFavorite = useCallback(async (designId: string) => {
    HapticTap.light();
    setDesigns((prev) =>
      prev.map((d) =>
        d.id === designId ? { ...d, isFavorite: !d.isFavorite } : d
      )
    );
    // TODO: Update in Firestore
  }, []);

  const handleDeleteDesign = useCallback(async (designId: string) => {
    HapticTap.error();
    setDesigns((prev) => prev.filter((d) => d.id !== designId));
    // TODO: Delete from Firestore
  }, []);

  const filteredDesigns = useMemo(() => {
    let filtered = designs;

    // Category filter
    if (category === 'saved') {
      filtered = filtered.filter((d) => d.category === 'saved');
    } else if (category === 'templates') {
      filtered = filtered.filter((d) => d.category === 'templates');
    } else if (category === 'recent') {
      filtered = filtered.sort(
        (a, b) =>
          (b.lastUsed?.toDate?.()?.getTime() || 0) -
          (a.lastUsed?.toDate?.()?.getTime() || 0)
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [designs, category, searchQuery]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <CardListSkeleton />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title} weight="bold">
            Design Library
          </AppText>
          <AppText style={styles.subtitle}>
            {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''}
          </AppText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <AppIcon name="Search" size={20} color={T.textMuted} />
          <input
            type="text"
            placeholder="Search designs..."
            onChange={(e) => debouncedSearch.onChange(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: T.textPrimary,
              fontSize: T.fontSizeMD,
            }}
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryBar}>
          {(['all', 'saved', 'templates', 'recent'] as DesignCategory[]).map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryTab,
                category === cat && styles.categoryTabActive,
              ]}
              onPress={() => handleCategoryChange(cat)}
            >
              <AppText
                style={[
                  styles.categoryText,
                  category === cat && styles.categoryTextActive,
                ]}
                weight={category === cat ? 'bold' : 'regular'}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Designs Grid */}
        {filteredDesigns.length === 0 ? (
          <EmptyState
            icon="Image"
            title="No designs found"
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Create your first custom design'
            }
            actionLabel="Create Design"
            onAction={() => router.push('/design/new' as any)}
          />
        ) : (
          <View style={styles.designsGrid}>
            {filteredDesigns.map((design) => (
              <View key={design.id} style={styles.designCard}>
                {/* Preview */}
                <Pressable
                  style={styles.designPreview}
                  onPress={() => handleDesignPress(design)}
                >
                  <Image
                    source={{ uri: design.preview }}
                    style={styles.designImage}
                    resizeMode="cover"
                  />
                  
                  {/* Favorite Badge */}
                  {design.isFavorite && (
                    <View style={styles.favoriteBadge}>
                      <AppIcon name="Star" size={16} color={T.accent} />
                    </View>
                  )}

                  {/* Usage Count */}
                  {design.timesUsed > 0 && (
                    <View style={styles.usageBadge}>
                      <AppText style={styles.usageText}>
                        {design.timesUsed}x
                      </AppText>
                    </View>
                  )}
                </Pressable>

                {/* Details */}
                <View style={styles.designDetails}>
                  <View style={styles.designHeader}>
                    <AppText style={styles.designName} weight="bold" numberOfLines={1}>
                      {design.name}
                    </AppText>
                    <Pressable
                      onPress={() => handleToggleFavorite(design.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <AppIcon
                        name="Heart"
                        size={18}
                        color={design.isFavorite ? T.accent : T.textMuted}
                      />
                    </Pressable>
                  </View>

                  {/* Tags */}
                  <View style={styles.tagsRow}>
                    {design.tags.slice(0, 2).map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <AppText style={styles.tagText}>{tag}</AppText>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={styles.designActions}>
                    <Pressable
                      style={styles.designActionBtn}
                      onPress={() => handleDesignPress(design)}
                    >
                      <AppIcon name="Edit" size={16} color={T.textPrimary} />
                      <AppText style={styles.designActionText}>Edit</AppText>
                    </Pressable>
                    <Pressable
                      style={styles.designActionBtn}
                      onPress={() => handleDeleteDesign(design.id)}
                    >
                      <AppIcon name="Trash2" size={16} color={T.textMuted} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Create New Button */}
        <AppButton
          title="Create New Design"
          onPress={() => router.push('/design/new' as any)}
          variant="primary"
          leftIcon="Plus"
          style={styles.createButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  container: {
    padding: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: T.fontSizeXL,
    color: T.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  categoryBar: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: T.surface,
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: T.accent,
  },
  categoryText: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  designsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  designCard: {
    width: '100%',
    backgroundColor: T.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  designPreview: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: T.surfaceRaised,
  },
  designImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 6,
  },
  usageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: T.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  usageText: {
    fontSize: T.fontSizeXS,
    color: T.textPrimary,
    fontWeight: 'bold',
  },
  designDetails: {
    padding: 16,
    gap: 12,
  },
  designHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  designName: {
    flex: 1,
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: T.surfaceRaised,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: T.fontSizeXS,
    color: T.textSecondary,
  },
  designActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  designActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  designActionText: {
    fontSize: T.fontSizeSM,
    color: T.textPrimary,
  },
  createButton: {
    width: '100%',
    marginTop: 8,
  },
});

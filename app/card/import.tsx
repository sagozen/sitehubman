import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import {
  getCardProfileById,
  getCardProfileBySlug,
  saveCardProfile,
  type CardProfileData,
  type CardSocialLink,
} from '@/src/services/cardApiService';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';

export default function CardImportScreen() {
  const { cardId, slug, userId } = useLocalSearchParams<{
    cardId?: string;
    slug?: string;
    userId?: string;
  }>();

  const { user } = useAuth();
  const { colors, isDark } = usePreferences();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CardProfileData | null>(null);
  const [socialLinks, setSocialLinks] = useState<CardSocialLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadImportedCard() {
      setLoading(true);
      setError(null);

      try {
        let result: { profile: CardProfileData; socialLinks: CardSocialLink[] } | null = null;
        if (slug) {
          result = await getCardProfileBySlug(String(slug));
        }
        if (!result && cardId) {
          result = await getCardProfileById(String(cardId));
        }

        if (!mounted) return;

        if (result) {
          setProfile(result.profile);
          setSocialLinks(result.socialLinks);

          // Save card profile locally to current user account
          const ownerUid = user?.id || userId || result.profile.ownerUserId;
          await saveCardProfile(
            {
              ...result.profile,
              ownerUserId: ownerUid,
            },
            result.socialLinks
          );

          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setError('Card profile not found. Verify the URL or QR code and try again.');
        }
      } catch (err) {
        console.error('CardImportScreen error:', err);
        if (mounted) setError('Failed to connect and import card data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadImportedCard();

    return () => {
      mounted = false;
    };
  }, [cardId, slug, user?.id, userId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topHeader}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <AppIcon name="X" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={[styles.loadingText, { color: colors.textMuted }]}>
              Connecting to Web API & Linking Card to Phone...
            </AppText>
          </View>
        ) : error ? (
          <View style={[styles.cardSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.errorIconWrap}>
              <AppIcon name="AlertTriangle" size={32} color="#FF3B30" />
            </View>
            <AppText style={[styles.errorTitle, { color: colors.textPrimary }]}>Import Failed</AppText>
            <AppText style={[styles.errorSub, { color: colors.textMuted }]}>{error}</AppText>
            <AppButton
              label="Return Home"
              variant="primary"
              onPress={() => router.replace('/')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : profile ? (
          <View style={styles.content}>
            {/* Success Badge */}
            <View style={styles.badgeRow}>
              <View style={sBadgeStyles.dot} />
              <AppText style={sBadgeStyles.label}>CARD LINKED TO PHONE 📱</AppText>
            </View>

            {/* Profile Preview Card */}
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.surfaceElevated }]}>
                  <AppIcon name="User" size={32} color={colors.primary} />
                </View>
              )}

              <AppText style={[styles.profileName, { color: colors.textPrimary }]} weight="bold">
                {profile.name}
              </AppText>
              <AppText style={[styles.profileJob, { color: colors.primary }]} weight="semibold">
                {profile.jobType} · {profile.title}
              </AppText>

              {profile.bio ? (
                <AppText style={[styles.profileBio, { color: colors.textMuted }]}>
                  {profile.bio}
                </AppText>
              ) : null}

              {/* Vibes Badges */}
              {profile.vibes && profile.vibes.length > 0 ? (
                <View style={styles.vibesRow}>
                  {profile.vibes.map((vibe, idx) => (
                    <View
                      key={idx}
                      style={[styles.vibeTag, { backgroundColor: colors.surfaceElevated }]}
                    >
                      <AppText style={[styles.vibeText, { color: colors.textPrimary }]}>
                        ✨ {vibe}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Social Links Counter */}
              <View style={styles.metaRow}>
                <AppIcon name="Share" size={16} color={colors.textMuted} />
                <AppText style={[styles.metaText, { color: colors.textMuted }]}>
                  {socialLinks.length} Social Link{socialLinks.length === 1 ? '' : 's'} Configured
                </AppText>
              </View>
            </View>

            {/* Primary Action Buttons */}
            <View style={styles.actionsGroup}>
              <AppButton
                label="Write to Physical NFC Card 💳"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/activate-card?cardId=${profile.id}`);
                }}
              />

              <AppButton
                label="View Live Digital Pass"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/u/${profile.slug}`);
                }}
              />

              <AppButton
                label="Edit Profile & Social Links"
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => {
                  router.push('/edit-bio');
                }}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const sBadgeStyles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34C759',
    letterSpacing: 0.8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardSurface: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  errorIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,59,48,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    gap: 20,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  profileCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 6,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  profileName: {
    fontSize: 22,
    textAlign: 'center',
  },
  profileJob: {
    fontSize: 14,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  vibeTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  vibeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsGroup: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
});

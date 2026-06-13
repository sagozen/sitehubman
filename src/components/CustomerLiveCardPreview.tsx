import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { type Href, router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { GuestCardPreview } from '@/src/features/guest/GuestCardPreview';
import { GuestIdentityHero } from '@/src/features/guest/GuestHomeChrome';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import {
  loadCustomerCloudCard,
  type GuestCloudCard,
} from '@/src/services/guestCardDraftService';

type CustomerLiveCardPreviewProps = {
  userId: string;
  fallbackDisplayName?: string;
  showHeroWhenEmpty?: boolean;
};

export function CustomerLiveCardPreview({
  userId,
  fallbackDisplayName,
  showHeroWhenEmpty = true,
}: CustomerLiveCardPreviewProps) {
  const { colors } = useAppTheme();
  const [card, setCard] = useState<GuestCloudCard | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      setCard(await loadCustomerCloudCard(userId));
    } catch {
      setCard(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  function openFullPreview() {
    if (!card?.cardId) return;
    router.push(`/card-preview/${encodeURIComponent(card.cardId)}` as Href);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />
        <AppText variant="caption" tone="muted">
          Loading your card...
        </AppText>
      </View>
    );
  }

  if (!card) {
    return showHeroWhenEmpty ? <GuestIdentityHero colors={colors} onPress={() => router.push(appRoutes.guestDesign)} /> : null;
  }

  const profile = card.profile;
  const displayName = profile.fullName.trim() || fallbackDisplayName?.trim() || 'Your Name';

  return (
    <Pressable
      onPress={openFullPreview}
      style={({ pressed }) => [styles.previewPress, pressed && styles.previewPressed]}
      accessibilityRole="button"
      accessibilityLabel="Open full card preview"
    >
      <GuestCardPreview
        displayName={displayName}
        jobTitle={profile.role}
        company={profile.company}
        email={profile.email}
        phone={profile.phone}
        product={card.design.product ?? 'pvc_card'}
        cardDesign={card.design.cardDesign ?? 'classic_black'}
      />
      <AppText variant="caption" tone="muted" style={styles.hint}>
        Tap to open full preview
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  previewPress: {
    gap: theme.spacing.xs,
  },
  previewPressed: {
    opacity: 0.92,
  },
  hint: {
    textAlign: 'center',
  },
});

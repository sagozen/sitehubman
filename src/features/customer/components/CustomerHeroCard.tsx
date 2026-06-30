import { View, StyleSheet, Dimensions, Pressable, Image, type TextStyle, type ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { router } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';
import { HapticTap } from '@/src/utils/haptics';
import { MotionScale } from '@/src/utils/motion';
import { usePreferences } from '@/src/hooks/usePreferences';
import { SEED_CARDS } from '@/src/data/seedCards';
import { useBioPage } from '@/src/hooks/useBioPage';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import React, { useState, useEffect, useMemo } from 'react';
import { Animated, Easing } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const BRAND = '#2596BE';
const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const SURFACE = '#F4F4F6';

// Enhanced animations for micro-interactions
const useFloatAnimation = (delay: number) => {
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -4,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 4,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [translateY]);

  return { transform: [{ translateY }] };
};

const usePulseAnimation = () => {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scale]);

  return { transform: [{ scale }] };
};

const usePressAnimation = () => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return { scale, pressIn, pressOut };
};

export function CustomerHeroCard({ user }: any) {
  const { preferences, colors } = usePreferences();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<any>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Enhanced animations
  const floatAnim = useFloatAnimation(0);
  const pulseAnim = usePulseAnimation();
  const { scale: pressScale, pressIn, pressOut } = usePressAnimation();

  useEffect(() => {
    if (user?.id) {
      loadCustomerCloudCard(user.id).then(setCloudCard).catch(() => null);
    }
  }, [user?.id]);

  const cardName = bioPage?.displayName?.trim() || user?.displayName?.trim() || 'My Name';
  const cardTitle = bioPage?.tagline?.trim() || 'Digital Creator';
  const cardPhone = bioPage?.whatsapp?.trim() || user?.phone?.trim() || '';
  const cardEmail = bioPage?.email?.trim() || user?.email?.trim() || '';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : undefined;
  const photoUrl = bioPage?.photoUrl;

  const activeCardId = preferences.primaryCardId || 'card-current';

  const activeCard = useMemo(() => {
    if (activeCardId === 'card-current') {
      return {
        fullName: cardName,
        title: cardTitle,
        phone: cardPhone,
        email: cardEmail,
        website: profileUrl || '',
        profileUrl: profileUrl || `sitehubman.com/profile/${user?.id || 'demo'}`,
        backgroundImageUri: photoUrl,
      };
    }
    return SEED_CARDS.find(c => c.id === activeCardId) || SEED_CARDS[0];
  }, [activeCardId, cardName, cardTitle, cardPhone, cardEmail, profileUrl, photoUrl, user?.id]);

  const name = activeCard?.fullName || cardName;
  const title = activeCard?.title || cardTitle;

  const avatarUrl = photoUrl || user?.photoURL || user?.telegramPhotoUrl || '';
  const coverUrl = activeCard?.backgroundImageUri || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000';

  const initial = (name.trim() || 'C')[0].toUpperCase();

  const handlePressIn = () => {
    pressIn();
    setIsPressed(true);
    HapticTap.light();
  };

  const handlePressOut = () => {
    pressOut();
    setIsPressed(false);
  };

  const handlePress = () => {
    HapticTap.medium();
    router.push('/profile');
  };

  return (
    <View style={styles.container}>
      {/* ── ENHANCED PROFILE HEADER WITH SUBTLE ANIMATIONS ─── */}
      <View style={styles.profileHeader}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={({ pressed }) => [
            pressed && styles.pressed,
          ]}
        >
          <Animated.View style={[
            styles.profileAvatar,
            isHovering && styles.hovered,
            floatAnim,
          ]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImg} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText style={styles.profileAvatarT}>{initial}</AppText>
              </View>
            )}
          </Animated.View>
        </Pressable>

        <View style={styles.profileCopy}>
          <AppText variant="caption" weight="medium" color={MUTED}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
          </AppText>
          <View style={styles.profileNameRow}>
            <AppText variant="title2" weight="bold" color={INK} numberOfLines={1}>
              {name}
            </AppText>
            <AppIcon name="BadgeCheck" size={18} color={BRAND} weight="medium" />
          </View>
          <AppText variant="caption" weight="medium" color={MUTED} numberOfLines={1}>
            {title}
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              HapticTap.light();
              router.push(appRoutes.customer.notifications as any);
            }}
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && styles.pressed,
              isHovering && styles.hovered,
            ]}
          >
            <AppIcon name="Bell" size={19} color={INK} weight="medium" />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              HapticTap.medium();
              router.push('/cards/design');
            }}
            style={({ pressed }) => [
              pressed && styles.pressed,
            ]}
          >
            <Animated.View style={[
              styles.headerIcon,
              isHovering && styles.hovered,
              pulseAnim,
            ]}>
              <AppIcon name="Sparkles" size={20} color={BRAND} weight="medium" />
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* ── ENHANCED CARD WRAPPER WITH DEPTH AND INTERACTION ─── */}
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.cardElevation, pressScale, floatAnim]}>
          <NfcGlobalCardFace
            fullName={name}
            title={title}
            phone={activeCard?.phone}
            email={activeCard?.email}
            website={activeCard?.website}
            backgroundImageUri={coverUrl}
            profileUrl={activeCard?.profileUrl}
            width={CARD_WIDTH}
          />
        </Animated.View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16,
    alignItems: 'center',
  } as ViewStyle,
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8
  } as ViewStyle,
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  } as ViewStyle,
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INK,
  } as ViewStyle,
  profileAvatarT: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5
  } as TextStyle,
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4
  } as ViewStyle,
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0
  } as TextStyle,
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0
  } as ViewStyle,
  profileName: {
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: INK,
    letterSpacing: -0.3,
  } as TextStyle,
  identityMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  } as ViewState,
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  } as ViewStyle,
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30'
  } as ViewStyle,
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }]
  } as ViewStyle,
  hovered: {
    opacity: 0.95
  } as ViewStyle,
  cardContainer: {
    marginVertical: 20,
    width: '100%',
    maxWidth: CARD_WIDTH,
  } as ViewStyle,
  cardElevation: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  } as ViewStyle,
  interactiveHint: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
});
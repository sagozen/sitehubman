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
import { useState, useEffect, useMemo } from 'react';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const BRAND = '#2596BE';
const INK = '#0A0A0F';
const MUTED = '#8E8E93';
const SURFACE = '#F4F4F6';

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good Morning';
  if (hr < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function CustomerHeroCard({ user }: any) {
  const { preferences } = usePreferences();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadCustomerCloudCard(user.id).then(setCloudCard).catch(() => null);
    }
  }, [user?.id]);

  const cardName  = bioPage?.displayName?.trim() || user?.displayName?.trim() || 'My Name';
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

  return (
    <View style={styles.container}>
      {/* ── PROFILE HEADER (GUEST STYLE) ── */}
      <View style={styles.profileHeader}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.push('/profile');
          }}
          style={({ pressed }) => [styles.profileAvatar, pressed && styles.pressed]}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImg} resizeMode="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <AppText style={styles.profileAvatarT}>{initial}</AppText>
            </View>
          )}
        </Pressable>
        
        <View style={styles.profileCopy}>
          <AppText style={styles.kicker}>{getGreeting()}</AppText>
          <View style={styles.profileNameRow}>
            <AppText style={styles.profileName} numberOfLines={1}>
              {name}
            </AppText>
            <AppIcon name="BadgeCheck" size={18} color={BRAND} />
          </View>
          <AppText style={styles.identityMeta} numberOfLines={1}>
            {title}
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              HapticTap.light();
              router.push(appRoutes.customer.notifications as any);
            }}
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
          >
            <AppIcon name="Bell" size={19} color={INK} />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable 
            onPress={() => {
              HapticTap.medium();
              router.push('/cards/design');
            }} 
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
          >
            <AppIcon name="Sparkles" size={20} color={BRAND} />
          </Pressable>
        </View>
      </View>

      {/* ── CARD WRAPPER (GUEST STYLE ASPECT RATIO & SHADOW) ── */}
      <View style={styles.cardWrap}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 28,
    gap: 20,
  } as ViewStyle,
  profileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingTop: 4 
  } as ViewStyle,
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    fontSize: 21, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    fontFamily: 'Inter_900Black' 
  } as TextStyle,
  profileCopy: { 
    flex: 1, 
    minWidth: 0, 
    gap: 2 
  } as ViewStyle,
  kicker: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: MUTED, 
    fontFamily: 'Inter_700Bold' 
  } as TextStyle,
  profileNameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    minWidth: 0 
  } as ViewStyle,
  profileName: {
    flexShrink: 1,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    color: INK,
    fontFamily: 'Inter_900Black',
  } as TextStyle,
  identityMeta: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: MUTED, 
    fontFamily: 'Inter_700Bold' 
  } as TextStyle,
  headerActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  } as ViewStyle,
  headerIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: SURFACE, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  } as ViewStyle,
  unreadDot: { 
    position: 'absolute', 
    top: 9, 
    right: 9, 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#FF3B30' 
  } as ViewStyle,
  pressed: { 
    opacity: 0.75, 
    transform: [{ scale: MotionScale.pressed }] 
  } as ViewStyle,
  cardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});

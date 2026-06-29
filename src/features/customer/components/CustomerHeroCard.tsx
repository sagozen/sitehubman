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
  const activeCardId = preferences.primaryCardId || 'card-primary';
  const activeCard = SEED_CARDS.find(c => c.id === activeCardId) || SEED_CARDS[0];

  const name = activeCard?.fullName || user?.displayName || 'Chanthean Sok';
  const parts = (activeCard?.title || '').split(/[·/]/);
  const title = parts[0]?.trim() || user?.title || 'Business Development Manager';
  const company = parts[1]?.trim() || user?.company || 'NFC Global';

  const avatarUrl = user?.photoURL || user?.telegramPhotoUrl || '';
  const coverUrl = user?.coverURL || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000';

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
            <AppText style={styles.profileAvatarT}>{initial}</AppText>
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
            {[title, company].filter(Boolean).join(' / ')}
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
          company={company}
          backgroundImageUri={coverUrl}
          profileUrl={`sitehubman.com/profile/${user?.id || 'demo'}`}
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

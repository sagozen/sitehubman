import { View, StyleSheet, Dimensions, Pressable, Image, type TextStyle, type ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { router } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

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
  const name = user?.displayName || 'Chanthean Sok';
  const title = user?.title || 'Business Development Manager';
  const company = user?.company || 'NFC Global';
  const avatarUrl = user?.photoURL || user?.telegramPhotoUrl || '';
  const coverUrl = user?.coverURL || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000';

  const initial = (user?.displayName?.trim() || 'C')[0].toUpperCase();

  return (
    <View style={styles.container}>
      {/* ── PROFILE HEADER (GUEST STYLE) ── */}
      <View style={styles.profileHeader}>
        <Pressable
          onPress={() => router.push('/profile')}
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
            onPress={() => router.push(appRoutes.customer.notifications as any)}
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
          >
            <AppIcon name="Bell" size={19} color={INK} />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/cards/design')} 
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
          >
            <AppIcon name="Sparkles" size={20} color={BRAND} />
          </Pressable>
        </View>
      </View>

      {/* ── CARD WRAPPER (GUEST STYLE ASPECT RATIO & SHADOW) ── */}
      <View style={styles.cardWrap}>
        <FlippableNfcCard
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
    paddingHorizontal: 20,
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
    transform: [{ scale: 0.97 }] 
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

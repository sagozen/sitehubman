import { View, StyleSheet, Dimensions, Pressable, Image, Animated, type TextStyle, type ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { CheckCircleBoldDuotone, BellBoldDuotone } from '@solar-icons/react-native';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';
import { useEffect, useRef } from 'react';
import { useNotifications } from '@/src/hooks/useNotifications';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export function CustomerHeroCard({ user }: any) {
  const name = user?.displayName || 'Chanthean Sok';
  const title = user?.title || 'Business Development Manager';
  const company = user?.company || 'NFC Global';
  const avatarUrl = user?.photoURL || user?.telegramPhotoUrl || 'https://i.pravatar.cc/300?img=12';
  const coverUrl = user?.coverURL || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000';

  const { unreadCount } = useNotifications();
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Premium Glassmorphic Top Meta Bar */}
      <View style={styles.metaBar}>
        <View style={styles.metaLeft}>
          <AppText style={styles.greeting}>Good Afternoon</AppText>
          <AppText style={styles.userName}>{name.split(' ')[0]}</AppText>
          <AppText style={styles.userTitle}>{title}</AppText>
          <Animated.View style={[styles.verifiedRow, { opacity: pulse }]}>
            <CheckCircleBoldDuotone size={14} color="#059669" />
            <AppText style={styles.verifiedText}>Verified NFC Member</AppText>
          </Animated.View>
        </View>
        <View style={styles.metaRight}>
          <Pressable 
            style={styles.iconBtn}
            onPress={() => router.push(appRoutes.customer.notifications as any)}
          >
            <BellBoldDuotone size={22} color="#111827" />
            {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </Pressable>
          <Pressable onPress={() => router.push(appRoutes.customer.profile as any)}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
          </Pressable>
        </View>
      </View>

      {/* Hero Card Container with Studio Light Effect Backdrop */}
      <View style={styles.cardStage}>
        <LinearGradient
          colors={['rgba(0,122,255,0.07)', 'rgba(124,58,237,0.05)', 'rgba(255,255,255,0)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.cardStageBack}
        />
        <View style={styles.cardShadow}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  } as ViewStyle,
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    alignItems: 'center',
  } as ViewStyle,
  metaLeft: {
    flex: 1,
    gap: 3,
  } as ViewStyle,
  greeting: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as TextStyle,
  userName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.8,
  } as TextStyle,
  userTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  } as TextStyle,
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  } as ViewStyle,
  verifiedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  } as TextStyle,
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  } as ViewStyle,
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  } as ViewStyle,
  cardStage: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  } as ViewStyle,
  cardStageBack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  } as ViewStyle,
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  } as ViewStyle,
});

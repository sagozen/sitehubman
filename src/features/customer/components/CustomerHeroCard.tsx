import { View, StyleSheet, Dimensions, Pressable, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { CheckCircleBoldDuotone, BellBoldDuotone } from '@solar-icons/react-native';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export function CustomerHeroCard({ user }: any) {
  // Use fake data from spec if real data is missing
  const name = user?.displayName || 'Chanthean Sok';
  const title = user?.title || 'Business Development Manager';
  const company = user?.company || 'NFC Global';
  const avatarUrl = user?.photoURL || user?.telegramPhotoUrl || 'https://i.pravatar.cc/300?img=12';
  const coverUrl = user?.coverURL || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000';

  return (
    <View style={styles.container}>
      {/* Top Meta Bar */}
      <View style={styles.metaBar}>
        <View style={styles.metaLeft}>
          <AppText style={styles.greeting}>Good Afternoon</AppText>
          <AppText style={styles.userName}>{name.split(' ')[0]}</AppText>
          <AppText style={styles.userTitle}>{title}</AppText>
          <View style={styles.verifiedRow}>
            <CheckCircleBoldDuotone size={14} color="#059669" />
            <AppText style={styles.verifiedText}>Verified NFC Member</AppText>
          </View>
        </View>
        <View style={styles.metaRight}>
          <Pressable style={styles.iconBtn}>
            <BellBoldDuotone size={24} color="#111827" />
          </Pressable>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
        </View>
      </View>

      {/* Hero Card */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metaLeft: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  userTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
    alignItems: 'center',
  },
});

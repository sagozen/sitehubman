import { View, StyleSheet, Pressable, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { DangerCircleBoldDuotone } from '@solar-icons/react-native';

export function FollowUpRecommendation() {
  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>Recommended Action</AppText>
      
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.headerRow}>
          <AppText style={styles.headerTitle}>Follow up with</AppText>
          <View style={styles.priorityBadge}>
            <DangerCircleBoldDuotone size={12} color="#EF4444" />
            <AppText style={styles.priorityText}>High Priority</AppText>
          </View>
        </View>

        <View style={styles.userRow}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=68' }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <AppText style={styles.name}>Sok Dara</AppText>
            <AppText style={styles.detail}>Last interaction: Yesterday</AppText>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  detail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
});

import { View, StyleSheet, Pressable, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

const ACTIONS = [
  { id: 'create', label: 'Create Card', image: require('@/assets/images/3d_create_card_v2.png') },
  { id: 'share', label: 'Share', image: require('@/assets/images/3d_share_card_v2.png') },
  { id: 'scan', label: 'Scan', image: require('@/assets/images/3d_scan_card_v2.png') },
  { id: 'orders', label: 'Track', image: require('@/assets/images/3d_track_card_v2.png') },
];

export function QuickActionGrid({ onActionPress }: { onActionPress: (id: string) => void }) {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => {
            HapticTap.light();
            onActionPress(action.id);
          }}
        >
          <View style={styles.iconWrap}>
            <Image source={action.image} style={styles.iconImage} resizeMode="contain" />
          </View>
          <AppText style={styles.label}>{action.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  iconWrap: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.04)',
    overflow: 'hidden',
  },
  iconImage: {
    width: 60,
    height: 60,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});

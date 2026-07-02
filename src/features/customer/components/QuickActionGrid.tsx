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
    <View style={styles.actionStrip}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          onPress={() => {
            HapticTap.light();
            onActionPress(action.id);
          }}
        >
          <View style={styles.actionImageWrap}>
            <Image source={action.image} style={styles.actionImage} resizeMode="contain" />
          </View>
          <AppText style={styles.actionLabel}>{action.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  actionStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    marginTop: -8,
    width: '100%',
    alignSelf: 'center',
  },
  actionBtn: {
// ...

    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  actionImageWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  actionImage: {
    width: '100%',
    height: '100%',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.2,
  },
});


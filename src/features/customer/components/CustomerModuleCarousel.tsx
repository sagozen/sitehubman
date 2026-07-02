import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

const MODULES = [
  { id: 'orders', label: 'Orders', image: require('@/assets/images/3d_track_card_v2.png') },
  { id: 'analytics', label: 'Analytics', image: require('@/assets/images/3d_analytics_v2.png') },
  { id: 'network', label: 'Network', image: require('@/assets/images/3d_share_card_v2.png') },
  { id: 'templates', label: 'Templates', image: require('@/assets/images/3d_create_card_v2.png') },
  { id: 'signals', label: 'Signals', image: require('@/assets/images/3d_signals_v2.png') },
];

export function CustomerModuleCarousel({ onModulePress }: { onModulePress?: (id: string) => void }) {
  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>Modules</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={110 + 12} // Card width + gap
      >
        {MODULES.map((mod) => (
          <Pressable
            key={mod.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => {
              HapticTap.light();
              onModulePress?.(mod.id);
            }}
          >
            {/* Left-aligned, half-overflowing image */}
            <View style={styles.imageWrap}>
              <Image source={mod.image} style={styles.image} resizeMode="contain" />
            </View>
            
            {/* Title at the bottom */}
            <AppText style={styles.label}>{mod.label}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
// ...

    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  card: {
    width: 110,
    height: 124,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  imageWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: '#111827',
    textAlign: 'center',
  },
});

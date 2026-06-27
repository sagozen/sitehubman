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
        snapToInterval={140 + 12} // Card width + gap
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
    marginBottom: 40,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 140, // full size box
    height: 120, // full size box
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.03)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  imageWrap: {
    position: 'absolute',
    left: -32, // see half on left (shifted further)!
    top: 12,
    width: 85,
    height: 85,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.4,
    color: '#111827',
    textAlign: 'left',
  },
});

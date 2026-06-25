import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { BoxBoldDuotone, ChartSquareBoldDuotone, CopyBoldDuotone, UsersGroupTwoRoundedBoldDuotone, SatelliteBoldDuotone } from '@solar-icons/react-native';

const MODULES = [
  { id: 'orders', label: 'Orders', icon: BoxBoldDuotone, color: '#F59E0B' },
  { id: 'analytics', label: 'Analytics', icon: ChartSquareBoldDuotone, color: '#3B82F6' },
  { id: 'network', label: 'Network', icon: UsersGroupTwoRoundedBoldDuotone, color: '#8B5CF6' },
  { id: 'templates', label: 'Templates', icon: CopyBoldDuotone, color: '#10B981' },
  { id: 'signals', label: 'Signals', icon: SatelliteBoldDuotone, color: '#EC4899' },
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
            onPress={() => onModulePress?.(mod.id)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${mod.color}15` }]}>
              <mod.icon size={28} color={mod.color} />
            </View>
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
    width: 140,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});

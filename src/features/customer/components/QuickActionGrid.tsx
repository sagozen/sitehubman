import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AddCircleBoldDuotone, ShareBoldDuotone, ScannerBoldDuotone, BoxBoldDuotone } from '@solar-icons/react-native';

const ACTIONS = [
  { id: 'create', label: 'Create Card', icon: AddCircleBoldDuotone, color: '#2596BE' },
  { id: 'share', label: 'Share', icon: ShareBoldDuotone, color: '#7C3AED' },
  { id: 'scan', label: 'Scan', icon: ScannerBoldDuotone, color: '#059669' },
  { id: 'orders', label: 'Track', icon: BoxBoldDuotone, color: '#D97706' },
];

export function QuickActionGrid({ onActionPress }: { onActionPress: (id: string) => void }) {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => onActionPress(action.id)}
        >
          <View style={styles.iconWrap}>
            <action.icon size={32} color={action.color} />
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
    gap: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});

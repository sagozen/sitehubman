import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { UserBoldDuotone, Card2BoldDuotone, ShareBoldDuotone } from '@solar-icons/react-native';

const TASKS = [
  { id: 'profile', label: 'Finish Profile', status: '85%', icon: UserBoldDuotone, color: '#3B82F6' },
  { id: 'order', label: 'Order Physical Card', status: 'Pending', icon: Card2BoldDuotone, color: '#F59E0B' },
  { id: 'share', label: 'Share Card', status: 'Ready', icon: ShareBoldDuotone, color: '#10B981' },
];

export function ContinueWorkingTasks({ onTaskPress }: { onTaskPress?: (id: string) => void }) {
  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>Continue Working</AppText>
      <View style={styles.list}>
        {TASKS.map((task) => (
          <Pressable
            key={task.id}
            style={({ pressed }) => [styles.taskCard, pressed && styles.cardPressed]}
            onPress={() => onTaskPress?.(task.id)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${task.color}15` }]}>
              <task.icon size={20} color={task.color} />
            </View>
            <AppText style={styles.label}>{task.label}</AppText>
            <AppText style={[styles.status, { color: task.status === 'Ready' ? '#10B981' : '#64748B' }]}>
              {task.status}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  list: {
    gap: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    paddingRight: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
  },
});

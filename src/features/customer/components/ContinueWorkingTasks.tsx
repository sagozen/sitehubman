import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { UserBoldDuotone, Card2BoldDuotone, ShareBoldDuotone } from '@solar-icons/react-native';
import { HapticTap } from '@/src/utils/haptics';
import { MotionScale } from '@/src/utils/motion';

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
            onPress={() => {
              HapticTap.light();
              onTaskPress?.(task.id);
            }}
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
    marginBottom: 16,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#111827',
  },
  status: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});


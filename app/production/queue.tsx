import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductionQueueScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppText style={styles.title}>Production Queue</AppText>
        <AppText style={styles.subtitle}>Manage pending print jobs and card tasks</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.emptyCard}>
          <AppText style={styles.emptyText}>No active print jobs in queue</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.6, fontFamily: 'Inter_900Black' },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  scroll: { padding: 20 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)' },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#8E8E93', fontFamily: 'Inter_600SemiBold' },
});

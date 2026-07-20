import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';

export default function ProductionQueueScreen() {

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color="#111827" />
          </Pressable>
          <AppText style={styles.title}>Production Queue</AppText>
          <View style={{ width: 24 }} /> {/* Spacer to center the title */}
        </View>
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
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 26, fontWeight: '900', color: '#111111', letterSpacing: -0.6, fontFamily: 'Inter_900Black' },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#6E6E73' },
  scroll: { padding: 20 },
  emptyCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 32, 
    alignItems: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 1.5, 
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#6E6E73', fontFamily: 'Inter_600SemiBold' },
});

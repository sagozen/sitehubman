import { View, StyleSheet, Pressable } from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { useLocalSearchParams, router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';

export default function QaJobScreen() {
  const { jobId } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={22} color="#111827" />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>Quality Assurance</AppText>
          <AppText style={styles.subtitle}>Job ID: #{jobId}</AppText>
        </View>
      </View>
      <View style={styles.container}>
        <View style={styles.statusBox}>
          <AppText style={styles.statusTitle}>Pending QA Inspection</AppText>
          <AppText style={styles.statusSub}>Verify card print registration and NFC chip write</AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...createShadow({ color: '#000', offset: { width: 0, height: 2 }, opacity: 0.03, radius: 6, elevation: 2 }) },
  headerCopy: { flex: 1 },
  title: { fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.6, fontFamily: 'Inter_900Black' },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  statusBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)', ...createShadow({ color: '#000', offset: { width: 0, height: 4 }, opacity: 0.02, radius: 10, elevation: 2 }) },
  statusTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8, fontFamily: 'Inter_800ExtraBold' },
  statusSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', fontFamily: 'Inter_500Medium' },
});

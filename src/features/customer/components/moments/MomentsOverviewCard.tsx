import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { UsersGroupTwoRoundedBoldDuotone, Card2BoldDuotone, StarsBoldDuotone } from '@solar-icons/react-native';

export function MomentsOverviewCard() {
  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
          <UsersGroupTwoRoundedBoldDuotone size={24} color="#3B82F6" />
        </View>
        <AppText style={styles.value}>1,248</AppText>
        <AppText style={styles.label}>Total People</AppText>
      </View>
      
      <View style={styles.statBox}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(124,58,237,0.1)' }]}>
          <Card2BoldDuotone size={24} color="#7C3AED" />
        </View>
        <AppText style={styles.value}>3,892</AppText>
        <AppText style={styles.label}>Interactions</AppText>
      </View>

      <View style={styles.statBox}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
          <StarsBoldDuotone size={24} color="#10B981" />
        </View>
        <AppText style={styles.value}>+42</AppText>
        <AppText style={styles.label}>New This Week</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});

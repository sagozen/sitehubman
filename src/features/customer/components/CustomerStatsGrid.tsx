import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { GraphUpBoldDuotone } from '@solar-icons/react-native';

type Stat = {
  id: string;
  label: string;
  value: string;
  trend?: string;
};

export function CustomerStatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={stat.id} style={[styles.statItem, index > 0 && styles.statBorder]}>
          <AppText style={styles.value}>{stat.value}</AppText>
          <View style={styles.labelRow}>
            {stat.trend && <GraphUpBoldDuotone size={12} color="#10B981" />}
            <AppText style={styles.label}>{stat.label}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statBorder: {
    // No hard borders as requested, just using spacing
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

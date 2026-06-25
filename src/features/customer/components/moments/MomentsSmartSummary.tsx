import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { MagicStick3BoldDuotone, FlameBoldDuotone, GraphUpBoldDuotone, LeafBoldDuotone } from '@solar-icons/react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function MomentsSmartSummary() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MagicStick3BoldDuotone size={18} color="#A855F7" />
          </View>
          <AppText style={styles.title}>AI Insight</AppText>
        </View>
        <AppText style={styles.text}>
          <AppText style={styles.highlight}>Today</AppText> you met 8 new people. 3 returned visitors. 2 potential business leads. Network activity increased 18%.
        </AppText>
      </View>
    </View>
  );
}

export function RelationshipScores() {
  return (
    <View style={styles.scoresContainer}>
      <AppText style={styles.sectionTitle}>Relationship Health</AppText>
      <View style={styles.row}>
        
        <View style={styles.scoreItem}>
          <View style={styles.circleWrap}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.circle}>
              <FlameBoldDuotone size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <AppText style={styles.scoreValue}>12</AppText>
          <AppText style={styles.scoreLabel}>Strong</AppText>
        </View>

        <View style={styles.scoreItem}>
          <View style={styles.circleWrap}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.circle}>
              <GraphUpBoldDuotone size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <AppText style={styles.scoreValue}>18</AppText>
          <AppText style={styles.scoreLabel}>Growing</AppText>
        </View>

        <View style={styles.scoreItem}>
          <View style={styles.circleWrap}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.circle}>
              <LeafBoldDuotone size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <AppText style={styles.scoreValue}>6</AppText>
          <AppText style={styles.scoreLabel}>New</AppText>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#F3E8FF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7E22CE',
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B21A8',
    lineHeight: 22,
  },
  highlight: {
    fontWeight: '800',
    color: '#581C87',
  },
  // Scores
  scoresContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  circleWrap: {
    marginBottom: 12,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});

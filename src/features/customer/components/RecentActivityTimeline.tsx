import { View, StyleSheet, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';

type TimelineItemProps = {
  id: string;
  avatar: string;
  title: string;
  subtitle: string;
  time: string;
  isLast?: boolean;
};

const FAKE_ACTIVITY: TimelineItemProps[] = [
  { id: '1', avatar: 'https://i.pravatar.cc/150?img=68', title: 'Dara Lim', subtitle: 'Viewed your profile', time: '2 min ago' },
  { id: '2', avatar: 'https://i.pravatar.cc/150?img=11', title: 'NFC Tap', subtitle: 'iPhone 16', time: '5 min ago' },
  { id: '3', avatar: 'https://i.pravatar.cc/150?img=32', title: 'QR Scan', subtitle: 'Chrome', time: '15 min ago' },
  { id: '4', avatar: 'https://i.pravatar.cc/150?img=44', title: 'Connection Added', subtitle: 'Sokha', time: '1 hour ago' },
];

export function RecentActivityTimeline({ activities = FAKE_ACTIVITY }: { activities?: TimelineItemProps[] }) {
  const displayActivities = activities.slice(0, 5);

  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>Recent Activity</AppText>
      <View style={styles.timeline}>
        {displayActivities.map((item, index) => {
          const isLast = index === displayActivities.length - 1;
          return (
            <View key={item.id} style={styles.item}>
              {/* Left side: Avatar + Line */}
              <View style={styles.leftCol}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} resizeMode="cover" />
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Right side: Content */}
              <View style={[styles.content, isLast && styles.contentLast]}>
                <View style={styles.textWrap}>
                  <AppText style={styles.title}>{item.title}</AppText>
                  <AppText style={styles.subtitle}>{item.subtitle}</AppText>
                </View>
                <AppText style={styles.time}>{item.time}</AppText>
              </View>
            </View>
          );
        })}
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
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  timeline: {
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
  },
  leftCol: {
    alignItems: 'center',
    width: 40,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#F1F5F9',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingLeft: 12,
  },
  contentLast: {
    paddingBottom: 0,
  },
  textWrap: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
});

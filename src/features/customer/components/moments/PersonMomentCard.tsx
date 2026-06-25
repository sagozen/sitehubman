import { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, LayoutAnimation, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AltArrowDownBoldDuotone, Card2BoldDuotone, QrCodeBoldDuotone, EyeBoldDuotone } from '@solar-icons/react-native';

export type PersonMoment = {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  interactionsCount: number;
  lastSeen: string;
  badge: string;
  timeline: { time: string; action: string; type: 'nfc' | 'qr' | 'view' | 'save' | 'share' }[];
};

export function PersonMomentCard({ person }: { person: PersonMoment }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'nfc': return <Card2BoldDuotone size={16} color="#3B82F6" />;
      case 'qr': return <QrCodeBoldDuotone size={16} color="#10B981" />;
      default: return <EyeBoldDuotone size={16} color="#64748B" />;
    }
  };

  return (
    <Pressable style={styles.card} onPress={toggleExpand}>
      <View style={styles.mainRow}>
        <Image source={{ uri: person.avatar }} style={styles.avatar} />
        
        <View style={styles.info}>
          <AppText style={styles.name}>{person.name}</AppText>
          <AppText style={styles.title}>{person.title}{person.company ? ` at ${person.company}` : ''}</AppText>
          
          <View style={styles.metaRow}>
            <AppText style={styles.metaText}>{person.interactionsCount} interactions</AppText>
            <View style={styles.dot} />
            <AppText style={styles.metaText}>Last seen {person.lastSeen}</AppText>
          </View>
        </View>

        <View style={styles.rightCol}>
          {person.badge && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{person.badge}</AppText>
            </View>
          )}
          <View style={[styles.chevron, expanded && styles.chevronUp]}>
            <AltArrowDownBoldDuotone size={20} color="#94A3B8" />
          </View>
        </View>
      </View>

      {expanded && (
        <View style={styles.timelineContainer}>
          <View style={styles.divider} />
          {person.timeline.map((event, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timeWrap}>
                <AppText style={styles.timeText}>{event.time}</AppText>
              </View>
              <View style={styles.timelineIconLine}>
                <View style={styles.timelineIconBg}>{renderIcon(event.type)}</View>
                {idx !== person.timeline.length - 1 && <View style={styles.verticalLine} />}
              </View>
              <View style={styles.actionWrap}>
                <AppText style={styles.actionText}>{event.action}</AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 48,
  },
  badge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  chevron: {
    justifyContent: 'center',
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  // Timeline
  timelineContainer: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeWrap: {
    width: 48,
    paddingTop: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  timelineIconLine: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  timelineIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    height: 24, // connects to next icon
    backgroundColor: '#F1F5F9',
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  actionWrap: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});

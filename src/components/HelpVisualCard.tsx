import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AppIcon } from './AppIcon';
import { colors, radius, typography } from '../design-system/tokens';

export interface HelpVisualCardProps {
  type: 'nfc_tap' | 'network_offline' | 'nfc_unsupported' | 'card_align';
  title: string;
  description: string;
}

/**
 * High-contrast minimalist visual cue card for onboarding and troubleshooting
 * Matches Apple HIG and Sitehubman deep dark slab aesthetics.
 */
export const HelpVisualCard: React.FC<HelpVisualCardProps> = ({
  type,
  title,
  description,
}) => {
  const getVisualIcon = () => {
    switch (type) {
      case 'nfc_tap':
        return { icon: 'Wifi' as const, color: '#799A85', subIcon: 'Smartphone' as const };
      case 'network_offline':
        return { icon: 'WifiOff' as const, color: '#EF4444', subIcon: 'AlertCircle' as const };
      case 'nfc_unsupported':
        return { icon: 'AlertTriangle' as const, color: '#EAB308', subIcon: 'Smartphone' as const };
      case 'card_align':
      default:
        return { icon: 'CreditCard' as const, color: '#799A85', subIcon: 'Maximize' as const };
    }
  };

  const visual = getVisualIcon();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.graphicArea}>
        <View style={[styles.haloCircle, { borderColor: `${visual.color}33` }]}>
          <View style={[styles.innerCircle, { backgroundColor: `${visual.color}1A` }]}>
            <AppIcon name={visual.icon} size={28} color={visual.color} />
          </View>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.descText}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#161618',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  graphicArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.medium,
  },
  descText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
});

export default HelpVisualCard;

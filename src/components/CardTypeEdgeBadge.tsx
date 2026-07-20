import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';

export type CardKind = 'virtual' | 'physical';

type Props = {
  kind: CardKind;
};

/** Small corner label so users can tell e-card from physical at a glance. */
export function CardTypeEdgeBadge({ kind }: Props) {
  const isPhysical = kind === 'physical';
  return (
    <View
      style={[styles.badge, isPhysical ? styles.physical : styles.virtual]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppText style={[styles.text, isPhysical ? styles.physicalText : styles.virtualText]}>
        {isPhysical ? 'Physical' : 'e'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 10,
    right: -4,
    zIndex: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  virtual: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(37,150,190,0.45)',
  },
  physical: {
    backgroundColor: 'rgba(28,28,30,0.92)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  virtualText: {
    color: '#2596BE',
  },
  physicalText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.2,
  },
});

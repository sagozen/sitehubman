/**
 * Production Card
 * Apple Wallet-inspired card component
 * Border OR shadow, never both. Real proportions. No decoration.
 */

import React, { memo, type PropsWithChildren, type ReactNode } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { production } from '@/src/design-system/production';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type CardElevation = 'border' | 'subtle' | 'raised' | 'floating';

interface ProductionCardProps {
  /** Elevation style */
  elevation?: CardElevation;
  /** Make card interactive */
  onPress?: () => void;
  /** Header section */
  header?: ReactNode;
  /** Footer section */
  footer?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ProductionCardRaw({
  children,
  elevation = 'border',
  onPress,
  header,
  footer,
}: PropsWithChildren<ProductionCardProps>) {
  const containerStyle: ViewStyle = {
    backgroundColor: production.card.background,
    borderRadius: production.card.radius,
    ...(elevation === 'border' && {
      borderWidth: 0.5,
      borderColor: production.colors.border,
    }),
    ...(elevation !== 'border' && production.shadows[elevation === 'subtle' ? 'subtle' : elevation === 'raised' ? 'raised' : 'floating']),
  };

  const content = (
    <>
      {header && (
        <View style={[styles.section, styles.header]}>
          {header}
        </View>
      )}
      
      <View style={styles.section}>
        {children}
      </View>

      {footer && (
        <View style={[styles.section, styles.footer]}>
          {footer}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={null}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
    </View>
  );
}

export const ProductionCard = memo(ProductionCardRaw);

// ═══════════════════════════════════════════════════════════════════════════
// NFC CARD COMPONENT (Tesla UI-inspired minimalism)
// ═══════════════════════════════════════════════════════════════════════════

interface NfcCardProps {
  /** Card holder name */
  name: string;
  /** Username handle */
  handle: string;
  /** Card background color */
  cardColor?: string;
  /** Press handler */
  onPress?: () => void;
}

export function NfcCard({ name, handle, cardColor = '#0A0A0A', onPress }: NfcCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      style={[
        styles.nfcCard,
        {
          backgroundColor: cardColor,
        },
        production.shadows.floating,
      ]}
    >
      {/* NFC Icon - top right */}
      <View style={styles.nfcIcon}>
        <View style={styles.nfcIndicator} />
      </View>

      {/* Card info - bottom left */}
      <View style={styles.nfcInfo}>
        <Text style={[production.typography.body, styles.nfcName]}>
          {name}
        </Text>
        <Text style={[production.typography.detail, styles.nfcHandle]}>
          @{handle}
        </Text>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  section: {
    padding: production.card.padding,
  },
  header: {
    paddingBottom: production.spacing[3],
  },
  footer: {
    paddingTop: production.spacing[3],
  },
  pressed: {
    opacity: 0.98,
    transform: [{ scale: 0.99 }],
  },
  
  // NFC Card
  nfcCard: {
    width: production.card.nfcWidth,
    height: production.card.nfcHeight,
    borderRadius: production.card.radius,
    padding: production.card.padding,
    justifyContent: 'space-between',
  },
  nfcIcon: {
    alignSelf: 'flex-end',
  },
  nfcIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nfcInfo: {
    gap: production.spacing[1],
  },
  nfcName: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  nfcHandle: {
    color: 'rgba(255,255,255,0.6)',
  },
});

import { Text } from 'react-native';

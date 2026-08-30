/**
 * NFC Scan Screen - Redesigned
 * Using principles from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * 
 * Tesla's minimal control interface
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { tokens } from '@/design-system/extracted-tokens';
import { Button } from './HomeScreenRedesigned';

// ═══════════════════════════════════════════════════════════════════════════
// SCAN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function ScanScreen() {
  const scanRotation = useSharedValue(0);
  
  useEffect(() => {
    scanRotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[tokens.typography.title]}>
          Ready to Scan
        </Text>
        <Text style={[tokens.typography.detail, { color: tokens.color.textMedium, marginTop: tokens.spacing[2] }]}>
          Hold your phone near an NFC card
        </Text>
      </View>

      {/* Scan Animation - Tesla's minimal interface */}
      <View style={styles.scanArea}>
        <View style={styles.scanRing}>
          <Animated.View style={[styles.scanCircle, animatedStyle]}>
            <View style={styles.scanDot} />
          </Animated.View>
        </View>
        
        {/* NFC Icon */}
        <View style={styles.nfcSymbol}>
          <Text style={[tokens.typography.caption, { color: tokens.color.textMedium }]}>
            NFC
          </Text>
        </View>
      </View>

      {/* Instructions - Apple's clear hierarchy */}
      <View style={styles.instructions}>
        <Instruction number="1" text="Hold phone near card" />
        <Instruction number="2" text="Wait for connection" />
        <Instruction number="3" text="View profile" />
      </View>

      {/* Action */}
      <View style={styles.actionSection}>
        <Button label="Cancel" variant="secondary" />
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTION - Linear's numbered list
// ═══════════════════════════════════════════════════════════════════════════

function Instruction({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.instruction}>
      <View style={styles.instructionNumber}>
        <Text style={[tokens.typography.body, { color: tokens.color.white, fontWeight: '600' }]}>
          {number}
        </Text>
      </View>
      <Text style={[tokens.typography.body, { flex: 1 }]}>
        {text}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.white,
    paddingHorizontal: tokens.spacing.screenX,
    paddingVertical: tokens.spacing.screenY,
  },
  
  // Header
  header: {
    marginBottom: tokens.spacing[10],
  },
  
  // Scan Area (Tesla's minimal interface)
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRing: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: tokens.color.black,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  scanDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.color.black,
  },
  nfcSymbol: {
    position: 'absolute',
  },
  
  // Instructions (Linear's numbered list)
  instructions: {
    marginBottom: tokens.spacing[10],
    gap: tokens.spacing[4],
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.color.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Action
  actionSection: {
    marginBottom: tokens.spacing[8],
  },
});

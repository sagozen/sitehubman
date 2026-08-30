/**
 * Card Customization Screen - Redesigned
 * Using principles from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * 
 * Nothing's minimal customization UI
 */

import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { tokens, elevation } from '@/design-system/extracted-tokens';
import { Button } from './HomeScreenRedesigned';

// ═══════════════════════════════════════════════════════════════════════════
// CARD DESIGN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function CardDesignScreen() {
  const [name, setName] = useState('John Smith');
  const [handle, setHandle] = useState('johnsmith');
  const [selectedStyle, setSelectedStyle] = useState<'black' | 'white' | 'metal'>('black');
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[tokens.typography.title]}>
          Customize Card
        </Text>
      </View>

      {/* Live Preview - Apple Wallet card preview */}
      <View style={styles.previewSection}>
        <CardPreview name={name} handle={handle} style={selectedStyle} />
      </View>

      {/* Style Selection - Nothing's minimal options */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          STYLE
        </Text>
        
        <View style={styles.styleOptions}>
          <StyleOption 
            label="Black" 
            isSelected={selectedStyle === 'black'} 
            onPress={() => setSelectedStyle('black')}
          />
          <StyleOption 
            label="White" 
            isSelected={selectedStyle === 'white'} 
            onPress={() => setSelectedStyle('white')}
          />
          <StyleOption 
            label="Metal" 
            isSelected={selectedStyle === 'metal'} 
            onPress={() => setSelectedStyle('metal')}
          />
        </View>
      </View>

      {/* Information - Tesla's form pattern */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          INFORMATION
        </Text>
        
        <View style={styles.form}>
          <Field 
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
          <Field 
            label="Username"
            value={handle}
            onChangeText={setHandle}
            placeholder="@username"
          />
        </View>
      </View>

      {/* Action - Linear's single primary */}
      <View style={styles.actionSection}>
        <Button label="Continue" variant="primary" />
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD PREVIEW - Apple Wallet live preview
// ═══════════════════════════════════════════════════════════════════════════

function CardPreview({ name, handle, style }: { name: string; handle: string; style: 'black' | 'white' | 'metal' }) {
  const backgroundColor = style === 'black' 
    ? '#0A0A0A' 
    : style === 'white' 
      ? '#FFFFFF' 
      : '#C0C0C0';
      
  const textColor = style === 'black' ? '#FFFFFF' : '#0A0A0A';
  const secondaryColor = style === 'black' ? 'rgba(255,255,255,0.6)' : 'rgba(10,10,10,0.6)';
  
  return (
    <View style={[styles.previewCard, elevation.medium, { backgroundColor }]}>
      {/* NFC indicator */}
      <View style={styles.nfcIcon}>
        <View style={[styles.nfcDot, { borderColor: secondaryColor }]} />
      </View>
      
      {/* Card info */}
      <View style={styles.previewInfo}>
        <Text style={[tokens.typography.body, { color: textColor, fontWeight: '500' }]}>
          {name || 'Your Name'}
        </Text>
        <Text style={[tokens.typography.detail, { color: secondaryColor }]}>
          {handle ? `@${handle}` : '@username'}
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE OPTION - Nothing's minimal radio
// ═══════════════════════════════════════════════════════════════════════════

function StyleOption({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.styleOption} onPress={onPress}>
      <View style={[
        styles.radioOuter,
        isSelected && { borderColor: tokens.color.black }
      ]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
      <Text style={[tokens.typography.body, { fontWeight: '500' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD - Apple's input pattern
// ═══════════════════════════════════════════════════════════════════════════

function Field({ label, value, onChangeText, placeholder }: { 
  label: string; 
  value: string; 
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  
  return (
    <View style={styles.field}>
      <Text style={[tokens.typography.caption, styles.fieldLabel]}>
        {label}
      </Text>
      <View style={[
        styles.inputWrapper,
        focused && { borderWidth: 1, borderColor: tokens.color.black }
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={tokens.color.textLight}
          style={[tokens.typography.body, styles.input]}
        />
      </View>
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
  },
  content: {
    paddingHorizontal: tokens.spacing.screenX,
    paddingVertical: tokens.spacing.screenY,
  },
  
  // Header
  header: {
    marginBottom: tokens.spacing[10],
  },
  
  // Preview
  previewSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing[10],
  },
  previewCard: {
    width: tokens.card.nfc.width,
    height: tokens.card.nfc.height,
    borderRadius: tokens.card.radius,
    padding: tokens.card.padding,
    justifyContent: 'space-between',
  },
  previewInfo: {
    gap: tokens.spacing[1],
  },
  
  // NFC
  nfcIcon: {
    alignSelf: 'flex-end',
  },
  nfcDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  // Section
  section: {
    marginBottom: tokens.spacing[10],
  },
  sectionTitle: {
    color: tokens.color.textMedium,
    marginBottom: tokens.spacing[4],
  },
  
  // Style Options
  styleOptions: {
    gap: tokens.spacing[3],
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    paddingVertical: tokens.spacing[4],
  },
  
  // Radio (Nothing's minimal style)
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.color.black,
  },
  
  // Form
  form: {
    gap: tokens.spacing[5],
  },
  field: {
    gap: tokens.spacing[2],
  },
  fieldLabel: {
    color: tokens.color.textMedium,
  },
  inputWrapper: {
    height: 48,
    borderRadius: tokens.radius.input,
    backgroundColor: tokens.color.surfaceVariant,
    borderWidth: 0,
    paddingHorizontal: tokens.spacing[4],
    justifyContent: 'center',
  },
  input: {
    color: tokens.color.text,
  },
  
  // Action
  actionSection: {
    marginTop: tokens.spacing[8],
  },
});

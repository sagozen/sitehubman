/**
 * PersonaModeSwitcher.tsx
 *
 * Executive 3-Way Persona Switcher (Work ⇄ Personal ⇄ Creator).
 * Allows instant live toggling of which digital card profile appears when tapped.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

export type PersonaMode = 'work' | 'personal' | 'creator';

interface PersonaModeSwitcherProps {
  activeMode: PersonaMode;
  onChangeMode: (mode: PersonaMode) => void;
}

const MODES: { id: PersonaMode; label: string; icon: 'Briefcase' | 'Coffee' | 'Sparkles'; desc: string }[] = [
  { id: 'work', label: 'Work', icon: 'Briefcase', desc: 'Corporate, LinkedIn & Deck' },
  { id: 'personal', label: 'Personal', icon: 'Coffee', desc: 'Social, WhatsApp & Vibes' },
  { id: 'creator', label: 'Creator', icon: 'Sparkles', desc: 'Portfolio, YouTube & Shop' },
];

export function PersonaModeSwitcher({
  activeMode = 'work',
  onChangeMode,
}: PersonaModeSwitcherProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabTrack}>
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <Pressable
              key={mode.id}
              onPress={() => {
                HapticTap.medium();
                onChangeMode(mode.id);
              }}
              style={[
                styles.tabBtn,
                isActive && styles.tabBtnActive,
              ]}
            >
              <AppIcon
                name={mode.icon}
                size={13}
                color={isActive ? '#000000' : 'rgba(255,255,255,0.6)'}
              />
              <AppText
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                weight="extrabold"
              >
                {mode.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#000000',
  },
});

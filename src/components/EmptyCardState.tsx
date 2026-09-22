import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

interface EmptyCardStateProps {
  onCreateCard?: () => void;
  onViewContacts?: () => void;
}

export function EmptyCardState({ onCreateCard, onViewContacts }: EmptyCardStateProps) {
  const handleCreate = () => {
    HapticTap.medium();
    if (onCreateCard) {
      onCreateCard();
    } else {
      router.push('/cards/design' as any);
    }
  };

  const handleContacts = () => {
    HapticTap.light();
    if (onViewContacts) {
      onViewContacts();
    } else {
      router.push('/(tabs)/connections' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* 3D Illustration Hero */}
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBackdrop} />
        <View style={styles.iconBox}>
          <AppIcon name="CreditCard" size={54} color="#0A84FF" />
        </View>
      </View>

      <AppText style={styles.title} weight="extrabold">
        No NFC Business Card Yet
      </AppText>

      <AppText style={styles.subtitle}>
        Create your digital business card in 60 seconds. Capture qualified leads, track taps, and turn contacts into recurring revenue.
      </AppText>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Pressable
          style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]}
          onPress={handleCreate}
          hitSlop={12}
        >
          <AppIcon name="Plus" size={20} color="#FFFFFF" />
          <AppText style={styles.createBtnText} weight="extrabold">
            CREATE BUSINESS CARD
          </AppText>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText style={styles.dividerText} weight="bold">
            Or
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.contactsBtn, pressed && styles.pressed]}
          onPress={handleContacts}
          hitSlop={12}
        >
          <AppIcon name="Users" size={18} color="#FFFFFF" />
          <AppText style={styles.contactsBtnText} weight="extrabold">
            CONTACTS DIRECTORY
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    marginVertical: 16,
  },
  illustrationWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  illustrationBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    borderRadius: 60,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  actionSection: {
    width: '100%',
    marginTop: 28,
  },
  createBtn: {
    height: 52,
    backgroundColor: '#0A84FF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  contactsBtn: {
    height: 48,
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

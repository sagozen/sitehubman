import React from 'react';
import {
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
      <View style={styles.iconWrap}>
        <AppIcon name="CreditCard" size={24} color="#0A84FF" />
      </View>

      <AppText style={styles.title} weight="bold">
        No business card yet
      </AppText>

      <AppText style={styles.subtitle}>
        Create your digital business card to share your details and collect contacts via NFC.
      </AppText>

      <View style={styles.actionGroup}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={handleCreate}
          hitSlop={12}
        >
          <AppIcon name="Plus" size={16} color="#FFFFFF" />
          <AppText style={styles.primaryButtonText} weight="bold">
            Create Business Card
          </AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={handleContacts}
          hitSlop={12}
        >
          <AppText style={styles.secondaryButtonText} weight="medium">
            View Contacts Directory
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
    backgroundColor: '#141416',
    borderRadius: 14,
    marginVertical: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  actionGroup: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  secondaryButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});

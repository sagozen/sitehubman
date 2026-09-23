import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { INTENT_OPTIONS, LeadIntent, submitQualifiedLead } from '@/src/services/leadWorkflowService';
import { HapticTap } from '@/src/utils/haptics';

interface ConnectIntentModalProps {
  visible: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
  onSuccess?: () => void;
}

export function ConnectIntentModal({
  visible,
  onClose,
  ownerId,
  ownerName,
  onSuccess,
}: ConnectIntentModalProps) {
  const [selectedIntent, setSelectedIntent] = useState<LeadIntent>('services');
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !contactInfo.trim()) {
      Alert.alert('Missing Details', 'Please enter your name and phone or email so we can connect.');
      return;
    }

    setSubmitting(true);
    HapticTap.light();

    try {
      const intentObj = INTENT_OPTIONS.find((i) => i.id === selectedIntent);
      await submitQualifiedLead({
        ownerId,
        name: name.trim(),
        contactInfo: contactInfo.trim(),
        intent: selectedIntent,
        intentLabel: intentObj?.label ?? 'Services',
        note: note.trim(),
      });

      HapticTap.heavy();
      Alert.alert(
        'Connection Sent',
        `Thanks ${name.trim()}! ${ownerName} has been notified that you are interested in ${intentObj?.label.toLowerCase() ?? 'connecting'}.`
      );

      setName('');
      setContactInfo('');
      setNote('');
      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to send connection request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText style={styles.title} weight="bold">
              Connect with {ownerName}
            </AppText>
            <AppText style={styles.subtitle}>
              What are you interested in discussing?
            </AppText>
          </View>

          {/* Options grid */}
          <View style={styles.optionsList}>
            {INTENT_OPTIONS.map((item) => {
              const isSelected = selectedIntent === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => {
                    HapticTap.light();
                    setSelectedIntent(item.id);
                  }}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionTextWrap}>
                    <AppText style={[styles.optionTitle, isSelected && styles.optionTitleSelected]} weight="bold">
                      {item.label}
                    </AppText>
                    <AppText style={styles.optionPrompt}>
                      {item.prompt}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Inputs */}
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="Your Full Name"
              placeholderTextColor="#666666"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Phone / WhatsApp or Email"
              placeholderTextColor="#666666"
              keyboardType="email-address"
              value={contactInfo}
              onChangeText={setContactInfo}
            />
          </View>

          {/* Submit CTA */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#080808" />
            ) : (
              <AppText style={styles.submitBtnText} weight="bold">
                Send Request
              </AppText>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  optionsList: {
    gap: 8,
    marginBottom: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#0A84FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A84FF',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  optionTitleSelected: {
    color: '#0A84FF',
  },
  optionPrompt: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  formGroup: {
    gap: 10,
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    color: '#FFFFFF',
    fontSize: 14,
  },
  submitBtn: {
    height: 52,
    backgroundColor: '#0A84FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});

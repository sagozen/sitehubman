import React, { memo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { Haptics } from '@/src/utils/haptics';

export interface ContactExchangeModalProps {
  visible: boolean;
  onClose: () => void;
  cardOwnerName: string;
  onSubmit: (lead: { name: string; phone: string; email: string; note: string }) => Promise<void>;
}

function ContactExchangeModalRaw({
  visible,
  onClose,
  cardOwnerName,
  onSubmit,
}: ContactExchangeModalProps) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      Haptics.warning();
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
      });
      Haptics.success();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setPhone('');
        setEmail('');
        setNote('');
        onClose();
      }, 1800);
    } catch {
      Haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: '#111114',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {success ? (
            <View style={styles.successBox}>
              <View style={styles.successIcon}>
                <AppIcon name="CheckCircle" size={44} color="#0066FF" />
              </View>
              <AppText style={styles.successTitle}>Contact Shared!</AppText>
              <AppText style={styles.successSub}>
                Your details were sent to {cardOwnerName}.
              </AppText>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.header}>
                <AppText style={styles.title}>Exchange Contact</AppText>
                <AppText style={styles.sub}>
                  Share your info with {cardOwnerName} so you can connect.
                </AppText>
              </View>

              <View style={styles.inputs}>
                <TextInput
                  placeholder="Your Full Name *"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  autoCorrect={false}
                />

                <TextInput
                  placeholder="Phone Number *"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <TextInput
                  placeholder="Email Address (Optional)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <TextInput
                  placeholder="Add a quick note or meeting context..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={2}
                  style={[styles.input, styles.textArea]}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={loading || !name.trim()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { opacity: 0.8 },
                  (!name.trim() || loading) && { opacity: 0.5 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <AppText style={styles.submitText}>Send Contact</AppText>
                )}
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    lineHeight: 18,
  },
  inputs: {
    gap: 10,
    marginVertical: 14,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textArea: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
  },
  formContainer: {},
});

export const ContactExchangeModal = memo(ContactExchangeModalRaw);

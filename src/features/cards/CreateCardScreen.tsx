import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

interface CardForm {
  fullName: string;
  jobTitle: string;
  company: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
}

const FIELDS: Array<{
  key: keyof CardForm;
  label: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'url';
  numberOfLines?: number;
}> = [
  { key: 'fullName', label: 'Full Name', placeholder: 'John Appleseed' },
  { key: 'jobTitle', label: 'Job Title / Position', placeholder: 'Software Engineer' },
  { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
  { key: 'bio', label: 'Bio', placeholder: 'Brief intro about yourself…', multiline: true, numberOfLines: 3 },
  { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000', keyboardType: 'phone-pad' },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', keyboardType: 'email-address' },
  { key: 'website', label: 'Website', placeholder: 'https://yoursite.com', keyboardType: 'url' },
];

export default function CreateCardScreen() {
  const [form, setForm] = useState<CardForm>({
    fullName: '',
    jobTitle: '',
    company: '',
    bio: '',
    phone: '',
    email: '',
    website: '',
  });

  const debounceTimers = useRef<Partial<Record<keyof CardForm, ReturnType<typeof setTimeout>>>>({});

  const handleChange = useCallback(
    (key: keyof CardForm) => (text: string) => {
      clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        setForm((prev) => ({ ...prev, [key]: text }));
      }, 300);
    },
    []
  );

  const handleCreate = useCallback(() => {
    HapticTap.success();
    router.back();
  }, []);

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
        <AppText style={styles.headerTitle}>New Card</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar Picker */}
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarCircle}>
            <AppIcon name="Camera" size={28} color="#9A9AA0" />
            <AppText style={styles.avatarHint}>Add Photo</AppText>
          </Pressable>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>{field.label}</AppText>
              <TextInput
                style={[styles.input, field.multiline && styles.inputMulti]}
                placeholder={field.placeholder}
                placeholderTextColor="#9A9AA0"
                onChangeText={handleChange(field.key)}
                keyboardType={field.keyboardType ?? 'default'}
                multiline={field.multiline}
                numberOfLines={field.numberOfLines}
                autoCapitalize={field.key === 'email' || field.key === 'website' ? 'none' : 'words'}
                autoCorrect={false}
                textAlignVertical={field.multiline ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
          onPress={handleCreate}
        >
          <AppText style={styles.createBtnText}>Create Card</AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#F5F5F7',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarHint: {
    fontSize: 11,
    color: '#9A9AA0',
    marginTop: 4,
  },
  formSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#9A9AA0',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  input: {
    height: 50,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#F5F5F7',
  },
  inputMulti: {
    height: 84,
    paddingTop: 14,
    paddingBottom: 14,
  },
  createBtn: {
    marginTop: 28,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
  },
});

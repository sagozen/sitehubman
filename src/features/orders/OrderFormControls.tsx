/**
 * OrderFormControls — shared primitives for the new-order / order-detail
 * edit forms. Extracted from NewOrderScreen2 to break the 2000-line file
 * into focused, reusable pieces. Each control is a thin wrapper around
 * the app's design system so new forms can drop them in directly.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/src/components/AppText';

type PillOption<T extends string> = { label: string; value: T; color?: string };

/** Row of rounded pill buttons, single-select. */
export function PillPicker<T extends string>({
  options, value, onChange, accent = '#E91E63',
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
  accent?: string;
}) {
  return (
    <View style={pp.row}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[pp.pill, value === opt.value && { backgroundColor: opt.color ?? accent }]}
          onPress={() => onChange(opt.value)}
        >
          <AppText style={[pp.text, value === opt.value && { color: '#fff' }]}>{opt.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const pp = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff' },
  text: { fontSize: 13, fontWeight: '600', color: '#555' },
});

/** Labelled form field wrapper. */
export function Field({
  label, required, children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={f.wrap}>
      <AppText style={f.label}>
        {label}
        {required ? <AppText style={f.req}> *</AppText> : null}
      </AppText>
      {children}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  req: { color: '#E74C3C' },
});

/** iOS-style on/off toggle. */
export function ToggleControl({
  value, onChange, activeColor, trackColor,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  activeColor?: string;
  trackColor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[tc.track, value && { backgroundColor: activeColor ?? '#34C759' }, !value && { backgroundColor: trackColor ?? '#E5E5EA' }]}
    >
      <View style={[tc.thumb, value && tc.thumbActive]} />
    </Pressable>
  );
}

const tc = StyleSheet.create({
  track: { width: 50, height: 30, borderRadius: 15, justifyContent: 'center', paddingHorizontal: 2 },
  thumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' },
  thumbActive: { transform: [{ translateX: 20 }] },
});

/** Shared input styles used by the form fields. */
export const inputStyle: object = {
  width: '100%',
  minWidth: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  paddingHorizontal: 14,
  height: 48,
  fontSize: 15,
  color: '#0A0A0F',
};

export const multilineStyle: object = {
  ...inputStyle,
  minHeight: 80,
  height: undefined,
  paddingTop: 12,
  paddingBottom: 12,
  textAlignVertical: 'top',
};

/** Pre-styled TextInput for short single-line inputs. */
export function FormInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput {...props} style={[inputStyle as any, props.style]} placeholderTextColor="#8E8E93" />;
}

/** Pre-styled TextInput for multi-line inputs. */
export function FormMultilineInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput {...props} multiline style={[multilineStyle as any, props.style]} placeholderTextColor="#8E8E93" />;
}

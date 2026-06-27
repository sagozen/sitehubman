/**
 * Auth UI — simple full-screen entry, closer to Facebook than a landing page.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';

const BRAND = '#007AFF';
const INK = '#000000';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const SURFACE = '#FFFFFF';
const BACKGROUND = '#FFFFFF';
const BORDER = '#E5E5EA';

// ─── Shell ────────────────────────────────────────────────────────────────────
export function AuthLoginShell({ children }: PropsWithChildren) {
  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <IosScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </IosScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function AuthScreenShell({ children }: PropsWithChildren) {
  return <AuthLoginShell>{children}</AuthLoginShell>;
}

export function AuthLoginCard({ children }: PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}

// ─── Headers ──────────────────────────────────────────────────────────────────
export function AuthWelcomeHeader({
  title = 'Log in to NFC Global',
  subtitle = 'Manage your card, profile, and network.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={s.headerWrap}>
      <View style={s.nfcBadgeContainer}>
        <View style={s.nfcBadge}>
          <AppIcon name="CreditCard" size={26} color={BRAND} />
        </View>
      </View>
      <AppText style={s.headerTitle}>{title}</AppText>
      <AppText style={s.headerSub}>{subtitle}</AppText>
    </View>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.headerWrap}>
      <AppText style={s.headerTitle}>{title}</AppText>
      {subtitle ? <AppText style={s.headerSub}>{subtitle}</AppText> : null}
    </View>
  );
}

// ─── Fields ───────────────────────────────────────────────────────────────────
export function AuthIconTextField({
  fieldIcon: _fieldIcon,
  label,
  trailing,
  ...rest
}: TextInputProps & { fieldIcon: string; label?: string; trailing?: ReactNode }) {
  return (
    <View style={s.field}>
      {label ? <AppText style={s.fieldLabel}>{label}</AppText> : null}
      <View style={s.fieldRow}>
        <TextInput
          style={s.fieldInput}
          placeholderTextColor="#B8C0CC"
          {...rest}
        />
        {trailing ? <View style={s.fieldTrailing}>{trailing}</View> : null}
      </View>
    </View>
  );
}

export function AuthFormGroup({ children }: PropsWithChildren) {
  return <View style={s.formGroup}>{children}</View>;
}

export function AuthTextField({ label, isLast, trailing, ...rest }: TextInputProps & { label?: string; isLast?: boolean; trailing?: ReactNode }) {
  return (
    <View style={[s.groupField, !isLast && s.groupFieldBorder]}>
      {label && <AppText style={s.groupFieldLabel}>{label}</AppText>}
      <TextInput style={s.groupFieldInput} placeholderTextColor="#B8C0CC" {...rest} />
      {trailing}
    </View>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
export function AuthPrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [s.primaryBtn, off && s.btnOff, pressed && !off && s.btnPressed]}
    >
      {loading
        ? <ActivityIndicator color="#FFFFFF" size="small" />
        : <AppText style={s.primaryBtnT}>{label}</AppText>}
    </Pressable>
  );
}

export function AuthTextButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [s.textBtn, pressed && !off && s.btnPressed]}
    >
      {loading
        ? <ActivityIndicator color={MUTED} size="small" />
        : <AppText style={s.textBtnT}>{label}</AppText>}
    </Pressable>
  );
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
export function AuthOrDivider({ label = 'or' }: { label?: string }) {
  return (
    <View style={s.divider}>
      <View style={s.divLine} />
      <AppText style={s.divT}>{label}</AppText>
      <View style={s.divLine} />
    </View>
  );
}

export function AuthFooterLink({
  prompt,
  action,
  onPress,
  disabled,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: string;
}) {
  return (
    <View style={s.footerRow}>
      <AppText style={s.footerPrompt}>{prompt}</AppText>
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
        <AppText style={s.footerAction}>{action}</AppText>
      </Pressable>
    </View>
  );
}

export function AuthTrustFooter() {
  return (
    <View style={s.trust}>
      <AppText style={s.trustT}>Secured · NFC by Snap Tap</AppText>
    </View>
  );
}

export function AuthSectionLabel({ children }: { children: string }) {
  return <AppText style={s.sectionLabel}>{children}</AppText>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  safe: { flex: 1, backgroundColor: BACKGROUND },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 20 },

  card: { width: '100%', gap: 24 },

  headerWrap: { gap: 8, marginBottom: 8, alignItems: 'center' },
  nfcBadgeContainer: { marginBottom: 12 },
  nfcBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: BORDER },
  headerTitle: { fontSize: 30, lineHeight: 34, fontWeight: '900', color: INK, letterSpacing: -0.6, textAlign: 'center', fontFamily: 'Inter_900Black' },
  headerSub: { fontSize: 15, lineHeight: 22, fontWeight: '500', color: MUTED, textAlign: 'center', fontFamily: 'Inter_500Medium' },

  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0, marginLeft: 2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 15, minHeight: 56 },
  fieldInput: { flex: 1, fontSize: 16, fontWeight: '500', color: INK2, paddingVertical: Platform.OS === 'ios' ? 15 : 11 },
  fieldTrailing: { alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },

  formGroup: { backgroundColor: SURFACE, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1 },
  groupField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 54 },
  groupFieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  groupFieldLabel: { fontSize: 16, fontWeight: '500', color: INK2, width: 85 },
  groupFieldInput: { flex: 1, fontSize: 16, fontWeight: '400', color: INK2, paddingVertical: Platform.OS === 'ios' ? 14 : 10 },

  primaryBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#111827' },
  primaryBtnT: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  textBtn: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE },
  textBtnT: { fontSize: 15, fontWeight: '700', color: INK2, fontFamily: 'Inter_700Bold' },
  btnOff: { opacity: 0.5 },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },
  divT: { fontSize: 13, fontWeight: '600', color: MUTED, fontFamily: 'Inter_600SemiBold' },

  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  footerPrompt: { fontSize: 15, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
  footerAction: { fontSize: 15, fontWeight: '750' as any, color: BRAND, fontFamily: 'Inter_700Bold' },

  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  trustT: { fontSize: 12, fontWeight: '500', color: '#A1A1A6', fontFamily: 'Inter_500Medium' },

  sectionLabel: { fontSize: 12, fontWeight: '600', color: MUTED, letterSpacing: 0.3, textTransform: 'uppercase', marginLeft: 2, fontFamily: 'Inter_600SemiBold' },
});

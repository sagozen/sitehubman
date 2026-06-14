/**
 * Auth UI — clean Inter editorial style, no glass/blur, no SnapTapBackground.
 * Matches the home/settings design system.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND = '#2596BE';
const BRAND_DARK = '#1A7FAA';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const FIELD_BG = '#FFFFFF';
const FIELD_BORDER = 'rgba(0,0,0,0.08)';

// ─── Shared shell ─────────────────────────────────────────────────────────────

export function AuthLoginShell({ children }: PropsWithChildren) {
  return (
    <View style={s.root}>
      {/* Decorative gradient header band */}
      <LinearGradient
        colors={[BRAND_DARK, BRAND, '#4DB8D8', '#F5F5F7']}
        locations={[0, 0.4, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.heroBand}
        pointerEvents="none"
      />
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

/** Alias for register screen */
export function AuthScreenShell({ children }: PropsWithChildren) {
  return <AuthLoginShell>{children}</AuthLoginShell>;
}

/** White card wrapper around login form fields */
export function AuthLoginCard({ children }: PropsWithChildren) {
  return (
    <View style={s.card}>
      {children}
    </View>
  );
}

// ─── Welcome header (login) ───────────────────────────────────────────────────

export function AuthWelcomeHeader({
  title = 'Sign in to your account',
  subtitle = 'Your NFC identity, one tap away.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={s.welcomeWrap}>
      {/* Brand badge */}
      <View style={s.brandBadge}>
        <AppIcon name="Nfc" size={16} color={BRAND} />
        <AppText style={s.brandBadgeT}>SNAP TAP NFC</AppText>
      </View>
      <AppText style={s.welcomeTitle}>{title}</AppText>
      <AppText style={s.welcomeSub}>{subtitle}</AppText>
    </View>
  );
}

/** Register screen header */
export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={s.welcomeWrap}>
      <View style={s.brandBadge}>
        <AppIcon name="Nfc" size={16} color={BRAND} />
        <AppText style={s.brandBadgeT}>SNAP TAP NFC</AppText>
      </View>
      <AppText style={s.welcomeTitle}>{title}</AppText>
      {subtitle ? <AppText style={s.welcomeSub}>{subtitle}</AppText> : null}
    </View>
  );
}

// ─── Field with leading icon ──────────────────────────────────────────────────

type AuthFieldIconType = 'email' | 'password' | 'name' | string;

function fieldIcon(type: AuthFieldIconType) {
  if (type === 'email') return 'Mail' as const;
  if (type === 'password') return 'ShieldCheck' as const;
  if (type === 'name') return 'User' as const;
  return 'User' as const;
}

export function AuthIconTextField({
  fieldIcon: iconType,
  label,
  trailing,
  ...rest
}: TextInputProps & {
  fieldIcon: AuthFieldIconType;
  label?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={s.field}>
      {label ? <AppText style={s.fieldLabel}>{label}</AppText> : null}
      <View style={s.fieldRow}>
        <AppIcon name={fieldIcon(iconType)} size={18} color={MUTED} />
        <TextInput
          style={s.fieldInput}
          placeholderTextColor={MUTED}
          {...rest}
        />
        {trailing ? <View style={s.fieldTrailing}>{trailing}</View> : null}
      </View>
    </View>
  );
}

/** Group of plain fields (register) */
export function AuthFormGroup({ children }: PropsWithChildren) {
  return <View style={s.formGroup}>{children}</View>;
}

export function AuthTextField({
  isLast,
  trailing,
  ...rest
}: TextInputProps & { isLast?: boolean; trailing?: ReactNode }) {
  return (
    <View style={[s.groupField, !isLast && s.groupFieldBorder]}>
      <TextInput
        style={s.groupFieldInput}
        placeholderTextColor={MUTED}
        {...rest}
      />
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
  variant: _variant,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [s.primaryBtn, isDisabled && s.btnDisabled, pressed && !isDisabled && s.btnPressed]}
    >
      <LinearGradient
        colors={[BRAND_DARK, BRAND]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <AppText style={s.primaryBtnT}>{label}</AppText>
      )}
    </Pressable>
  );
}

export function AuthTextButton({
  label,
  onPress,
  loading,
  disabled,
  variant: _variant,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [s.textBtn, pressed && !isDisabled && s.btnPressed]}
    >
      {loading ? (
        <ActivityIndicator color={BRAND} size="small" />
      ) : (
        <AppText style={[s.textBtnT, isDisabled && s.textBtnDisabled]}>{label}</AppText>
      )}
    </Pressable>
  );
}

// ─── Divider, footer, trust strip ─────────────────────────────────────────────

export function AuthOrDivider({ label = 'or' }: { label?: string }) {
  return (
    <View style={s.divider}>
      <View style={s.dividerLine} />
      <AppText style={s.dividerT}>{label}</AppText>
      <View style={s.dividerLine} />
    </View>
  );
}

export function AuthFooterLink({
  prompt,
  action,
  onPress,
  disabled,
  variant: _variant,
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
      <AppIcon name="ShieldCheck" size={14} color={BRAND} />
      <AppText style={s.trustT}>Secured by Firebase · NFC by Snap Tap</AppText>
    </View>
  );
}

export function AuthSectionLabel({ children }: { children: string }) {
  return <AppText style={s.sectionLabel}>{children}</AppText>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  heroBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },

  // Welcome header
  welcomeWrap: { alignItems: 'center', gap: 8, marginBottom: 4 },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(37,150,190,0.2)',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  brandBadgeT: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND,
    letterSpacing: 0.8,
    fontFamily: 'Inter_800ExtraBold',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: SURFACE,
    letterSpacing: -0.7,
    textAlign: 'center',
    fontFamily: 'Inter_900Black',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  welcomeSub: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },

  // Card
  card: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 22,
    gap: 14,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },

  // Icon field
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginLeft: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FIELD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    paddingHorizontal: 14,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: INK2,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontFamily: 'Inter_500Medium',
  },
  fieldTrailing: { alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },

  // FormGroup (register)
  formGroup: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  groupField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    minHeight: 54,
  },
  groupFieldBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  groupFieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: INK2,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontFamily: 'Inter_500Medium',
  },

  // Buttons
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryBtnT: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter_800ExtraBold',
  },
  textBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: SURFACE,
  },
  textBtnT: {
    fontSize: 15,
    fontWeight: '700',
    color: INK2,
    fontFamily: 'Inter_700Bold',
  },
  textBtnDisabled: { opacity: 0.45 },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.12)' },
  dividerT: { fontSize: 12, fontWeight: '600', color: MUTED, fontFamily: 'Inter_600SemiBold' },

  // Footer
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerPrompt: { fontSize: 14, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },
  footerAction: { fontSize: 14, fontWeight: '700', color: BRAND, fontFamily: 'Inter_700Bold' },

  // Trust strip
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  trustT: { fontSize: 11, fontWeight: '500', color: MUTED, fontFamily: 'Inter_500Medium' },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.3,
    marginLeft: 2,
    fontFamily: 'Inter_600SemiBold',
  },
});

/**
 * Auth UI — Premium NFC-branded shell.
 * Hero shows animated NFC card. Form is clean white card below.
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

const BRAND = '#2596BE';
const BRAND_DARK = '#1A7FAA';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#8E8E93';
const BG = '#F5F5F7';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.07)';

// ─── Card face preview (mini NFC card in hero) ────────────────────────────────
function MiniCardHero() {
  return (
    <View style={hero.stage}>
      <View style={hero.backCard} />
      <View style={hero.card}>
      <LinearGradient
        colors={['#111111', '#202124', '#2596BE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={hero.top}>
        <View style={hero.logo}><AppText style={hero.logoT}>N</AppText></View>
        <AppIcon name="Nfc" size={16} color="rgba(255,255,255,0.5)" />
      </View>
      <View style={hero.bottom}>
        <AppText style={hero.name}>Your Name</AppText>
        <AppText style={hero.sub}>Verified identity</AppText>
        <View style={hero.nfcRow}>
          <AppIcon name="Nfc" size={11} color="rgba(255,255,255,0.7)" />
          <AppText style={hero.nfcT}>Tap to share</AppText>
        </View>
      </View>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  stage: { paddingTop: 14, alignItems: 'center' },
  backCard: {
    position: 'absolute',
    top: 0,
    width: 184,
    height: 42,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  card: {
    width: 244,
    height: 154,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoT: { fontSize: 16, fontWeight: '900', color: '#111111' },
  bottom: { gap: 2 },
  name: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0 },
  sub: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.66)' },
  nfcRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  nfcT: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
});

// ─── Shell ────────────────────────────────────────────────────────────────────
export function AuthLoginShell({ children }: PropsWithChildren) {
  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#111111', '#2596BE', BG]}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.heroBg}
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
            {/* Hero card */}
            <View style={s.heroSection}>
              <MiniCardHero />
              <View style={s.heroBadge}>
                <AppIcon name="Nfc" size={12} color={BRAND} />
                <AppText style={s.heroBadgeT}>SNAP TAP NFC</AppText>
              </View>
            </View>
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
  title = 'Your card is waiting.',
  subtitle = 'Sign in to manage your NFC identity, share link, and network.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={s.headerWrap}>
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
  fieldIcon: iconType,
  label,
  trailing,
  ...rest
}: TextInputProps & { fieldIcon: string; label?: string; trailing?: ReactNode }) {
  const icon = iconType === 'email' ? 'Mail' as const : iconType === 'password' ? 'Shield' as const : 'User' as const;
  return (
    <View style={s.field}>
      {label ? <AppText style={s.fieldLabel}>{label}</AppText> : null}
      <View style={s.fieldRow}>
        <AppIcon name={icon} size={17} color={MUTED} />
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

export function AuthTextField({ isLast, trailing, ...rest }: TextInputProps & { isLast?: boolean; trailing?: ReactNode }) {
  return (
    <View style={[s.groupField, !isLast && s.groupFieldBorder]}>
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
      <LinearGradient colors={[BRAND_DARK, BRAND]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
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
      <AppIcon name="ShieldCheck" size={13} color={BRAND} />
      <AppText style={s.trustT}>Secured · NFC by Snap Tap</AppText>
    </View>
  );
}

export function AuthSectionLabel({ children }: { children: string }) {
  return <AppText style={s.sectionLabel}>{children}</AppText>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 44, paddingBottom: 40, gap: 20 },

  heroSection: { alignItems: 'center', gap: 18, paddingBottom: 2 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  heroBadgeT: { fontSize: 10, fontWeight: '800', color: BRAND, letterSpacing: 0.8 },

  card: { backgroundColor: SURFACE, borderRadius: 28, padding: 24, gap: 16, shadowColor: INK, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },

  headerWrap: { gap: 7 },
  headerTitle: { fontSize: 32, lineHeight: 35, fontWeight: '900', color: INK, letterSpacing: 0 },
  headerSub: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: MUTED },

  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0, marginLeft: 2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BG, borderRadius: 18, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 15, minHeight: 56 },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '700', color: INK2, paddingVertical: Platform.OS === 'ios' ? 15 : 11 },
  fieldTrailing: { alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },

  formGroup: { backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  groupField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, minHeight: 52 },
  groupFieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.07)' },
  groupFieldInput: { flex: 1, fontSize: 15, fontWeight: '500', color: INK2, paddingVertical: Platform.OS === 'ios' ? 14 : 10 },

  primaryBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  primaryBtnT: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  textBtn: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE },
  textBtnT: { fontSize: 14, fontWeight: '800', color: INK2 },
  btnOff: { opacity: 0.5 },
  btnPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.1)' },
  divT: { fontSize: 12, fontWeight: '600', color: MUTED },

  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerPrompt: { fontSize: 13, fontWeight: '500', color: MUTED },
  footerAction: { fontSize: 13, fontWeight: '800', color: BRAND },

  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  trustT: { fontSize: 11, fontWeight: '500', color: MUTED },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 0.3, textTransform: 'uppercase', marginLeft: 2 },
});

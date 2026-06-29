import { IosScrollView } from '@/src/components/IosScrollView';
import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticTap } from '@/src/utils/haptics';

const BRAND = '#007AFF';
const INK = '#111827';
const INK2 = '#374151';
const MUTED = '#9CA3AF';
const SURFACE = '#FFFFFF';
const BACKGROUND = '#FFFFFF';
const BORDER = '#E5E7EB';

// ─── Animated Hero Card component ───────────────────────────────────────────
export function AnimatedHeroCard() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Floating movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Soft NFC wave pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={heroStyles.container}>
      {/* Soft Light ambient background */}
      <Animated.View style={[heroStyles.ambientGlow, { transform: [{ scale: pulseAnim }] }]} />

      <Animated.View style={[heroStyles.cardFrame, { transform: [{ translateY: floatAnim }] }]}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={heroStyles.cardGradient}
        >
          {/* Card Glass shine line */}
          <View style={heroStyles.cardShine} />
          
          <View style={heroStyles.cardHeader}>
            <AppIcon name="Nfc" size={24} color="#FFFFFF" />
            <View style={heroStyles.chip} />
          </View>
          <View style={heroStyles.cardFooter}>
            <AppText style={heroStyles.cardName}>NFC MEMBER</AppText>
            <AppText style={heroStyles.cardSerial}>GLOBAL IDENTITY</AppText>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    height: 160,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  } as ViewStyle,
  ambientGlow: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    filter: 'blur(30px)',
  } as ViewStyle,
  cardFrame: {
    width: 200,
    height: 126,
    borderRadius: 16,
    backgroundColor: '#111827',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  } as ViewStyle,
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  } as ViewStyle,
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ skewY: '-15deg' }, { scaleX: 1.5 }],
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  chip: {
    width: 28,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    opacity: 0.8,
  } as ViewStyle,
  cardFooter: {
    gap: 3,
  } as ViewStyle,
  cardName: {
    fontSize: 10,
    fontWeight: '850' as any,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  } as TextStyle,
  cardSerial: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  } as TextStyle,
});

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
  title = 'NFC Global',
  subtitle = 'Create. Share. Connect.\nOne digital identity for every conversation.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={s.headerWrap}>
      {/* 3D Animated Hero card illustration */}
      <AnimatedHeroCard />

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
          placeholderTextColor="#9CA3AF"
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
  const [focused, setFocused] = useState(false);
  return (
    <View style={[
      s.groupField, 
      !isLast && s.groupFieldBorder,
      focused && s.groupFieldFocused
    ]}>
      {label && <AppText style={s.groupFieldLabel}>{label}</AppText>}
      <TextInput
        style={s.groupFieldInput}
        placeholderTextColor="#C4CFDE"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
      onPress={() => {
        if (!off) HapticTap.light();
        onPress();
      }}
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
      onPress={() => {
        if (!off) HapticTap.light();
        onPress();
      }}
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
      <AppText style={s.trustT}>✓ Trusted by professionals worldwide</AppText>
      <AppText style={s.trustSub}>Secure End-to-End Encryption • NFC + QR Compatible</AppText>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 40, gap: 22 },

  card: { width: '100%', gap: 20 },

  headerWrap: { gap: 8, marginBottom: 8, alignItems: 'center' },
  headerTitle: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: INK, letterSpacing: -0.8, textAlign: 'center', fontFamily: 'Inter_900Black' },
  headerSub: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: MUTED, textAlign: 'center', fontFamily: 'Inter_500Medium' },

  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0, marginLeft: 2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 15, minHeight: 56 },
  fieldInput: { flex: 1, fontSize: 16, fontWeight: '500', color: INK, paddingVertical: Platform.OS === 'ios' ? 15 : 11 },
  fieldTrailing: { alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },

  formGroup: { backgroundColor: '#F9FAFB', borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.01, shadowRadius: 10, elevation: 1 },
  groupField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 54, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  groupFieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  groupFieldFocused: { borderLeftColor: BRAND, backgroundColor: 'rgba(0,122,255,0.02)' },
  groupFieldLabel: { fontSize: 15, fontWeight: '750' as any, color: INK, width: 85 },
  groupFieldInput: { flex: 1, fontSize: 15, fontWeight: '600', color: INK, paddingVertical: Platform.OS === 'ios' ? 14 : 10 },

  primaryBtn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#111827' },
  primaryBtnT: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },
  textBtn: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1.5, borderColor: BORDER, backgroundColor: SURFACE },
  textBtnT: { fontSize: 15, fontWeight: '800', color: INK, fontFamily: 'Inter_700Bold' },
  btnOff: { opacity: 0.4 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },
  divT: { fontSize: 12, fontWeight: '800', color: MUTED, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },

  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  footerPrompt: { fontSize: 14, fontWeight: '600', color: MUTED, fontFamily: 'Inter_500Medium' },
  footerAction: { fontSize: 14, fontWeight: '850' as any, color: BRAND, fontFamily: 'Inter_700Bold' },

  trust: { alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 24 },
  trustT: { fontSize: 12, fontWeight: '800', color: '#059669', fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  trustSub: { fontSize: 10, fontWeight: '600', color: MUTED, fontFamily: 'Inter_500Medium' },

  sectionLabel: { fontSize: 12, fontWeight: '600', color: MUTED, letterSpacing: 0.3, textTransform: 'uppercase', marginLeft: 2, fontFamily: 'Inter_600SemiBold' },
});

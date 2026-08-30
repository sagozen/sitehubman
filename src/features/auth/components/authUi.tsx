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
import { MotionScale } from '@/src/utils/motion';

const BRAND = '#F59E0B'; // Warm Amber Primary Accent
const INK = '#FFFFFF';
const INK2 = '#D1D5DB';
const MUTED = '#9A9AA0';
const SURFACE = '#131316'; // Dark Charcoal Surface
const BACKGROUND = '#0B0B0E'; // Near-Black Textured Canvas
const BORDER = 'rgba(255, 255, 255, 0.08)';

// ─── Animated Hero Card component ───────────────────────────────────────────
export function AnimatedHeroCard() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Floating movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Soft amber glowing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, pulseAnim]);

  return (
    <View style={heroStyles.container}>
      {/* Amber ambient background glow */}
      <Animated.View style={[heroStyles.ambientGlow, { transform: [{ scale: pulseAnim }] }]} />

      <Animated.View style={[heroStyles.cardFrame, { transform: [{ translateY: floatAnim }] }]}>
        <LinearGradient
          colors={['#1E1E24', '#111115']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={heroStyles.cardGradient}
        >
          {/* Card Glass shine line */}
          <View style={heroStyles.cardShine} />

          <View style={heroStyles.cardHeader}>
            <AppIcon name="Nfc" size={24} color="#F59E0B" />
            <View style={heroStyles.chip} />
          </View>
          <View style={heroStyles.cardFooter}>
            <AppText style={heroStyles.cardName}>SITEHUB PRO</AppText>
            <AppText style={heroStyles.cardSerial}>SMART NFC PASS</AppText>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  } as ViewStyle,
  ambientGlow: {
    position: 'absolute',
    width: 210,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(245, 158, 11, 0.12)', // Amber Ambient Glow
  } as ViewStyle,
  cardFrame: {
    width: 210,
    height: 130,
    borderRadius: 20,
    backgroundColor: '#131316',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ skewY: '-15deg' }, { scaleX: 1.5 }],
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  chip: {
    width: 32,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    opacity: 0.9,
  } as ViewStyle,
  cardFooter: {
    gap: 2,
  } as ViewStyle,
  cardName: {
    fontSize: 11,
    fontWeight: '800' as any,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  } as TextStyle,
  cardSerial: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
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
  title = 'SiteHub NFC',
  subtitle = 'Create, Share & Tap. One digital identity for every conversation.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={s.headerWrap}>
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
          placeholderTextColor="#9A9AA0"
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
        placeholderTextColor="#9A9AA0"
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
        ? <ActivityIndicator color="#1C1C1F" size="small" />
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
      <Pressable
        onPress={() => {
          HapticTap.light();
          onPress();
        }}
        disabled={disabled}
        hitSlop={8}
      >
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40, gap: 20 },

  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: SURFACE,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    gap: 20,
  },

  headerWrap: { gap: 8, marginBottom: 8, alignItems: 'center' },
  headerTitle: { fontSize: 30, lineHeight: 34, fontWeight: '900', color: INK, letterSpacing: -0.6, textAlign: 'center' },
  headerSub: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: MUTED, textAlign: 'center' },

  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.6, textTransform: 'uppercase', marginLeft: 2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181C', borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 16, minHeight: 54 },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', color: INK, paddingVertical: Platform.OS === 'ios' ? 14 : 10 },
  fieldTrailing: { alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },

  formGroup: { backgroundColor: '#18181C', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  groupField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 54, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  groupFieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  groupFieldFocused: { borderLeftColor: BRAND, backgroundColor: 'rgba(245,158,11,0.04)' },
  groupFieldLabel: { fontSize: 14, fontWeight: '700', color: INK, width: 90 },
  groupFieldInput: { flex: 1, fontSize: 15, fontWeight: '600', color: INK, paddingVertical: Platform.OS === 'ios' ? 14 : 10 },

  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: BRAND },
  primaryBtnT: { fontSize: 16, fontWeight: '800', color: '#1C1C1F', letterSpacing: -0.2 },
  textBtn: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE },
  textBtnT: { fontSize: 15, fontWeight: '700', color: INK },
  btnOff: { opacity: 0.4 },
  btnPressed: { opacity: 0.88, transform: [{ scale: MotionScale.pressed }] },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: BORDER },
  divT: { fontSize: 12, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },

  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  footerPrompt: { fontSize: 14, fontWeight: '500', color: MUTED },
  footerAction: { fontSize: 14, fontWeight: '800', color: BRAND },

  trust: { alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20 },
  trustT: { fontSize: 12, fontWeight: '800', color: '#30D158', letterSpacing: 0.3 },
  trustSub: { fontSize: 10, fontWeight: '500', color: MUTED },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginLeft: 2 },
});

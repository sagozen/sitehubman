import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GUEST_GREEN_ORANGE_GRADIENT } from '@/src/constants/guestCardDesign';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { iosDesign } from '@/src/design-system/ios';

type StepKind = 'design' | 'checkout' | 'track';

type Props = {
  kind: StepKind;
};

const BLACK_GRADIENT = ['#1C1C1E', '#2C2C2E', '#3A3A3C'] as const;

function MiniCard({
  colors,
  label,
  dashed,
}: {
  colors?: readonly [string, string, ...string[]];
  label: string;
  dashed?: boolean;
}) {
  return (
    <View style={styles.miniWrap}>
      <View style={[styles.miniCard, dashed && styles.miniCardDashed]}>
        {colors ? (
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        ) : null}
        {dashed ? <AppIcon name="Plus" size={18} color={guestUi.accent} /> : null}
        {!dashed ? (
          <AppText style={styles.miniName} numberOfLines={1}>
            YOUR NAME
          </AppText>
        ) : null}
      </View>
      <AppText style={styles.miniLabel}>{label}</AppText>
    </View>
  );
}

function FeatureChip({ icon, label }: { icon: AppIconName; label: string }) {
  return (
    <View style={styles.chip}>
      <AppIcon name={icon} size={12} color={guestUi.accent} />
      <AppText style={styles.chipText}>{label}</AppText>
    </View>
  );
}

function FlowStep({ icon, label, last }: { icon: AppIconName; label: string; last?: boolean }) {
  return (
    <View style={styles.flowStep}>
      <View style={styles.flowIcon}>
        <AppIcon name={icon} size={16} color={guestUi.accent} />
      </View>
      <AppText style={styles.flowLabel}>{label}</AppText>
      {!last ? <View style={styles.flowLine} /> : null}
    </View>
  );
}

/** Clear product preview — no Cloudinary / AI hero image. */
export function GuestOnboardingStepVisual({ kind }: Props) {
  if (kind === 'design') {
    return (
      <View style={styles.panel}>
        <AppText style={styles.panelEyebrow}>What you can design</AppText>
        <View style={styles.cardRow}>
          <MiniCard colors={BLACK_GRADIENT} label="Black" />
          <MiniCard colors={GUEST_GREEN_ORANGE_GRADIENT.colors} label="Green orange" />
          <MiniCard label="Your photo" dashed />
        </View>
        <View style={styles.chipRow}>
          <FeatureChip icon="Phone" label="E-card" />
          <FeatureChip icon="CreditCard" label="Physical" />
          <FeatureChip icon="Nfc" label="NFC tap" />
        </View>
      </View>
    );
  }

  if (kind === 'checkout') {
    return (
      <View style={styles.panel}>
        <AppText style={styles.panelEyebrow}>What happens at checkout</AppText>
        <View style={styles.checkoutGrid}>
          <FeatureChip icon="QrCode" label="KHQR / Bakong" />
          <FeatureChip icon="Wallet" label="ABA · Wing · Pi Pay" />
          <FeatureChip icon="Printer" label="Print artwork" />
          <FeatureChip icon="Nfc" label="Encode chip" />
          <FeatureChip icon="QrCode" label="QR backup" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <AppText style={styles.panelEyebrow}>Track your order</AppText>
      <View style={styles.flowRow}>
        <FlowStep icon="Package" label="Paid" />
        <FlowStep icon="Printer" label="Print" />
        <FlowStep icon="Nfc" label="Encode" />
        <FlowStep icon="Truck" label="Ship" last />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: iosDesign.spacing.lg,
    padding: iosDesign.spacing.md,
    borderRadius: iosDesign.radius.lg,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    gap: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  panelEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: guestUi.muted,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  miniWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  miniCard: {
    width: '100%',
    aspectRatio: 1.58,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 6,
  },
  miniCardDashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(37,150,190,0.4)',
    backgroundColor: 'rgba(37,150,190,0.06)',
    justifyContent: 'center',
  },
  miniName: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: guestUi.text,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: guestUi.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37,150,190,0.2)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: guestUi.text,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flowStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  flowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: guestUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    color: guestUi.text,
    textAlign: 'center',
  },
  flowLine: {
    position: 'absolute',
    top: 18,
    left: '58%',
    right: '-42%',
    height: 2,
    backgroundColor: guestUi.border,
    zIndex: -1,
  },
});

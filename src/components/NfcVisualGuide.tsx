import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { MarketingSceneImage } from '@/src/components/MarketingSceneImage';
import { NFC_GUIDE_SCENE_IDS } from '@/src/constants/marketingScenes';
import { nfcGuideSteps } from '@/src/constants/productPhotoCatalog';
import { iosDesign } from '@/src/design-system/ios';

type Props = {
  title?: string;
  subtitle?: string;
};

/** Visual guide — how NFC cards go from design to tap-ready delivery. */
export function NfcVisualGuide({
  title = 'How NFC cards work',
  subtitle = 'Product-first flow — no app required for the person tapping your card',
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>{subtitle}</AppText>
      </View>
      <View style={styles.steps}>
        {nfcGuideSteps.map((step, index) => (
          <View
            key={step.id}
            style={[styles.step, index < nfcGuideSteps.length - 1 && styles.stepBorder]}
          >
            <View style={styles.stepMedia}>
              <MarketingSceneImage
                sceneId={NFC_GUIDE_SCENE_IDS[index] ?? 'design-card'}
                width={320}
                height={200}
                lazy={index > 0}
                style={styles.stepImage}
              />
              <View style={styles.stepBadge}>
                <AppText style={styles.stepBadgeText}>{step.step}</AppText>
              </View>
            </View>
            <View style={styles.stepCopy}>
              <View style={styles.stepTitleRow}>
                <AppIcon name="Nfc" size={14} color="#0EA5E9" />
                <AppText style={styles.stepTitle}>{step.title}</AppText>
              </View>
              <AppText style={styles.stepBody}>{step.body}</AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: iosDesign.spacing.sm,
  },
  head: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: '#64748B',
  },
  steps: {
    borderRadius: iosDesign.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    ...iosDesign.shadows.card,
  },
  step: {
    flexDirection: 'row',
    gap: iosDesign.spacing.sm,
    padding: iosDesign.spacing.sm,
    alignItems: 'center',
  },
  stepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  stepMedia: {
    width: 96,
    height: 72,
    borderRadius: iosDesign.radius.md,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  stepImageFallback: {
    backgroundColor: '#334155',
  },
  stepBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepBody: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: '#64748B',
  },
});

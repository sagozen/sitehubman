import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

type CardStyleId = 'minimal' | 'professional' | 'premium' | 'creative';

interface CardStyleOption {
  id: CardStyleId;
  label: string;
  description: string;
}

const CARD_STYLES: CardStyleOption[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Solid black. Clean lines. Maximum focus.',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Dark surface with a blue accent stripe.',
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Subtle gradient that catches light.',
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Custom layout, your rules.',
  },
];

const STORAGE_KEY = '@sitehubman/onboarding_card_style';

function MinimalPreview() {
  return (
    <View style={previewStyles.minimal}>
      <View style={previewStyles.minimalLine} />
      <View style={[previewStyles.minimalLine, previewStyles.minimalLineShort]} />
    </View>
  );
}

function ProfessionalPreview() {
  return (
    <View style={previewStyles.professional}>
      <View style={previewStyles.professionalAccent} />
      <View style={previewStyles.minimalLine} />
      <View style={[previewStyles.minimalLine, previewStyles.minimalLineShort]} />
    </View>
  );
}

function PremiumPreview() {
  return (
    <LinearGradient
      colors={['#1A2535', '#111114']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={previewStyles.premium}
    >
      <LinearGradient
        colors={['rgba(37,150,190,0.5)', 'rgba(37,150,190,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={previewStyles.premiumShimmer}
      />
      <View style={previewStyles.minimalLine} />
      <View style={[previewStyles.minimalLine, previewStyles.minimalLineShort]} />
    </LinearGradient>
  );
}

function CreativePreview() {
  return (
    <View style={previewStyles.creative}>
      <View style={previewStyles.creativeDot} />
      <View style={previewStyles.creativeLines}>
        <View style={previewStyles.minimalLine} />
        <View style={[previewStyles.minimalLine, previewStyles.minimalLineShort]} />
      </View>
    </View>
  );
}

const PREVIEWS: Record<CardStyleId, () => React.JSX.Element> = {
  minimal: MinimalPreview,
  professional: ProfessionalPreview,
  premium: PremiumPreview,
  creative: CreativePreview,
};

export function CardStyleScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CardStyleId | null>(null);

  function handleSelect(id: CardStyleId) {
    HapticTap.selection();
    setSelected(id);
  }

  async function handleFinish() {
    if (!selected) return;
    HapticTap.success();
    await AsyncStorage.setItem(STORAGE_KEY, selected);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="display" weight="semibold" style={styles.title}>
              Choose your{'\n'}card style
            </AppText>
            <AppText variant="body" muted style={styles.subtitle}>
              You can always change this later from your profile settings.
            </AppText>
          </View>

          {/* Style list */}
          <View style={styles.list}>
            {CARD_STYLES.map((style) => {
              const isActive = selected === style.id;
              const Preview = PREVIEWS[style.id];
              return (
                <Pressable
                  key={style.id}
                  style={({ pressed }) => [
                    styles.card,
                    isActive && styles.cardActive,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => handleSelect(style.id)}
                  hitSlop={4}
                >
                  {/* Left: text */}
                  <View style={styles.cardMeta}>
                    <AppText
                      variant="body"
                      weight="semibold"
                      style={[styles.cardLabel, isActive && styles.cardLabelActive]}
                    >
                      {style.label}
                    </AppText>
                    <AppText variant="footnote" muted style={styles.cardDesc}>
                      {style.description}
                    </AppText>
                  </View>

                  {/* Right: mini card preview */}
                  <View style={styles.previewWrap}>
                    <Preview />
                  </View>

                  {/* Active indicator dot */}
                  {isActive && <View style={styles.activeDot} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Pressable
            style={({ pressed }) => [
              styles.finishBtn,
              !selected && styles.finishBtnDisabled,
              pressed && selected && styles.finishBtnPressed,
            ]}
            onPress={handleFinish}
            disabled={!selected}
            hitSlop={8}
          >
            <AppText variant="body" weight="semibold" style={styles.finishBtnText}>
              Finish Setup
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default CardStyleScreen;

const previewStyles = StyleSheet.create({
  minimal: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    justifyContent: 'flex-end',
    padding: 10,
    gap: 6,
  },
  professional: {
    flex: 1,
    backgroundColor: '#111114',
    borderRadius: 8,
    justifyContent: 'flex-end',
    padding: 10,
    gap: 6,
    overflow: 'hidden',
  },
  professionalAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#2596BE',
    borderRadius: 1,
  },
  premium: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'flex-end',
    padding: 10,
    gap: 6,
    borderColor: 'rgba(37,150,190,0.2)',
    overflow: 'hidden',
  },
  premiumShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderRadius: 1,
  },
  creative: {
    flex: 1,
    backgroundColor: '#0D0D10',
    borderRadius: 8,
    justifyContent: 'flex-end',
    padding: 10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  creativeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37,150,190,0.15)',
    borderColor: 'rgba(37,150,190,0.3)',
    marginRight: 8,
  },
  creativeLines: {
    flex: 1,
    gap: 6,
  },
  minimalLine: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  minimalLineShort: {
    width: '60%',
    opacity: 0.6,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 20,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
    gap: 10,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: '#F5F5F7',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9A9AA0',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    minHeight: 120,
  },
  cardActive: {
    borderColor: '#2596BE',
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardMeta: {
    flex: 1,
    gap: 6,
  },
  cardLabel: {
    fontSize: 17,
    color: '#F5F5F7',
  },
  cardLabelActive: {
    color: '#2596BE',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9A9AA0',
  },
  previewWrap: {
    width: 100,
    height: 62,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2596BE',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerContent: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  finishBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnDisabled: {
    opacity: 0.3,
  },
  finishBtnPressed: {
    opacity: 0.85,
  },
  finishBtnText: {
    color: '#000000',
    fontSize: 16,
  },
});

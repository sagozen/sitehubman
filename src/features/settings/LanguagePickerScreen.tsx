import { IosScrollView } from '@/src/components/IosScrollView';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppSelect } from '@/src/components/AppSelect';
import { AppText } from '@/src/components/AppText';
import { languageOptions } from '@/src/constants/options';
import { iosDesign } from '@/src/design-system/ios';
import {
  SettingsMessageBanner,
  SettingsSurfaceCard,
  settingsChromeStyles,
  type SettingsThemeColors,
} from '@/src/features/settings/components/SettingsChrome';
import { useAppTheme } from '@/src/hooks/useAppTheme';

export function LanguagePickerScreen() {
  const { preferences, updatePreferences, isReady, colors } = useAppTheme();
  const ui = useMemo<SettingsThemeColors>(
    () => ({
      background: colors.background,
      surface: colors.surface,
      surfaceSoft: colors.surfaceSoft,
      border: colors.border,
      textPrimary: colors.textPrimary,
      textMuted: colors.textMuted,
      primary: colors.primary,
      primarySoft: colors.primarySoft,
      systemBlue: colors.systemBlue,
      danger: '#FF3B30',
    }),
    [colors]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showBack = router.canGoBack();

  async function handleLanguageChange(value: string) {
    if (!isReady || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updatePreferences({ language: value });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save language.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: ui.background }]} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={settingsChromeStyles.scroll} showsVerticalScrollIndicator={false}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <AppIcon name="ChevronLeft" size={22} color={ui.textPrimary} />
            <AppText style={[styles.backText, { color: ui.systemBlue }]}>Back</AppText>
          </Pressable>
        ) : null}

        <View style={styles.titleBlock}>
          <AppText style={[settingsChromeStyles.pageTitle, { color: ui.textPrimary }]}>Language</AppText>
          <AppText style={[settingsChromeStyles.pageSub, { color: ui.textMuted }]}>
            Choose your display language — saved automatically.
          </AppText>
        </View>

        {error ? (
          <SettingsMessageBanner colors={ui} tone="error">
            {error}
          </SettingsMessageBanner>
        ) : null}

        <SettingsSurfaceCard colors={ui}>
          <View style={styles.cardInner}>
            <AppSelect
              label="Language"
              value={preferences.language}
              options={languageOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              disabled={!isReady || saving}
              onChange={(value) => void handleLanguageChange(value)}
            />
          </View>
        </SettingsSurfaceCard>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
  },
  titleBlock: { gap: 2 },
  cardInner: {
    padding: iosDesign.spacing.md,
  },
});

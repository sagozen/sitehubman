import { IosScrollView } from '@/src/components/IosScrollView';
import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import { pageThemes } from '@/src/constants/pageThemes';
import { theme } from '@/src/constants/theme';

const ADMIN_THEME = pageThemes.admin;

interface AdminScreenShellProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  headerBottom?: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function AdminScreenShell({
  title,
  subtitle = 'Admin',
  showBack = true,
  rightAction,
  headerBottom,
  scroll = true,
  contentContainerStyle,
  children,
}: AdminScreenShellProps) {
  const header = (
    <View style={styles.header}>
      <PageHeader
        theme={ADMIN_THEME}
        eyebrow={subtitle}
        title={title}
        icon="ShieldCheck"
        showBack={showBack}
        right={rightAction}
        compact
      />
      {headerBottom}
    </View>
  );

  const body = scroll ? (
    <IosScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </IosScrollView>
  ) : (
    <View style={[styles.body, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {header}
      {body}
    </SafeAreaView>
  );
}

interface AdminHeaderActionProps {
  label: string;
  onPress: () => void;
  icon?: 'Plus' | 'User';
}

export function AdminHeaderAction({ label, onPress, icon = 'Plus' }: AdminHeaderActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
    >
      <AppIcon name={icon} size={18} color={ADMIN_THEME.accent} />
      <AppText variant="body" weight="semibold" style={{ color: ADMIN_THEME.accent }}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface AdminStatusPillProps {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}

const PILL_TONES = {
  success: { bg: 'rgba(0,0,0,0.08)', border: 'rgba(0,0,0,0.14)', text: '#000000' },
  warning: { bg: 'rgba(255,159,10,0.14)', border: 'rgba(255,159,10,0.28)', text: '#9A5D00' },
  danger: { bg: 'rgba(255,59,48,0.12)', border: 'rgba(255,59,48,0.28)', text: '#C41E14' },
  info: { bg: 'rgba(0,122,255,0.12)', border: 'rgba(0,122,255,0.24)', text: '#0056B3' },
  neutral: { bg: 'rgba(142,142,147,0.14)', border: 'rgba(142,142,147,0.24)', text: '#636366' },
} as const;

export function AdminStatusPill({ label, tone = 'neutral' }: AdminStatusPillProps) {
  const palette = PILL_TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" weight="semibold" style={{ color: palette.text, fontSize: 11 }}>
        {label}
      </AppText>
    </View>
  );
}

interface AdminStatChipProps {
  label: string;
  value: string;
  tone?: string;
}

export function AdminStatChip({ label, value, tone }: AdminStatChipProps) {
  const valueColor = tone ?? ADMIN_THEME.text;

  return (
    <View style={styles.statChip}>
      <AppText variant="caption" weight="medium" numberOfLines={1} style={{ color: ADMIN_THEME.muted }}>
        {label}
      </AppText>
      <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: valueColor }}>
        {value}
      </AppText>
    </View>
  );
}

export function AdminStatChipRow({ children }: PropsWithChildren) {
  return <View style={styles.statRow}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ADMIN_THEME.canvas },
  header: {
    backgroundColor: ADMIN_THEME.canvas,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.control,
  },
  backPlaceholder: { width: 36 },
  headerCopy: { flex: 1, gap: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    minHeight: 36,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  body: { flex: 1 },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: 8,
    backgroundColor: ADMIN_THEME.surface,
    borderWidth: 1,
    borderColor: ADMIN_THEME.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 4,
    minWidth: 120,
    ...theme.shadows.control,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});

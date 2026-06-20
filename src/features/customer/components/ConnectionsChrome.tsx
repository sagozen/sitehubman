import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  CONNECTIONS_TAB_SHORT_LABEL,
  type ConnectionsHubId,
} from '@/src/constants/connectionsFlowIcons';
import { printerUi } from '@/src/features/printer/components/PrinterScreenUi';

export type ConnectionsTheme = {
  background: string;
  surface: string;
  surfaceGlass: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  systemBlue: string;
  danger: string;
  success: string;
  isDark: boolean;
};

const TAB_ORDER: ConnectionsHubId[] = ['nfc', 'profiles', 'social', 'devices', 'analytics', 'security'];

/** Flat underline tabs — no pill box. */
export function ConnectionsFlatTabs({
  active,
  onChange,
}: {
  active: ConnectionsHubId;
  onChange: (id: ConnectionsHubId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.flatTabs}
    >
      {TAB_ORDER.map((id) => {
        const selected = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={styles.flatTab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <AppText style={[styles.flatTabText, selected && styles.flatTabTextActive]}>
              {CONNECTIONS_TAB_SHORT_LABEL[id]}
            </AppText>
            {selected ? <View style={styles.flatTabLine} /> : <View style={styles.flatTabSpacer} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** One grouped list — single hairline card like printer customer step. */
export function ConnectionsListGroup({ children }: { children: ReactNode }) {
  return <View style={styles.listGroup}>{children}</View>;
}

export function ConnectionsListRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  last,
  destructive,
}: {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
  const titleColor = destructive ? '#FF3B30' : printerUi.text;
  const body = (
    <>
      <AppIcon name={icon} size={17} color="#C4CFDE" />
      <View style={styles.rowCopy}>
        <AppText style={[styles.rowTitle, { color: titleColor }]} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.rowSub} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText style={[styles.rowValue, destructive && { color: '#FF3B30' }]} numberOfLines={1}>
          {value}
        </AppText>
      ) : onPress ? (
        <AppIcon name="ChevronRight" size={15} color="#94A3B8" />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, last && styles.rowLast]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
    >
      {body}
    </Pressable>
  );
}

export function ConnectionsToggleRow({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  last,
  disabled,
}: {
  icon: AppIconName;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast, disabled && styles.rowDisabled]}>
      <AppIcon name={icon} size={17} color="#C4CFDE" />
      <View style={styles.rowCopy}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        <AppText style={styles.rowSub} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#E2E8F0', true: printerUi.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flatTabs: {
    gap: 4,
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  flatTab: {
    paddingHorizontal: 10,
    paddingTop: 6,
    alignItems: 'center',
    minWidth: 56,
  },
  flatTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: printerUi.muted,
  },
  flatTabTextActive: {
    color: printerUi.text,
  },
  flatTabLine: {
    marginTop: 6,
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: printerUi.dark,
  },
  flatTabSpacer: {
    marginTop: 6,
    height: 2,
  },
  listGroup: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    opacity: 0.72,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: printerUi.text,
  },
  rowSub: {
    fontSize: 11,
    fontWeight: '600',
    color: printerUi.muted,
    lineHeight: 15,
  },
  rowValue: {
    maxWidth: 100,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'right',
  },
});

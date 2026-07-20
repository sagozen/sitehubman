import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CustomerFlowHub } from '@/src/components/CustomerFlowHub';
import { CustomerFlowIcon } from '@/src/components/CustomerFlowIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { CUSTOMER_FLOW_ORDER, CUSTOMER_FLOWS } from '@/src/constants/customerFlows';
import { theme } from '@/src/constants/theme';

export default function IconPreviewScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="h2" weight="semibold">
            Customer icon flows
          </AppText>
          <AppText variant="caption" tone="muted">
            Registry + storage + native icons
          </AppText>
        </View>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <CustomerFlowHub
          metrics={{ ecard: '1', preview: 'Live', track: '2', connections: '3' }}
          title="Live hub preview"
          subtitle="Same component on customer Home tab"
        />

        <View style={styles.registry}>
          <AppText variant="body" weight="semibold">
            All flow icons
          </AppText>
          {CUSTOMER_FLOW_ORDER.map((id) => {
            const flow = CUSTOMER_FLOWS[id];
            return (
              <View key={id} style={styles.registryRow}>
                <CustomerFlowIcon flowId={id} size={44} />
                <View style={styles.registryCopy}>
                  <AppText variant="body" weight="semibold">
                    {flow.label}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {flow.storageKey} · {String(flow.route)}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

        <AppText variant="caption" tone="muted">
          Platform: {Platform.OS} · Opens saved to AsyncStorage key sitehub_customer_flow_stats_v1
        </AppText>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  scroll: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: 120,
  },
  registry: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  registryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  registryCopy: {
    flex: 1,
    gap: 2,
  },
});

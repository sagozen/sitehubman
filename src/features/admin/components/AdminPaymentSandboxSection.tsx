import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsRow, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  buildSandboxWebhookUrl,
  generatePaymentSandboxSecret,
  loadPaymentSecrets,
  maskSecret,
  type PaymentSecretsRecord,
} from '@/src/services/opsPaymentSecretsService';
import { getFirebaseConfig, isFirebaseConfigured } from '@/src/services/firebase/firebaseConfig';

type Props = {
  colors: {
    primary: string;
    surfaceSoft: string;
    textMuted: string;
    typographyColor: string;
    border: string;
  };
};

export function AdminPaymentSandboxSection({ colors }: Props) {
  const { isSuperAdmin } = useRoleFlags();
  const [secrets, setSecrets] = useState<PaymentSecretsRecord | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const webhookUrl = isFirebaseConfigured()
    ? buildSandboxWebhookUrl(getFirebaseConfig().projectId)
    : 'Deploy functions to see URL';

  const load = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      setSecrets(await loadPaymentSecrets());
    } catch {
      setSecrets(null);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isSuperAdmin) return null;

  async function handleGenerate() {
    Alert.alert(
      secrets?.sandboxSecret ? 'Rotate sandbox secret?' : 'Generate sandbox secret?',
      'This creates a new random secret for paymentWebhookSandbox. Update any local scripts after rotation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: secrets?.sandboxSecret ? 'Rotate' : 'Generate',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const next = await generatePaymentSandboxSecret();
              setSecrets(next);
              setRevealed(true);
              Alert.alert(
                'Sandbox secret ready',
                `${next.sandboxSecret}\n\nStored server-side. This is the only time the UI will show the full secret.`
              );
            } catch (error) {
              Alert.alert('Failed', getAuthErrorMessage(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  const secretLabel = loading
    ? 'Loading…'
    : secrets?.sandboxSecret
      ? revealed
        ? secrets.sandboxSecret
        : maskSecret(secrets.sandboxSecret)
      : 'Not set — tap Generate';

  return (
    <>
      <SettingsSection
        title="Payment sandbox"
        footer="Super admin only. Secret validates paymentWebhookSandbox and is not readable from client Firestore."
        compact
      />
      <SettingsGroup compact style={styles.group}>
        <View style={styles.block}>
          <AppText variant="caption" tone="muted" weight="medium">
            Webhook URL
          </AppText>
          <AppText variant="caption" style={styles.mono} selectable>
            {webhookUrl}
          </AppText>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.block}>
          <AppText variant="caption" tone="muted" weight="medium">
            Sandbox secret
          </AppText>
          <Pressable onPress={() => setRevealed((value) => !value)} disabled={!secrets?.sandboxSecret}>
            <AppText variant="body" weight="semibold" style={styles.mono} selectable={revealed}>
              {secretLabel}
            </AppText>
          </Pressable>
          {secrets?.sandboxSecretRotatedAt ? (
            <AppText variant="caption" tone="muted">
              Rotated {new Date(secrets.sandboxSecretRotatedAt).toLocaleString()}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <SettingsRow
          compact
          title={busy ? 'Working…' : secrets?.sandboxSecret ? 'Rotate secret' : 'Generate secret'}
          showChevron={false}
          onPress={busy ? undefined : () => void handleGenerate()}
          isLast
        />
      </SettingsGroup>
      <Pressable
        style={[styles.primaryBtn, { backgroundColor: colors.primary }, busy && styles.disabled]}
        onPress={() => void handleGenerate()}
        disabled={busy}
      >
        <AppText variant="body" weight="bold" style={styles.primaryBtnText}>
          {busy ? 'Please wait…' : secrets?.sandboxSecret ? 'Rotate sandbox secret' : 'Auto-generate sandbox secret'}
        </AppText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: 0 },
  block: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    gap: 6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.spacing.md,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryBtn: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF' },
  disabled: { opacity: 0.5 },
});

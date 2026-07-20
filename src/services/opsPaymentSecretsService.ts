import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/src/services/firebaseClient';

export type PaymentSecretsRecord = {
  sandboxSecret?: string;
  sandboxSecretRotatedAt?: string;
  rotatedBy?: string;
};

export function buildSandboxWebhookUrl(projectId: string, region = 'us-central1') {
  return `https://${region}-${projectId}.cloudfunctions.net/paymentWebhookSandbox`;
}

export async function loadPaymentSecrets(): Promise<PaymentSecretsRecord | null> {
  return null;
}

export async function generatePaymentSandboxSecret(): Promise<PaymentSecretsRecord> {
  const callable = httpsCallable<undefined, { sandboxSecret: string; rotatedAt: string }>(
    getFunctions(firebaseApp),
    'generatePaymentSandboxSecret'
  );
  const result = await callable();
  return {
    sandboxSecret: result.data.sandboxSecret,
    sandboxSecretRotatedAt: result.data.rotatedAt,
  };
}

export function maskSecret(secret: string) {
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

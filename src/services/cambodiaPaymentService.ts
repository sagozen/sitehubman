import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import type { OrderCurrency } from '@/src/constants/cardProducts';

export type ConfirmPaymentInput = {
  methodId: CambodiaPaymentMethodId;
  amount: number;
  currency: OrderCurrency;
  orderId?: string;
};

export type ConfirmPaymentResult = {
  /** Payment intent recorded — not verified until staff/webhook confirms. */
  success: boolean;
  verified: boolean;
  /** Pending reference — replace with gateway transaction id when integrated. */
  reference: string;
  submittedAt: string;
};

/**
 * @deprecated Use paymentService.initiatePayment after order exists.
 * COD skips gateway — order stays unpaid until delivery collection.
 */
export async function confirmCambodiaPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
  if (input.methodId === 'cash_on_delivery') {
    return {
      success: true,
      verified: false,
      reference: `COD-${Date.now().toString(36)}`,
      submittedAt: new Date().toISOString(),
    };
  }
  const ref = `GATEWAY-${input.methodId.toUpperCase()}-${Date.now().toString(36)}`;
  return {
    success: true,
    verified: false,
    reference: ref,
    submittedAt: new Date().toISOString(),
  };
}

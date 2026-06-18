import { OrderStatus } from '@/src/types/models';

/** Primary linear progression. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'draft',
  'pending_payment',
  'payment_submitted',
  'payment_verified',
  'production_approved',
  'printer_assigned',
  'printing',
  'nfc_writing',
  'nfc_verification',
  'qa_pending',
  'ready_to_ship',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['payment_submitted', 'cancelled'],
  payment_submitted: ['payment_verified', 'payment_rejected', 'cancelled'],
  payment_verified: ['production_approved', 'cancelled'],
  production_approved: ['printer_assigned', 'cancelled'],
  printer_assigned: ['printing', 'cancelled'],
  printing: ['nfc_writing', 'cancelled'],
  nfc_writing: ['nfc_verification', 'cancelled'],
  nfc_verification: ['qa_pending', 'cancelled'],
  qa_pending: ['ready_to_ship', 'qa_failed', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  payment_rejected: ['payment_submitted', 'cancelled'],
  qa_failed: ['printing', 'cancelled'],
  cancelled: [],
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  const allowed = ORDER_STATUS_TRANSITIONS[current];
  return allowed?.includes(next) ?? false;
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index >= 0 && index < ORDER_STATUS_FLOW.length - 1) {
    return ORDER_STATUS_FLOW[index + 1];
  }
  if (status === 'qa_failed') return 'printing';
  if (status === 'payment_rejected') return 'payment_submitted';
  return null;
}

/** Job stages operators may advance without QA approval. */
export const OPERATOR_JOB_TERMINAL_STAGE = 'quality_check' as const;

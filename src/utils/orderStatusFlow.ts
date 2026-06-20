import { OrderStatus } from '@/src/types/models';

/**
 * Simplified 8-step linear flow:
 * Customer/Sales creates order
 *   → Sales approves (one tap — combines payment confirm + production approve)
 *   → Printer receives job
 *   → Printing
 *   → NFC Write
 *   → QA
 *   → Ready to Ship
 *   → Shipped → Delivered
 *
 * Removed intermediate hops: payment_submitted, payment_verified, nfc_verification
 * They still exist as valid statuses for data compatibility but are no longer
 * required stops in the normal flow.
 */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending_payment',
  'production_approved',
  'printer_assigned',
  'printing',
  'nfc_writing',
  'qa_pending',
  'ready_to_ship',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // ── Active flow ──────────────────────────────────────────────────────────
  draft:               ['pending_payment', 'production_approved', 'cancelled'],
  pending_payment:     ['production_approved', 'cancelled'],
  // Legacy intermediate statuses — still accepted so old data isn't broken
  payment_submitted:   ['production_approved', 'payment_verified', 'payment_rejected', 'cancelled'],
  payment_verified:    ['production_approved', 'cancelled'],
  // ── Main production flow ─────────────────────────────────────────────────
  production_approved: ['printer_assigned', 'cancelled'],
  printer_assigned:    ['printing', 'cancelled'],
  printing:            ['nfc_writing', 'cancelled'],
  // nfc_verification is now skipped — nfc_writing goes straight to qa_pending
  nfc_writing:         ['qa_pending', 'nfc_verification', 'cancelled'],
  nfc_verification:    ['qa_pending', 'cancelled'],
  qa_pending:          ['ready_to_ship', 'qa_failed', 'cancelled'],
  ready_to_ship:       ['shipped', 'cancelled'],
  shipped:             ['delivered', 'cancelled'],
  delivered:           [],
  // ── Failure states ───────────────────────────────────────────────────────
  payment_rejected:    ['pending_payment', 'production_approved', 'cancelled'],
  qa_failed:           ['printing', 'cancelled'],
  cancelled:           [],
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
  // Fallbacks for legacy / failure states
  if (status === 'qa_failed')        return 'printing';
  if (status === 'payment_rejected') return 'pending_payment';
  if (status === 'payment_submitted') return 'production_approved';
  if (status === 'payment_verified')  return 'production_approved';
  if (status === 'nfc_verification')  return 'qa_pending';
  if (status === 'draft')             return 'pending_payment';
  return null;
}

/** Job stages operators may advance without QA approval. */
export const OPERATOR_JOB_TERMINAL_STAGE = 'quality_check' as const;

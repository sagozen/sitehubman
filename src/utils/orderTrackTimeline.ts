/**
 * Simplified 8-step order timeline shown to customers and sales.
 *
 * Step 1  Order Placed         (pending_payment)
 * Step 2  Sales Approved       (production_approved)
 * Step 3  Printer Queue        (printer_assigned)
 * Step 4  Printing             (printing)
 * Step 5  NFC Write            (nfc_writing)
 * Step 6  QA Check             (qa_pending)
 * Step 7  Ready to Ship        (ready_to_ship)
 * Step 8  Shipped → Delivered  (shipped / delivered)
 *
 * Legacy intermediate statuses (payment_submitted, payment_verified,
 * nfc_verification) are silently mapped to the nearest simplified step
 * so old orders continue to render correctly.
 */
import type { Order, OrderStatus } from '@/src/types/models';

// ─── Simplified display flow ─────────────────────────────────────────────────

const DISPLAY_FLOW: OrderStatus[] = [
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

const STEP_LABELS: Record<string, string> = {
  pending_payment:     '1. Order Placed',
  production_approved: '2. Sales Approved',
  printer_assigned:    '3. Printer Queue',
  printing:            '4. Printing',
  nfc_writing:         '5. NFC Write',
  qa_pending:          '6. QA Check',
  ready_to_ship:       '7. Ready to Ship',
  shipped:             '8. Shipped',
  delivered:           '8. Delivered',
};

/**
 * Map legacy / failure statuses to the nearest display step index
 * so old orders render on the correct position in the timeline.
 */
function resolveDisplayStatus(status: OrderStatus): OrderStatus {
  switch (status) {
    case 'draft':              return 'pending_payment';
    case 'payment_submitted':  return 'pending_payment';
    case 'payment_rejected':   return 'pending_payment';
    case 'payment_verified':   return 'production_approved';
    case 'nfc_verification':   return 'nfc_writing';
    case 'qa_failed':          return 'printing';
    case 'cancelled':          return 'pending_payment';
    default:                   return status;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderTimelineItem = {
  step: string;
  at: string;
  done: boolean;
  active?: boolean;
  failed?: boolean;
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildOrderTimeline(order: Order): OrderTimelineItem[] {
  const isCancelled = order.status === 'cancelled';
  const isFailed    = order.status === 'qa_failed' || order.status === 'payment_rejected';

  const displayStatus = resolveDisplayStatus(order.status);
  const currentIndex  = DISPLAY_FLOW.indexOf(displayStatus);

  const placed = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return DISPLAY_FLOW.map((status, index) => {
    const done   = !isCancelled && currentIndex >= 0 && index <= currentIndex;
    const active = !isCancelled && currentIndex >= 0 && index === currentIndex;
    const failed = active && isFailed;

    let label = STEP_LABELS[status] ?? status;

    // Override label on active failed/cancelled steps for clarity
    if (active && order.status === 'qa_failed' && status === 'printing') {
      label = '4. QA Failed — Reprinting';
    }
    if (active && order.status === 'payment_rejected' && status === 'pending_payment') {
      label = '1. Payment Rejected — Resubmit';
    }
    if (isCancelled && index === 0) {
      label = 'Order Cancelled';
    }

    let atLabel: string;
    if (index === 0) {
      atLabel = placed;
    } else if (active && isFailed) {
      atLabel = 'Action needed';
    } else if (active) {
      atLabel = 'In progress';
    } else if (done) {
      atLabel = 'Complete';
    } else {
      atLabel = 'Pending';
    }

    return { step: label, at: atLabel, done, active, failed };
  });
}

// ─── Human-readable label for any status ─────────────────────────────────────

const ALL_STATUS_LABELS: Record<OrderStatus, string> = {
  draft:               'Draft',
  pending_payment:     'Awaiting Approval',
  payment_submitted:   'Awaiting Approval',
  payment_verified:    'Sales Approved',
  production_approved: 'Sales Approved',
  printer_assigned:    'Printer Queue',
  printing:            'Printing',
  nfc_writing:         'NFC Write',
  nfc_verification:    'NFC Write',
  qa_pending:          'QA Check',
  ready_to_ship:       'Ready to Ship',
  shipped:             'Shipped',
  delivered:           'Delivered',
  payment_rejected:    'Payment Rejected',
  qa_failed:           'QA Failed',
  cancelled:           'Cancelled',
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return ALL_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

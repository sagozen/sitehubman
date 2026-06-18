import { ORDER_STATUS_FLOW } from '@/src/utils/orderStatusFlow';
import type { Order, OrderStatus } from '@/src/types/models';

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft created',
  pending_payment: 'Pending payment',
  payment_submitted: 'Payment submitted',
  payment_verified: 'Payment verified',
  production_approved: 'Production approved',
  printer_assigned: 'Printer assigned',
  printing: 'In production',
  nfc_writing: 'NFC encoding',
  nfc_verification: 'NFC verification',
  qa_pending: 'QA inspection',
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  payment_rejected: 'Payment rejected',
  qa_failed: 'QA failed — reprinting',
  cancelled: 'Order cancelled',
};

export type OrderTimelineItem = {
  step: string;
  at: string;
  done: boolean;
  active?: boolean;
};

export function buildOrderTimeline(order: Order): OrderTimelineItem[] {
  const flow = ORDER_STATUS_FLOW;
  let status = order.status;
  if (status === 'qa_failed') status = 'printing';
  if (status === 'payment_rejected') status = 'pending_payment';

  const statusIndex = flow.indexOf(status);
  const placed = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return flow.map((s, index) => {
    const done = statusIndex >= 0 ? index <= statusIndex : false;
    const active = statusIndex >= 0 && index === statusIndex;
    let label = STATUS_LABELS[s] ?? s;
    if (active && order.status === 'qa_failed' && s === 'printing') {
      label = 'QA failed — reprinting';
    }
    if (active && order.status === 'payment_rejected' && s === 'pending_payment') {
      label = 'Payment rejected — please resubmit';
    }
    if (active && order.status === 'cancelled') {
      label = 'Order cancelled';
    }
    return {
      step: label,
      at: index === 0 ? placed : active ? 'In progress' : done ? 'Complete' : 'Pending',
      done,
      active,
    };
  });
}

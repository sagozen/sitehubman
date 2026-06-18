import type { Order, OrderStatus, PaymentStatus, PrinterJob } from '@/src/types/models';

export type StatusBadgeTone = 'success' | 'active' | 'warning' | 'error' | 'neutral' | 'pending';

export function orderStatusBadgeTone(status: OrderStatus): StatusBadgeTone {
  if (status === 'delivered' || status === 'ready_to_ship' || status === 'shipped') {
    return 'success';
  }
  if (status === 'qa_failed' || status === 'payment_rejected' || status === 'cancelled') {
    return 'error';
  }
  if (status === 'qa_pending') return 'pending';
  if (status === 'printing' || status === 'nfc_writing' || status === 'nfc_verification') return 'active';
  if (
    status === 'draft' ||
    status === 'pending_payment' ||
    status === 'payment_submitted' ||
    status === 'payment_verified' ||
    status === 'production_approved' ||
    status === 'printer_assigned'
  ) {
    return 'warning';
  }
  return 'neutral';
}

export function paymentStatusBadgeTone(status: PaymentStatus): StatusBadgeTone {
  if (status === 'paid' || status === 'paid_verified') return 'success';
  if (status === 'under_review') return 'pending';
  if (status === 'partial' || status === 'pending_payment' || status === 'unpaid') return 'warning';
  return 'neutral';
}

export function nfcProfileBadgeTone(order: Order): StatusBadgeTone {
  if (order.nfcEnabled === false) return 'neutral';
  return 'neutral';
}

export function printerJobStageBadgeTone(stage: PrinterJob['stage']): StatusBadgeTone {
  if (stage === 'completed' || stage === 'ready_to_ship') return 'success';
  if (stage === 'failed' || stage === 'reprint') return 'error';
  if (stage === 'quality_check') return 'pending';
  if (stage === 'received') return 'warning';
  if (stage === 'printing' || stage === 'nfc_encoding') return 'active';
  return 'neutral';
}

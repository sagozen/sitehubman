/**
 * printerScanService — simplified matching logic.
 *
 * Batch is now OPTIONAL. Matching priority:
 * 1. If scan is an Order QR (orderNumber + passcode) → match directly by order number.
 * 2. If scan is a raw UID → look up by card code on any production_approved order.
 * 3. If no existing match → link UID to the next available received job (batch-scoped if a batch is active, global otherwise).
 *
 * This removes the hard "must be in active batch" gate that caused
 * "outside your workshop branch" errors when batching wasn't set up.
 */
import {
  assignCardCodeToOrder,
  getOrder,
  getOrderByCardCode,
  getOrderByOrderNumber,
  getPrinterJobByOrderId,
} from '@/src/services/firestoreService';
import { Order, PrinterJob } from '@/src/types/models';
import { parseProductionScan } from '@/src/utils/orderProduction';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractScanUid(raw: string): string {
  const value = raw.trim();
  const urlMatch = value.match(/\/c\/([^/?#]+)/i);
  const candidate = urlMatch?.[1] ?? value;
  return candidate.replace(/^URL:/i, '').replace(/:/g, '').trim().toUpperCase();
}

export type ScanMatchResult = {
  order: Order;
  job: PrinterJob;
  linkedToQueue: boolean;
};

/**
 * Pick next available job.
 * If activeBatchId is provided, prefer jobs in that batch.
 * Falls back to any received/reprint job when no batch is active.
 */
function pickNextJob(jobs: PrinterJob[], activeBatchId?: string | null): PrinterJob | null {
  const workStages: PrinterJob['stage'][] = ['received', 'printing', 'nfc_encoding', 'reprint'];

  // Prefer batch-scoped jobs when a batch is active
  if (activeBatchId?.trim()) {
    const batchCandidates = jobs.filter(
      (j) => j.batchId === activeBatchId && workStages.includes(j.stage)
    );
    const sorted = [...batchCandidates].sort((a, b) => a.queueNumber - b.queueNumber);
    if (sorted[0]) return sorted[0];
  }

  // Fall back to any available job (batch-optional mode)
  const allCandidates = jobs.filter((j) => workStages.includes(j.stage));
  return [...allCandidates].sort((a, b) => a.queueNumber - b.queueNumber)[0] ?? null;
}

// ─── Error formatter ──────────────────────────────────────────────────────────

export function formatScanMatchError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Try again.';
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('access')) {
    return 'Permission denied — make sure you are signed in as a printer operator.';
  }
  if (message.toLowerCase().includes('branch')) {
    return message;
  }
  return message;
}

// ─── Main matcher ─────────────────────────────────────────────────────────────

/**
 * READ → MATCH: resolve a scan to an order + printer job.
 * activeBatchId is optional — when absent, matches globally against
 * production_approved orders.
 */
export async function matchScanToPrinterJob(
  rawUid: string,
  allJobs: PrinterJob[],
  operatorId: string,
  activeBatchId?: string | null
): Promise<ScanMatchResult | null> {
  const parsed = parseProductionScan(rawUid);

  // ── Case 1: Production QR (orderNumber + optional passcode) ──────────────
  if (parsed.orderNumber) {
    const order = await getOrderByOrderNumber(parsed.orderNumber);
    if (!order) return null;

    if (parsed.passcode && order.productionPasscode && parsed.passcode !== order.productionPasscode) {
      throw new Error('Invalid production passcode for this order.');
    }

    const job = await getPrinterJobByOrderId(order.id);
    if (!job) return null;

    // Accept job regardless of batch — batch check is advisory, not blocking
    return { order, job, linkedToQueue: false };
  }

  // ── Case 2: Raw UID / card code ───────────────────────────────────────────
  const uid = extractScanUid(parsed.cardCode ?? rawUid);
  if (!uid) return null;

  // Check if UID is already on an order
  const existingOrder = await getOrderByCardCode(uid);
  if (existingOrder) {
    const job = await getPrinterJobByOrderId(existingOrder.id);
    if (!job) return null;
    return { order: existingOrder, job, linkedToQueue: false };
  }

  // ── Case 3: Link UID to next available job ────────────────────────────────
  const nextJob = pickNextJob(allJobs, activeBatchId);
  if (!nextJob) return null;

  const order = await getOrder(nextJob.orderId);
  if (!order) return null;

  // Link the physical UID to this order
  const linkedOrder =
    order.cardCode.toUpperCase() === uid
      ? order
      : await assignCardCodeToOrder(order.id, uid, operatorId);

  return { order: linkedOrder, job: nextJob, linkedToQueue: true };
}

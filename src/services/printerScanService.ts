import {
  assignCardCodeToOrder,
  getOrder,
  getOrderByCardCode,
  getOrderByOrderNumber,
  getPrinterJobByOrderId,
} from '@/src/services/firestoreService';
import { Order, PrinterJob } from '@/src/types/models';
import { parseProductionScan } from '@/src/utils/orderProduction';

export function extractScanUid(raw: string) {
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

function pickNextBatchJob(jobs: PrinterJob[]) {
  const candidates = jobs.filter(
    (job) =>
      job.batchId &&
      (job.stage === 'received' ||
        job.stage === 'printing' ||
        job.stage === 'nfc_encoding' ||
        job.stage === 'reprint')
  );
  return [...candidates].sort((a, b) => a.queueNumber - b.queueNumber)[0] ?? null;
}

/**
 * READ → MATCH: resolve UID to an order + printer job within the active batch only.
 * 1) If UID already on an order in this batch, use that job.
 * 2) Else link UID to the next received job in the batch (no global FIFO).
 */
export function formatScanMatchError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Try again.';
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('access')) {
    return 'Permission denied — sign in as a printer for this workshop, select an active batch, and use orders in that batch.';
  }
  if (message.toLowerCase().includes('workshop branch')) {
    return message;
  }
  return message;
}

export async function matchScanToPrinterJob(
  rawUid: string,
  batchJobs: PrinterJob[],
  operatorId: string,
  activeBatchId: string
): Promise<ScanMatchResult | null> {
  const parsed = parseProductionScan(rawUid);
  if (parsed.orderNumber) {
    const order = await getOrderByOrderNumber(parsed.orderNumber);
    if (!order) return null;
    if (parsed.passcode && order.productionPasscode && parsed.passcode !== order.productionPasscode) {
      throw new Error('Invalid production passcode for this order.');
    }
    const job = await getPrinterJobByOrderId(order.id);
    if (!job || job.batchId !== activeBatchId) return null;
    return { order, job, linkedToQueue: false };
  }

  const uid = extractScanUid(parsed.cardCode ?? rawUid);
  if (!uid || !activeBatchId?.trim()) return null;

  const batchScoped = batchJobs.filter((j) => j.batchId === activeBatchId);

  const existingOrder = await getOrderByCardCode(uid);
  if (existingOrder) {
    const job = await getPrinterJobByOrderId(existingOrder.id);
    if (!job || job.batchId !== activeBatchId) return null;
    return { order: existingOrder, job, linkedToQueue: false };
  }

  const nextJob = pickNextBatchJob(batchScoped);
  if (!nextJob) return null;

  const order = await getOrder(nextJob.orderId);
  if (!order || order.batchId !== activeBatchId) return null;

  const linkedOrder =
    order.cardCode.toUpperCase() === uid
      ? order
      : await assignCardCodeToOrder(order.id, uid, operatorId);

  return { order: linkedOrder, job: nextJob, linkedToQueue: true };
}

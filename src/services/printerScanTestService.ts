import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { buildCardProfileUrl } from '@/src/constants/publicProfile';
import { auth, db } from '@/src/services/firebaseClient';
import { setActiveBatchId } from '@/src/services/activeBatchService';
import { getDefaultSalesUid } from '@/src/services/defaultSalesService';
import {
  getOrder,
  getPrinterJobByOrderId,
  mapOrder,
  mapPrinterJob,
} from '@/src/services/firestoreService';
import type { Order, OrderStatus, PrinterJob, PrinterJobStage } from '@/src/types/models';

/** Off in production unless EXPO_PUBLIC_ENABLE_SCAN_TEST=true */
export function isPrinterScanTestEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_ENABLE_SCAN_TEST === 'true') return true;
  return __DEV__;
}

export const PRINTER_SCAN_TEST_CARD_CODE = 'CUS-TEST001';
export const PRINTER_SCAN_TEST_BATCH_NUMBER = 'BATCH-TEST001';
export const PRINTER_SCAN_TEST_CUSTOMER = 'Test Customer';

const TEST_BATCH_DOC_ID = 'scan_test_batch_001';
const TEST_ORDER_DOC_ID = 'scan_test_order_001';
const TEST_MARKER = 'printer_scan_test_v1';

function actorId(fallback?: string) {
  return auth.currentUser?.uid || fallback || '';
}

export function isPrinterScanTestCardCode(code: string) {
  return code.trim().toUpperCase() === PRINTER_SCAN_TEST_CARD_CODE;
}

export function displayTestOrderStatus(status: OrderStatus): string {
  if (status === 'printer_assigned') return 'Pending';
  if (status === 'printing') return 'Printed';
  return status.replace(/_/g, ' ');
}

export function displayTestJobStage(stage: PrinterJobStage): string {
  if (stage === 'received') return 'ReadyToPrint';
  if (stage === 'printing') return 'Printed';
  return stage.replace(/_/g, ' ');
}

export async function getPrinterScanTestJob(): Promise<{
  order: Order;
  job: PrinterJob;
  batchId: string;
} | null> {
  const orderRef = doc(db, firebaseCollections.orders, TEST_ORDER_DOC_ID);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return null;

  const order = mapOrder(orderSnap.id, orderSnap.data() as Record<string, unknown>);
  const job = await getPrinterJobByOrderId(order.id);
  if (!job) return null;

  return {
    order,
    job,
    batchId: order.batchId ?? TEST_BATCH_DOC_ID,
  };
}

export async function createPrinterScanTestJob(
  operatorId: string,
  branch?: string
): Promise<{ batchId: string; orderId: string; jobId: string }> {
  const userId = actorId(operatorId);
  if (!userId) throw new Error('Sign in as a printer to create a test job.');

  const salesUid = await getDefaultSalesUid();
  const workshopBranch = branch?.trim() || 'Workshop Test';
  const profileUrl = buildCardProfileUrl(PRINTER_SCAN_TEST_CARD_CODE);
  const now = serverTimestamp();

  await setDoc(
    doc(db, firebaseCollections.productionBatches, TEST_BATCH_DOC_ID),
    {
      batchNumber: PRINTER_SCAN_TEST_BATCH_NUMBER,
      material: 'pvc_card',
      printerType: 'thermal',
      status: 'active',
      orderIds: [TEST_ORDER_DOC_ID],
      branch: workshopBranch,
      activeOperatorId: userId,
      notes: 'Scan page test mode — no hardware required',
      isScanTest: TEST_MARKER,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  await setActiveBatchId(TEST_BATCH_DOC_ID);

  await setDoc(
    doc(db, firebaseCollections.orders, TEST_ORDER_DOC_ID),
    {
      orderNumber: 'ORD-TEST001',
      customerName: PRINTER_SCAN_TEST_CUSTOMER,
      phone: '+855000000001',
      email: 'test@scan.local',
      productType: 'pvc_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: PRINTER_SCAN_TEST_CARD_CODE,
      profileUrl,
      nfcEnabled: true,
      nfcTargetUrl: profileUrl,
      fulfillment: 'physical',
      paymentStatus: 'paid',
      paymentMethod: 'test',
      status: 'printer_assigned' satisfies OrderStatus,
      batchId: TEST_BATCH_DOC_ID,
      branch: workshopBranch,
      salesApprovedAt: new Date().toISOString(),
      salesApprovedBy: salesUid,
      productionPasscode: '000000',
      assignedSalesman: salesUid,
      createdBy: userId,
      updatedBy: userId,
      isScanTest: TEST_MARKER,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  const existingJob = await getPrinterJobByOrderId(TEST_ORDER_DOC_ID);
  let jobId = existingJob?.id;

  if (existingJob) {
    await updateDoc(doc(db, firebaseCollections.printerJobs, existingJob.id), {
      batchId: TEST_BATCH_DOC_ID,
      branch: workshopBranch,
      printerId: '',
      stage: 'received',
      cardsPrinted: 0,
      isScanTest: TEST_MARKER,
      updatedBy: userId,
      updatedAt: now,
    });
    jobId = existingJob.id;
  } else {
    const jobRef = doc(collection(db, firebaseCollections.printerJobs));
    jobId = jobRef.id;
    await setDoc(jobRef, {
      orderId: TEST_ORDER_DOC_ID,
      batchId: TEST_BATCH_DOC_ID,
      branch: workshopBranch,
      printerId: '',
      queueNumber: Date.now(),
      stage: 'received',
      cardsPrinted: 0,
      failedCards: 0,
      reprintedCards: 0,
      failedCardsApproved: false,
      perCardBonus: 0.5,
      perOrderBonus: 0,
      salaryStatus: 'unpaid',
      isScanTest: TEST_MARKER,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (!jobId) throw new Error('Test job could not be created.');

  return { batchId: TEST_BATCH_DOC_ID, orderId: TEST_ORDER_DOC_ID, jobId };
}

export async function markPrinterScanTestPrinted(jobId: string, operatorId?: string): Promise<void> {
  const userId = actorId(operatorId);
  const jobRef = doc(db, firebaseCollections.printerJobs, jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error('Test job not found.');

  const job = mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>);
  if (job.stage !== 'received') {
    throw new Error('Test job is not in ReadyToPrint state.');
  }

  await updateDoc(jobRef, {
    stage: 'printing',
    printerId: userId,
    cardsPrinted: 1,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  if (job.orderId) {
    await updateDoc(doc(db, firebaseCollections.orders, job.orderId), {
      status: 'printing',
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function resetPrinterScanTestJob(jobId: string, operatorId?: string): Promise<void> {
  const userId = actorId(operatorId);
  const jobRef = doc(db, firebaseCollections.printerJobs, jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error('Test job not found.');

  const job = mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>);

  await updateDoc(jobRef, {
    stage: 'received',
    printerId: '',
    cardsPrinted: 0,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  if (job.orderId) {
    await updateDoc(doc(db, firebaseCollections.orders, job.orderId), {
      status: 'printer_assigned',
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
  }
}

/** Resolve test job by UID scan within active batch. */
export async function findPrinterScanTestByUid(
  rawUid: string,
  activeBatchId: string | null | undefined
): Promise<{ order: Order; job: PrinterJob } | null> {
  if (!isPrinterScanTestCardCode(rawUid)) return null;
  if (activeBatchId !== TEST_BATCH_DOC_ID) return null;

  const bundle = await getPrinterScanTestJob();
  if (!bundle) return null;
  if (bundle.order.cardCode.toUpperCase() !== PRINTER_SCAN_TEST_CARD_CODE) return null;

  return { order: bundle.order, job: bundle.job };
}

export async function loadPrinterScanTestDetail(jobId: string) {
  const jobSnap = await getDoc(doc(db, firebaseCollections.printerJobs, jobId));
  if (!jobSnap.exists()) return null;
  const job = mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>);
  const order = job.orderId ? await getOrder(job.orderId) : null;
  if (!order) return null;
  return { order, job };
}

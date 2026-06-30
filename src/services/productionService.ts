import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { accrueSalesCommissionOnDelivery } from '@/src/services/commissionService';
import { createStaffNotification } from '@/src/services/notificationService';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import { auth, db } from '@/src/services/firebaseClient';
import {
  getOrder,
  getPrinterJobByOrderId,
  mapOrder,
  mapPrinterJob,
  updateOrderStatus,
} from '@/src/services/firestoreService';
import {
  AuditLogEntry,
  Order,
  OrderStatus,
  PrinterHealthRecord,
  PrinterJob,
  PrinterJobStage,
  ProductionBatch,
  ProductionBatchStatus,
  ProductionStatsSnapshot,
  QaDecision,
  ReprintRecord,
  UserRole,
} from '@/src/types/models';
import { canTransitionOrderStatus } from '@/src/utils/orderStatusFlow';
import {
  generateOrderNumber,
  generateProductionPasscode,
  isPhysicalFulfillment,
  parseProductionScan,
} from '@/src/utils/orderProduction';
import {
  assertCardReadyForPrint,
  ensureCardIdentity,
  getCardIdentity,
  lockCardForProduction,
  recordProductionLog,
  updateCardProductionStatus,
} from '@/src/services/cardIdentityService';

function actorId(fallback?: string) {
  return auth.currentUser?.uid || fallback || '';
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return (value as any).toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function withoutUndefined<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function assertNonEmpty(value: string | undefined, message: string) {
  if (!value?.trim()) throw new Error(message);
}

const BATCH_COMPLETE_JOB_STAGES = new Set<PrinterJobStage>(['ready_to_ship', 'completed', 'failed']);
const BATCH_CANCELABLE_JOB_STAGES = new Set<PrinterJobStage>(['received']);
const PRODUCTION_DASHBOARD_LIMIT = 500;

async function getActorRole(userId: string): Promise<UserRole | undefined> {
  if (!userId) return undefined;
  const snap = await getDoc(doc(db, firebaseCollections.users, userId));
  return snap.exists() ? (snap.data().role as UserRole | undefined) : undefined;
}

function canApproveProduction(role: UserRole | undefined): boolean {
  return role === 'sales' || role === 'agent' || role === 'admin' || role === 'super_admin';
}

async function ensureManualOrderCardIdentity(order: Order, actorUserId: string): Promise<void> {
  const cardId = order.cardId?.trim();
  if (!cardId) return;
  const existing = await getCardIdentity(cardId);
  if (existing) return;

  // Owner precedence: explicit ownerId (canonical) -> createdBy (sales rep / staff)
  // -> manual fallback to actor. We no longer read order.userId / order.guestId
  // because the Order type doesn't declare them — reading them would always yield
  // undefined and the CardIdentity would be written with userId=null even when
  // the real customer does own the card.
  const ownerId = order.ownerId?.trim() || order.createdBy?.trim() || actorUserId;
  const ownerType = (order.ownerType === 'guest' || order.ownerType === 'customer' || order.ownerType === 'staff' || order.ownerType === 'manual')
    ? order.ownerType
    : 'customer';

  // Mirror ownerId into userId so legacy lookup helpers that key on userId keep
  // working. New code should prefer ownerId + ownerType.
  await ensureCardIdentity({
    cardId,
    ownerId,
    ownerType,
    userId: ownerType === 'customer' || ownerType === 'staff' ? ownerId : null,
    guestId: ownerType === 'guest' ? ownerId : null,
    publicSlug: cardId,
    status: 'ordered',
    profile: {
      fullName: order.customerName,
      role: order.jobTitle ?? '',
      company: order.company ?? '',
      phone: order.phone,
      telegram: order.telegram ?? '',
      email: order.email ?? '',
      address: order.deliveryAddress ?? '',
    },
    design: {
      cardDesign: order.cardDesign,
      product: order.productType,
      cardChoice: 'physical',
      customImageUri: order.designArtworkUrl ?? null,
    },
    orderId: order.id,
    createdBy: actorUserId,
  });
}

async function createApprovedProductionJob(order: Order, createdBy: string): Promise<PrinterJob> {
  if (!order.cardId?.trim()) {
    throw new Error('Order is missing cardId. Production requires one card source of truth.');
  }
  await assertCardReadyForPrint(order.cardId);
  const now = new Date().toISOString();
  const queueNumber = Date.now();
  const jobRef = await addDoc(collection(db, firebaseCollections.printerJobs), {
    orderId: order.id,
    cardId: order.cardId,
    companyId: order.companyId ?? '',
    branch: order.branch ?? '',
    printerId: '',
    queueNumber,
    stage: 'received' as PrinterJobStage,
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    createdBy,
    updatedBy: createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await recordProductionLog({
    action: 'printer_job_created',
    jobId: jobRef.id,
    orderId: order.id,
    cardId: order.cardId,
    actorId: createdBy,
  }).catch(() => undefined);
  return {
    id: jobRef.id,
    orderId: order.id,
    cardId: order.cardId,
    companyId: order.companyId ?? '',
    branch: order.branch ?? '',
    printerId: '',
    queueNumber,
    stage: 'received',
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    createdAt: now,
    updatedAt: now,
  };
}

async function getApprovedPhysicalOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.orders),
      where('orderNumber', '==', orderNumber.trim().toUpperCase()),
      where('fulfillment', '==', 'physical'),
      where('status', 'in', ['printer_assigned', 'printing', 'qa_failed'])
    )
  );
  const order = snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .find((candidate) => isPhysicalFulfillment(candidate) && Boolean(candidate.salesApprovedAt));
  return order ?? null;
}

export function mapProductionBatch(id: string, data: Record<string, unknown>): ProductionBatch {
  return {
    id,
    batchNumber: String(data.batchNumber ?? ''),
    material: String(data.material ?? ''),
    printerType: String(data.printerType ?? ''),
    status: (data.status as ProductionBatchStatus) ?? 'draft',
    orderIds: Array.isArray(data.orderIds) ? (data.orderIds as string[]) : [],
    companyId: data.companyId as string | undefined,
    branch: String(data.branch ?? ''),
    activeOperatorId: data.activeOperatorId as string | undefined,
    notes: data.notes as string | undefined,
    createdBy: String(data.createdBy ?? ''),
    updatedBy: data.updatedBy as string | undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function mapAuditLog(id: string, data: Record<string, unknown>): AuditLogEntry {
  return {
    id,
    action: String(data.action ?? ''),
    entityType: (data.entityType as AuditLogEntry['entityType']) ?? 'order',
    entityId: String(data.entityId ?? ''),
    actorId: String(data.actorId ?? ''),
    actorRole: data.actorRole as AuditLogEntry['actorRole'],
    companyId: data.companyId as string | undefined,
    branch: data.branch as string | undefined,
    metadata: data.metadata as AuditLogEntry['metadata'],
    createdAt: toIso(data.createdAt),
  };
}

export async function writeAuditLog(input: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, firebaseCollections.auditLogs), {
    ...input,
    actorId: input.actorId || actorId(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.auditLogs),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    )
  );
  return snap.docs
    .map((d) => mapAuditLog(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeAuditLogs(callback: (items: AuditLogEntry[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    query(
      collection(db, firebaseCollections.auditLogs),
      orderBy('createdAt', 'desc'),
      firestoreLimit(100)
    ),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapAuditLog(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(items);
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export type CreateBatchInput = {
  batchNumber: string;
  material: string;
  printerType: string;
  branch: string;
  notes?: string;
  createdBy?: string;
};

export async function createProductionBatch(input: CreateBatchInput): Promise<string> {
  assertNonEmpty(input.batchNumber, 'Batch number is required.');
  assertNonEmpty(input.material, 'Material is required.');
  assertNonEmpty(input.printerType, 'Printer type is required.');
  const staffId = actorId(input.createdBy);
  const staffSnap = staffId ? await getDoc(doc(db, firebaseCollections.users, staffId)) : null;
  const staffCompanyId = staffSnap?.exists() ? String(staffSnap.data().companyId ?? '') : '';
  const ref = await addDoc(
    collection(db, firebaseCollections.productionBatches),
    withoutUndefined({
      batchNumber: input.batchNumber.trim(),
      material: input.material.trim(),
      printerType: input.printerType.trim(),
      status: 'active' as ProductionBatchStatus,
      orderIds: [],
      companyId: staffCompanyId || undefined,
      branch: input.branch?.trim() || '',
      notes: input.notes?.trim(),
      createdBy: staffId,
      updatedBy: staffId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  await writeAuditLog({
    action: 'batch_created',
    entityType: 'batch',
    entityId: ref.id,
    actorId: staffId,
    companyId: staffCompanyId || undefined,
    metadata: { batchNumber: input.batchNumber },
  });
  return ref.id;
}

export async function getProductionBatch(batchId: string): Promise<ProductionBatch | null> {
  const snap = await getDoc(doc(db, firebaseCollections.productionBatches, batchId));
  if (!snap.exists()) return null;
  return mapProductionBatch(snap.id, snap.data() as Record<string, unknown>);
}

export async function listBatchPrinterJobs(batchId: string): Promise<PrinterJob[]> {
  assertNonEmpty(batchId, 'Batch ID is required.');
  const snap = await getDocs(
    query(collection(db, firebaseCollections.printerJobs), where('batchId', '==', batchId), firestoreLimit(300))
  );
  return snap.docs
    .map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.queueNumber - b.queueNumber);
}

export async function listProductionBatches(branch?: string): Promise<ProductionBatch[]> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.productionBatches),
      orderBy('createdAt', 'desc'),
      firestoreLimit(200)
    )
  );
  let items = snap.docs.map((d) => mapProductionBatch(d.id, d.data() as Record<string, unknown>));
  if (branch?.trim()) {
    items = items.filter((b) => !b.branch || b.branch === branch);
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeProductionBatches(
  branch: string | undefined,
  callback: (batches: ProductionBatch[]) => void,
  onError?: (e: Error) => void
) {
  return onSnapshot(
    query(
      collection(db, firebaseCollections.productionBatches),
      orderBy('createdAt', 'desc'),
      firestoreLimit(200)
    ),
    (snapshot) => {
      let items = snapshot.docs.map((d) => mapProductionBatch(d.id, d.data() as Record<string, unknown>));
      if (branch?.trim()) {
        items = items.filter((b) => !b.branch || b.branch === branch);
      }
      callback(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

async function updateBatchLifecycleStatus(
  batchId: string,
  status: ProductionBatchStatus,
  updatedBy: string | undefined,
  extra?: Record<string, unknown>,
  auditMetadata?: Record<string, string | number | boolean>
): Promise<void> {
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.productionBatches, batchId), withoutUndefined({
    ...extra,
    status,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  }));
  await writeAuditLog({
    action: `batch_${status}`,
    entityType: 'batch',
    entityId: batchId,
    actorId: userId,
    metadata: { status, ...(auditMetadata ?? {}) },
  });
}

export async function setBatchStatus(
  batchId: string,
  status: ProductionBatchStatus,
  extra?: { activeOperatorId?: string | null },
  updatedBy?: string
): Promise<void> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  if (status === 'completed') {
    await completeProductionBatch(batchId, updatedBy);
    return;
  }
  if (status === 'cancelled') {
    await cancelProductionBatch(batchId, undefined, updatedBy);
    return;
  }
  if (batch.status === 'completed' || batch.status === 'cancelled') {
    throw new Error('Closed batches cannot be reopened.');
  }
  const payload: Record<string, unknown> = {};
  if (extra?.activeOperatorId !== undefined) {
    payload.activeOperatorId = extra.activeOperatorId || null;
  }
  await updateBatchLifecycleStatus(batchId, status, updatedBy, payload);
}

export async function completeProductionBatch(batchId: string, updatedBy?: string): Promise<void> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  if (batch.status === 'completed') throw new Error('Batch is already completed.');
  if (batch.status === 'cancelled') throw new Error('Cancelled batches cannot be completed.');
  if (batch.orderIds.length === 0) {
    throw new Error('Add at least one order before completing a batch.');
  }

  const jobs = await listBatchPrinterJobs(batchId);
  const missingJobCount = Math.max(0, batch.orderIds.length - new Set(jobs.map((job) => job.orderId)).size);
  if (missingJobCount > 0) {
    throw new Error(`Batch has ${missingJobCount} order(s) without printer jobs.`);
  }

  const openJobs = jobs.filter((job) => !BATCH_COMPLETE_JOB_STAGES.has(job.stage));
  if (openJobs.length > 0) {
    throw new Error(`Finish ${openJobs.length} open printer job(s) before completing this batch.`);
  }

  await updateBatchLifecycleStatus(batchId, 'completed', updatedBy, undefined, {
    orderCount: batch.orderIds.length,
    jobCount: jobs.length,
  });
}

export async function cancelProductionBatch(
  batchId: string,
  reason?: string,
  updatedBy?: string
): Promise<void> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  if (batch.status === 'completed') throw new Error('Completed batches cannot be cancelled.');
  if (batch.status === 'cancelled') throw new Error('Batch is already cancelled.');

  const jobs = await listBatchPrinterJobs(batchId);
  const startedJobs = jobs.filter((job) => !BATCH_CANCELABLE_JOB_STAGES.has(job.stage));
  if (startedJobs.length > 0) {
    throw new Error('Pause this batch instead. It already has jobs in production.');
  }

  const orders = await Promise.all(batch.orderIds.map((orderId) => getOrder(orderId)));
  const lockedOrders = orders.filter(
    (order): order is Order =>
      order !== null &&
      order.batchId === batchId &&
      order.status !== 'printer_assigned' &&
      order.status !== 'qa_failed'
  );
  if (lockedOrders.length > 0) {
    throw new Error('Pause this batch instead. One or more orders already moved past printer intake.');
  }

  const userId = actorId(updatedBy);
  await Promise.all([
    ...orders
      .filter((order): order is Order => order !== null && order.batchId === batchId)
      .map((order) =>
        updateDoc(doc(db, firebaseCollections.orders, order.id), {
          batchId: null,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        })
      ),
    ...jobs.map((job) =>
      updateDoc(doc(db, firebaseCollections.printerJobs, job.id), {
        batchId: null,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      })
    ),
  ]);

  await updateBatchLifecycleStatus(batchId, 'cancelled', userId, { orderIds: [] }, {
    releasedOrders: batch.orderIds.length,
    releasedJobs: jobs.length,
    reason: reason?.trim() || 'Admin cancelled batch',
  });
}

export async function approveOrderForProduction(orderId: string, salesUserId?: string): Promise<Order> {
  const userId = actorId(salesUserId);
  const role = await getActorRole(userId);
  if (!canApproveProduction(role)) {
    throw new Error('Only sales or admin can approve production.');
  }
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (!isPhysicalFulfillment(order)) {
    throw new Error('E-card orders publish automatically - no production approval needed.');
  }
  if (order.salesApprovedAt) {
    throw new Error('Order is already approved for production.');
  }
  if (!isPaymentVerified(order)) {
    throw new Error('Order must be paid before production approval.');
  }
  let cardId = order.cardId?.trim();
  if (!cardId) {
    cardId = `CARD-${orderId}`;
    await updateDoc(doc(db, firebaseCollections.orders, orderId), {
      cardId,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
    order.cardId = cardId;
  }
  await ensureManualOrderCardIdentity(order, userId);
  // Simplified flow: accept pending_payment and all legacy intermediate statuses
  const allowedStatuses: OrderStatus[] = [
    'pending_payment',
    'payment_verified',
    'payment_submitted',
    'production_approved', // idempotent re-approval
  ];
  if (!allowedStatuses.includes(order.status)) {
    throw new Error(`Cannot approve from status "${order.status}".`);
  }

  // cardId is optional on the Order type, but production approval requires a
  // real card source of truth. Bail loudly instead of silently writing an
  // empty cardId into the locked-card record.
  const approvedCardId = order.cardId?.trim();
  if (!approvedCardId) {
    throw new Error('Order is missing cardId. Cannot approve for production.');
  }

  await lockCardForProduction(approvedCardId, orderId, userId);

  const now = new Date().toISOString();
  const payload = withoutUndefined({
    status: 'production_approved' as OrderStatus,
    salesApprovedAt: now,
    salesApprovedBy: userId,
    orderNumber: order.orderNumber ?? generateOrderNumber(),
    productionPasscode: order.productionPasscode ?? generateProductionPasscode(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, firebaseCollections.orders, orderId), payload);
  await writeAuditLog({
    action: 'sales_approved_production',
    entityType: 'order',
    entityId: orderId,
    actorId: userId,
    metadata: { orderNumber: payload.orderNumber as string },
  });

  const updated = await getOrder(orderId);
  if (!updated) throw new Error('Order not found after approval.');
  const customerId = updated.createdBy?.trim();
  if (customerId) {
    void createStaffNotification({
      userId: customerId,
      title: 'Production started',
      message: `Order ${updated.orderNumber ?? orderId.slice(0, 8)} is approved and entering the print queue.`,
      priority: 'medium',
      actionUrl: `/guest-track-order?orderId=${encodeURIComponent(orderId)}`,
      createdBy: userId,
    }).catch(() => undefined);
  }
  const job = await createApprovedProductionJob(updated, userId);
  await writeAuditLog({
    action: 'production_job_created',
    entityType: 'printer_job',
    entityId: job.id,
    actorId: userId,
    metadata: { orderId, orderNumber: updated.orderNumber ?? '' },
  });
  return updated;
}

/**
 * Approve multiple orders for production in one go. Each order is approved
 * independently so a single failure (e.g. missing cardId on one order) does
 * not roll back the whole batch. Returns per-order results so the caller
 * can surface partial success.
 */
export async function bulkApproveOrdersForProduction(
  orderIds: string[],
  salesUserId?: string,
): Promise<{ orderId: string; ok: boolean; error?: string }[]> {
  const results: { orderId: string; ok: boolean; error?: string }[] = [];
  for (const orderId of orderIds) {
    try {
      await approveOrderForProduction(orderId, salesUserId);
      results.push({ orderId, ok: true });
    } catch (err) {
      results.push({
        orderId,
        ok: false,
        error: err instanceof Error ? err.message : 'Approval failed.',
      });
    }
  }
  return results;
}

export async function assignOrderToBatch(
  batchId: string,
  orderId: string,
  updatedBy?: string
): Promise<PrinterJob> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  if (batch.status === 'completed' || batch.status === 'cancelled') {
    throw new Error('Cannot add orders to a closed batch.');
  }
  if (batch.status === 'draft') {
    await setBatchStatus(batchId, 'active', undefined, updatedBy);
  }

  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (!isPhysicalFulfillment(order)) {
    throw new Error('E-card orders do not go to printer production.');
  }
  if (!isPaymentVerified(order)) {
    throw new Error('Order must be paid before production.');
  }
  if (!order.cardId?.trim()) {
    throw new Error('Order is missing cardId. Production requires one card source of truth.');
  }
  await assertCardReadyForPrint(order.cardId);
  if (!order.salesApprovedAt) {
    throw new Error('Sales must approve this order before production.');
  }
  if (order.status !== 'production_approved' && order.status !== 'qa_failed') {
    throw new Error('Order must be approved and ready for production.');
  }
  if (order.branch && batch.branch && order.branch !== batch.branch) {
    throw new Error('Order belongs to a different branch.');
  }
  if (order.batchId && order.batchId !== batchId) {
    throw new Error('Order is already assigned to another batch.');
  }

  const existingJob = await getPrinterJobByOrderId(orderId);
  if (existingJob?.cardId && existingJob.cardId !== order.cardId) {
    throw new Error('Production blocked: order.cardId does not match printerJob.cardId.');
  }
  if (existingJob && !existingJob.isReprint && existingJob.batchId && existingJob.batchId !== batchId) {
    throw new Error('Order already has an active printer job.');
  }

  const userId = actorId(updatedBy);
  const statusUpdate: Partial<{ status: OrderStatus }> = {};
  if (canTransitionOrderStatus(order.status, 'printer_assigned')) {
    statusUpdate.status = 'printer_assigned';
  } else if (order.status === 'qa_failed' && canTransitionOrderStatus('qa_failed', 'printing')) {
    statusUpdate.status = 'printing';
  }

  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    batchId,
    branch: batch.branch || order.branch,
    ...statusUpdate,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  const orderIds = batch.orderIds.includes(orderId) ? batch.orderIds : [...batch.orderIds, orderId];
  await updateDoc(doc(db, firebaseCollections.productionBatches, batchId), {
    orderIds,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  if (existingJob && !existingJob.isReprint) {
    if (existingJob.batchId === batchId) return existingJob;
    if (existingJob.batchId) throw new Error('Order already has an active printer job.');

    const jobRef = doc(db, firebaseCollections.printerJobs, existingJob.id);
    await updateDoc(jobRef, {
      cardId: order.cardId,
      batchId,
      branch: batch.branch || order.branch || '',
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      action: 'production_job_received',
      entityType: 'printer_job',
      entityId: existingJob.id,
      actorId: userId,
      metadata: { orderId, batchId },
    });
    const jobSnap = await getDoc(jobRef);
    return mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>);
  }

  const jobRef = await addDoc(collection(db, firebaseCollections.printerJobs), {
    orderId,
    cardId: order.cardId,
    batchId,
    branch: batch.branch || order.branch || '',
    printerId: '',
    queueNumber: Date.now(),
    stage: 'received' as PrinterJobStage,
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    action: 'order_assigned_to_batch',
    entityType: 'order',
    entityId: orderId,
    actorId: userId,
    metadata: { batchId, jobId: jobRef.id },
  });
  await recordProductionLog({
    action: 'order_assigned_to_batch',
    jobId: jobRef.id,
    orderId,
    cardId: order.cardId,
    actorId: userId,
    metadata: { batchId },
  }).catch(() => undefined);

  const jobSnap = await getDoc(jobRef);
  return mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>);
}

export type ReceiveApprovedProductionJobInput = {
  batchId?: string;  // optional — batch not required in simplified flow
  scanValue: string;
  passcode?: string;
  operatorId?: string;
  branch?: string;
};

export async function receiveApprovedProductionJob(
  input: ReceiveApprovedProductionJobInput
): Promise<{ order: Order; job: PrinterJob }> {
  assertNonEmpty(input.scanValue, 'Scan value or order ID is required.');

  const parsed = parseProductionScan(input.scanValue);
  const orderNumber = parsed.orderNumber?.trim().toUpperCase();
  const passcode = (parsed.passcode ?? input.passcode)?.trim();

  if (!orderNumber) {
    throw new Error('Scan a production QR code or enter an Order ID.');
  }

  // passcode is required only when manually typed (not scanned from QR)
  if (!passcode && !parsed.orderNumber) {
    throw new Error('Production passcode is required for manual Order ID receive.');
  }

  const order = await getApprovedPhysicalOrderByOrderNumber(orderNumber);
  if (!order) throw new Error('Approved production order not found.');
  if (!isPhysicalFulfillment(order)) {
    throw new Error('E-card orders publish digitally and skip printer production.');
  }
  if (!order.salesApprovedAt) {
    throw new Error('Sales approval is required before printer receive.');
  }
  if (passcode && order.productionPasscode && order.productionPasscode !== passcode) {
    throw new Error('Production passcode does not match this order.');
  }
  if (!['production_approved', 'printer_assigned', 'qa_failed'].includes(order.status)) {
    throw new Error('Order is not ready for printer receive.');
  }

  // Branch check is advisory — only block if both are set and differ
  if (input.branch?.trim() && order.branch?.trim() && order.branch !== input.branch.trim()) {
    throw new Error('Order belongs to a different branch.');
  }

  // If a batch is active, route through batch assignment
  // Otherwise assign directly without a batch
  if (input.batchId?.trim()) {
    if (order.batchId && order.batchId !== input.batchId) {
      throw new Error('Order is already assigned to another batch.');
    }
    const job = await assignOrderToBatch(input.batchId, order.id, input.operatorId);
    const refreshedOrder = await getOrder(order.id);
    return { order: refreshedOrder ?? order, job };
  }

  // Batch-free path: ensure a printer job exists for this order
  const existingJob = await getPrinterJobByOrderId(order.id);
  if (existingJob) {
    // Update status to printer_assigned if still on production_approved
    if (order.status === 'production_approved') {
      await updateOrderStatus(order.id, 'printer_assigned', input.operatorId);
    }
    const refreshedOrder = await getOrder(order.id);
    return { order: refreshedOrder ?? order, job: existingJob };
  }

  // Create a standalone job without a batch
  const userId = actorId(input.operatorId);
  if (!order.cardId?.trim()) {
    throw new Error('Order is missing cardId. Production requires a card source of truth.');
  }
  await assertCardReadyForPrint(order.cardId);

  const jobRef = await addDoc(collection(db, firebaseCollections.printerJobs), {
    orderId: order.id,
    cardId: order.cardId,
    batchId: '',
    branch: order.branch ?? '',
    printerId: '',
    queueNumber: Date.now(),
    stage: 'received' as PrinterJobStage,
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateOrderStatus(order.id, 'printer_assigned', userId);

  await writeAuditLog({
    action: 'printer_job_created_batchless',
    entityType: 'printer_job',
    entityId: jobRef.id,
    actorId: userId,
    metadata: { orderId: order.id, orderNumber: order.orderNumber ?? '' },
  });

  const jobSnap = await getDoc(jobRef);
  const refreshedOrder = await getOrder(order.id);
  return {
    order: refreshedOrder ?? order,
    job: mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>),
  };
}

export async function removeOrderFromBatch(batchId: string, orderId: string, updatedBy?: string): Promise<void> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.productionBatches, batchId), {
    orderIds: batch.orderIds.filter((id) => id !== orderId),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    batchId: null,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeBatchPrinterJobs(
  batchId: string,
  callback: (jobs: PrinterJob[]) => void,
  onError?: (e: Error) => void
) {
  if (!batchId?.trim()) {
    callback([]);
    return () => {};
  }
  const jobsQuery = query(
    collection(db, firebaseCollections.printerJobs),
    where('batchId', '==', batchId)
  );
  return onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobs = snapshot.docs
        .map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.queueNumber - b.queueNumber);
      callback(jobs);
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export async function submitQaDecision(
  orderId: string,
  jobId: string,
  decision: QaDecision,
  reason?: string,
  updatedBy?: string
): Promise<void> {
  const userId = actorId(updatedBy);
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'qa_pending') {
    throw new Error('Order is not awaiting QA.');
  }

  if (decision === 'pass') {
    await updateOrderStatus(orderId, 'ready_to_ship', userId);
    await updateDoc(doc(db, firebaseCollections.printerJobs, jobId), {
      stage: 'completed' as PrinterJobStage,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
    if (order.cardId) {
      await updateCardProductionStatus(order.cardId, 'active', userId, {
        productionJobId: jobId,
        productionOrderId: orderId,
      }).catch(() => undefined);
      await recordProductionLog({
        action: 'qa_passed',
        jobId,
        orderId,
        cardId: order.cardId,
        actorId: userId,
      }).catch(() => undefined);
    }
    await writeAuditLog({
      action: 'qa_passed',
      entityType: 'qa',
      entityId: orderId,
      actorId: userId,
      metadata: { jobId },
    });
    const customerId = order.createdBy?.trim();
    if (customerId) {
      void createStaffNotification({
        userId: customerId,
        title: 'QA passed',
        message: 'Your card passed quality inspection and will ship soon.',
        priority: 'medium',
        actionUrl: `/guest-track-order?orderId=${encodeURIComponent(orderId)}`,
        createdBy: userId,
      }).catch(() => undefined);
    }
    return;
  }

  await updateOrderStatus(orderId, 'qa_failed', userId);
  await updateDoc(doc(db, firebaseCollections.printerJobs, jobId), {
    stage: 'failed',
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    action: 'qa_failed',
    entityType: 'qa',
    entityId: orderId,
    actorId: userId,
    metadata: { jobId, reason: reason ?? '' },
  });
  if (order.cardId) {
    await updateCardProductionStatus(order.cardId, 'locked', userId, {
      productionJobId: jobId,
      productionOrderId: orderId,
    }).catch(() => undefined);
    await recordProductionLog({
      action: 'qa_failed',
      jobId,
      orderId,
      cardId: order.cardId,
      actorId: userId,
      metadata: { reason: reason ?? '' },
    }).catch(() => undefined);
  }
  await createReprintJob(orderId, jobId, reason ?? 'QA failed', userId);
}

export async function createReprintJob(
  orderId: string,
  originalJobId: string,
  reason: string,
  createdBy?: string
): Promise<string> {
  const userId = actorId(createdBy);
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (!order.cardId?.trim()) {
    throw new Error('Order is missing cardId. Cannot create reprint job.');
  }

  const jobRef = await addDoc(collection(db, firebaseCollections.printerJobs), {
    orderId,
    cardId: order.cardId,
    batchId: order.batchId ?? null,
    branch: order.branch ?? '',
    printerId: '',
    queueNumber: Date.now(),
    stage: 'reprint' as PrinterJobStage,
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    isReprint: true,
    reprintOfJobId: originalJobId,
    notes: reason,
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, firebaseCollections.reprintRecords), {
    orderId,
    cardId: order.cardId,
    originalJobId,
    newJobId: jobRef.id,
    batchId: order.batchId ?? null,
    reason,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });

  if (canTransitionOrderStatus(order.status, 'printing')) {
    await updateOrderStatus(orderId, 'printing', userId);
  }

  await writeAuditLog({
    action: 'reprint_created',
    entityType: 'reprint',
    entityId: jobRef.id,
    actorId: userId,
    metadata: { orderId, originalJobId, reason },
  });
  await recordProductionLog({
    action: 'reprint_created',
    jobId: jobRef.id,
    orderId,
    cardId: order.cardId,
    actorId: userId,
    metadata: { originalJobId, reason },
  }).catch(() => undefined);

  return jobRef.id;
}

export type ShipOrderInput = {
  carrier?: string;
  trackingNumber?: string;
  trackingNote?: string;
};

export async function markOrderShipped(
  orderId: string,
  input?: ShipOrderInput,
  updatedBy?: string
): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'ready_to_ship') {
    throw new Error('Order must be ready to ship.');
  }
  const userId = actorId(updatedBy);
  const next: OrderStatus = 'shipped';
  const carrier = input?.carrier?.trim();
  const trackingNumber = input?.trackingNumber?.trim();
  const trackingNote = input?.trackingNote?.trim();

  await updateDoc(doc(db, firebaseCollections.orders, orderId), withoutUndefined({
    status: next,
    carrier,
    trackingNumber,
    trackingNote,
    shippedAt: next === 'shipped' ? new Date().toISOString() : undefined,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  }));

  if (next === 'shipped') {
    await writeAuditLog({
      action: 'order_shipped',
      entityType: 'shipping',
      entityId: orderId,
      actorId: userId,
      metadata: {
        carrier: carrier ?? '',
        trackingNumber: trackingNumber ?? '',
        trackingNote: trackingNote ?? '',
      },
    });
    const customerId = order.createdBy?.trim();
    if (customerId) {
      const trackingLine = [carrier, trackingNumber, trackingNote].filter(Boolean).join(' · ');
      void createStaffNotification({
        userId: customerId,
        title: 'Order shipped',
        message: trackingLine
          ? `Your NFC card is on the way. ${trackingLine}`
          : 'Your NFC card has shipped.',
        priority: 'high',
        actionUrl: `/guest-track-order?orderId=${encodeURIComponent(orderId)}`,
        createdBy: userId,
      }).catch(() => undefined);
    }
  }
}

export async function markOrderDelivered(orderId: string, updatedBy?: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'shipped') {
    throw new Error('Order must be shipped first.');
  }
  const userId = actorId(updatedBy);
  await updateOrderStatus(orderId, 'delivered', userId);
  const refreshed = await getOrder(orderId);
  if (refreshed) {
    await accrueSalesCommissionOnDelivery(refreshed).catch(() => undefined);
  }
  const customerId = order.createdBy?.trim();
  if (customerId) {
    void createStaffNotification({
      userId: customerId,
      title: 'Order delivered',
      message: 'Your NFC card order was marked delivered. Enjoy your card!',
      priority: 'medium',
      actionUrl: `/guest-track-order?orderId=${encodeURIComponent(orderId)}`,
      createdBy: userId,
    }).catch(() => undefined);
  }
}

export async function listOrdersReadyToShip(branch?: string): Promise<Order[]> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.orders),
      where('status', '==', 'ready_to_ship'),
      firestoreLimit(200)
    )
  );
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .filter((o) => {
      const ready = o.status === 'ready_to_ship';
      if (!ready) return false;
      if (branch?.trim() && o.branch && o.branch !== branch) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listProductionLabelOrders(branch?: string): Promise<Order[]> {
  const labelStatuses = new Set<OrderStatus>([
    'production_approved',
    'printer_assigned',
    'printing',
    'nfc_writing',
    'nfc_verification',
    'qa_pending',
    'qa_failed',
    'ready_to_ship',
  ]);
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.orders),
      where('status', 'in', Array.from(labelStatuses)),
      firestoreLimit(300)
    )
  );

  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .filter((order) => {
      if (!isPhysicalFulfillment(order)) return false;
      if (!order.salesApprovedAt) return false;
      if (!isPaymentVerified(order)) return false;
      if ((order.cardStatus ?? 'active') === 'closed') return false;
      if (!labelStatuses.has(order.status)) return false;
      if (branch?.trim() && order.branch && order.branch !== branch.trim()) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listOrdersAwaitingQa(): Promise<Order[]> {
  const snap = await getDocs(
    query(collection(db, firebaseCollections.orders), where('status', '==', 'qa_pending'))
  );
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProductionStats(): Promise<ProductionStatsSnapshot> {
  const today = new Date().toISOString().slice(0, 10);
  const [batchSnap, orderSnap, jobSnap, auditSnap, reprintSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, firebaseCollections.productionBatches),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(PRODUCTION_DASHBOARD_LIMIT)
      )
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.orders),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(PRODUCTION_DASHBOARD_LIMIT)
      )
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.printerJobs),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(PRODUCTION_DASHBOARD_LIMIT)
      )
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.auditLogs),
        orderBy('createdAt', 'desc'),
        firestoreLimit(PRODUCTION_DASHBOARD_LIMIT)
      )
    ),
    getDocs(
      query(
        collection(db, firebaseCollections.reprintRecords),
        orderBy('createdAt', 'desc'),
        firestoreLimit(PRODUCTION_DASHBOARD_LIMIT)
      )
    ),
  ]);
  const batches = batchSnap.docs.map((d) => mapProductionBatch(d.id, d.data() as Record<string, unknown>));
  const orders = orderSnap.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>));
  const jobs = jobSnap.docs.map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>));
  const auditLogs = auditSnap.docs.map((d) => mapAuditLog(d.id, d.data() as Record<string, unknown>));

  const qaPassedToday = auditLogs.filter((l) => l.action === 'qa_passed' && l.createdAt.startsWith(today)).length;
  const qaFailedToday = auditLogs.filter((l) => l.action === 'qa_failed' && l.createdAt.startsWith(today)).length;
  const qaDecisionsToday = qaPassedToday + qaFailedToday;

  const reprintsToday = reprintSnap.docs.filter((d) => {
    const createdAt = d.data().createdAt;
    const iso = createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : toIso(createdAt);
    return iso.startsWith(today);
  }).length;

  return {
    cardsToday: orders
      .filter((o) => o.createdAt.startsWith(today))
      .reduce((sum, o) => sum + (o.quantity ?? 1), 0),
    batchesActive: batches.filter((b) => b.status === 'active').length,
    ordersInProduction: orders.filter((o) =>
      ['printing', 'nfc_writing', 'nfc_verification', 'qa_pending'].includes(o.status)
    ).length,
    jobsInQueue: jobs.filter((j) => j.stage === 'received' || j.stage === 'reprint').length,
    qaPending: orders.filter((o) => o.status === 'qa_pending').length,
    qaPassRate: qaDecisionsToday > 0 ? Math.round((qaPassedToday / qaDecisionsToday) * 100) : 100,
    readyToShip: orders.filter((o) => o.status === 'ready_to_ship').length,
    shippedToday: orders.filter((o) => o.status === 'shipped' && o.updatedAt.startsWith(today)).length,
    reprintsToday,
    capturedAt: new Date().toISOString(),
  };
}

export async function upsertPrinterHealthPlaceholder(
  printerId: string,
  printerName: string,
  branch: string
): Promise<void> {
  await setDoc(
    doc(db, firebaseCollections.printerHealth, printerId),
    {
      printerId,
      printerName,
      branch,
      status: 'unknown',
      lastSeenAt: serverTimestamp(),
      jobsToday: 0,
      failureRate: 0,
      notes: 'Placeholder - connect device telemetry',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function listReprintRecords(limit = 50): Promise<ReprintRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.reprintRecords),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    )
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderId: String(data.orderId ?? ''),
        originalJobId: String(data.originalJobId ?? ''),
        newJobId: String(data.newJobId ?? ''),
        batchId: data.batchId as string | undefined,
        reason: String(data.reason ?? ''),
        createdBy: String(data.createdBy ?? ''),
        createdAt: toIso(data.createdAt),
      } as ReprintRecord;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type ReprintSlaStatus = 'open' | 'overdue' | 'blocked' | 'done';

export interface ReprintSlaItem {
  record: ReprintRecord;
  order: Order | null;
  job: PrinterJob | null;
  status: ReprintSlaStatus;
  ageHours: number;
  dueAt: string;
}

const REPRINT_SLA_HOURS = 24;

function addHours(iso: string, hours: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function hoursSince(iso: string): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 36e5));
}

function getReprintSlaStatus(job: PrinterJob | null, ageHours: number): ReprintSlaStatus {
  if (!job || job.stage === 'failed') return 'blocked';
  if (job.stage === 'ready_to_ship' || job.stage === 'completed') return 'done';
  if (ageHours >= REPRINT_SLA_HOURS) return 'overdue';
  return 'open';
}

export async function listReprintSlaItems(branch?: string, limit = 80): Promise<ReprintSlaItem[]> {
  const records = await listReprintRecords(limit);
  const items = await Promise.all(
    records.map(async (record) => {
      const [jobSnap, order] = await Promise.all([
        getDoc(doc(db, firebaseCollections.printerJobs, record.newJobId)),
        getOrder(record.orderId),
      ]);
      const job = jobSnap.exists()
        ? mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>)
        : null;

      if (branch?.trim() && order?.branch && order.branch !== branch.trim()) {
        return null;
      }

      const ageHours = hoursSince(record.createdAt);
      return {
        record,
        order,
        job,
        ageHours,
        dueAt: addHours(record.createdAt, REPRINT_SLA_HOURS),
        status: getReprintSlaStatus(job, ageHours),
      } satisfies ReprintSlaItem;
    })
  );

  return items
    .filter((item): item is ReprintSlaItem => item !== null)
    .sort((a, b) => {
      const priority: Record<ReprintSlaStatus, number> = {
        blocked: 0,
        overdue: 1,
        open: 2,
        done: 3,
      };
      return priority[a.status] - priority[b.status] || b.ageHours - a.ageHours;
    });
}

export async function listPrinterHealthRecords(): Promise<PrinterHealthRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, firebaseCollections.printerHealth),
      orderBy('updatedAt', 'desc'),
      firestoreLimit(200)
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      printerId: String(data.printerId ?? d.id),
      printerName: String(data.printerName ?? ''),
      branch: String(data.branch ?? ''),
      status: (data.status as PrinterHealthRecord['status']) ?? 'unknown',
      lastSeenAt: toIso(data.lastSeenAt),
      jobsToday: Number(data.jobsToday ?? 0),
      failureRate: Number(data.failureRate ?? 0),
      notes: data.notes as string | undefined,
      updatedAt: toIso(data.updatedAt),
    };
  });
}

/**
 * Simplified flow: list orders ready for the printer queue.
 * Uses production_approved as the primary entry status.
 * Batch is no longer required — orders appear in the queue
 * as soon as sales approves them.
 */
export async function listApprovedPhysicalOrdersForPrinter(branch?: string): Promise<Order[]> {
  let snap;
  try {
    snap = await getDocs(
      query(
        collection(db, firebaseCollections.orders),
        where('fulfillment', '==', 'physical'),
        where('status', 'in', ['production_approved', 'printer_assigned', 'qa_failed'])
      )
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[production] listApprovedPhysicalOrdersForPrinter query failed', error);
    }
    return [];
  }
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .filter((o) => {
      if (!isPhysicalFulfillment(o)) return false;
      if (!o.salesApprovedAt) return false;
      if (!['production_approved', 'printer_assigned', 'qa_failed'].includes(o.status)) return false;
      if (o.cardStatus === 'closed') return false;
      if (branch?.trim() && o.branch && o.branch !== branch) return false;
      return true;
    })
    .sort((a, b) => (b.salesApprovedAt ?? '').localeCompare(a.salesApprovedAt ?? ''));
}

export async function listPaidOrdersUnbatched(branch?: string): Promise<Order[]> {
  const orders = await listApprovedPhysicalOrdersForPrinter(branch);
  return orders.filter((o) => isPaymentVerified(o) && !o.batchId);
}

// ─── Live subscriptions (used by QA / Shipping / customer dashboards) ───────

/**
 * Live subscription to orders in a given set of statuses. Used by the QA
 * and Shipping queues so the list updates the moment sales / printer /
 * customer action lands. Returns an unsubscribe function.
 */
function subscribeOrdersByStatus(
  statuses: OrderStatus[],
  callback: (orders: Order[]) => void,
  onError?: (e: Error) => void,
  pageSize = 200,
): () => void {
  if (statuses.length === 0) {
    callback([]);
    return () => {};
  }
  // Firestore `in` queries support up to 30 values, which is well within our 14 statuses.
  const q = query(
    collection(db, firebaseCollections.orders),
    where('status', 'in', statuses),
    firestoreLimit(pageSize),
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
      callback(items);
    },
    (err) => {
      if (onError) onError(err);
      callback([]);
    },
  );
}

/** Live subscription to orders awaiting QA inspection. */
export function subscribeOrdersAwaitingQa(
  callback: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return subscribeOrdersByStatus(['qa_pending'], callback, onError);
}

/** Live subscription to orders ready to ship (and shipped, for tracking). */
export function subscribeShippingOrders(
  callback: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return subscribeOrdersByStatus(['ready_to_ship', 'shipped'], callback, onError);
}

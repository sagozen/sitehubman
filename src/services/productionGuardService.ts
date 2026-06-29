/**
 * productionGuardService.ts — Strict validation before production can start.
 *
 * Production must NEVER start from a guestId alone.
 * All three conditions must be met:
 *   1. customerId exists (ownerId is a real userId, not GST_)
 *   2. Payment is verified
 *   3. Sales has approved the order
 */

import { doc, getDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { db } from '@/src/services/firebaseClient';
import { isGuestIdentity } from '@/src/services/identityService';
import type { PaymentStatus } from '@/src/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductionReadiness = {
  ready: boolean;
  checks: {
    /** ownerId is a real userId, NOT a GST_ guest identity. */
    hasCustomerId: boolean;
    /** Payment has been verified by sales or payment provider. */
    paymentVerified: boolean;
    /** Sales has approved the order for production release. */
    salesApproved: boolean;
  };
  /** Human-readable list of what's blocking production. */
  blockers: string[];
};

// ---------------------------------------------------------------------------
// Payment verification statuses
// ---------------------------------------------------------------------------

/** Payment statuses that count as "verified" for production purposes. */
const VERIFIED_PAYMENT_STATUSES: PaymentStatus[] = [
  'paid',
  'paid_verified',
  'paid_qr',
  'cash_received',
];

function isPaymentVerified(status: PaymentStatus | string | undefined): boolean {
  return VERIFIED_PAYMENT_STATUSES.includes(status as PaymentStatus);
}

// ---------------------------------------------------------------------------
// Main Guard
// ---------------------------------------------------------------------------

/**
 * Check whether an order is ready for production.
 *
 * Returns a `ProductionReadiness` object with individual check results
 * and a human-readable list of blockers if not ready.
 *
 * @param orderId - Firestore document ID of the order
 */
export async function canStartProduction(orderId: string): Promise<ProductionReadiness> {
  const result: ProductionReadiness = {
    ready: false,
    checks: {
      hasCustomerId: false,
      paymentVerified: false,
      salesApproved: false,
    },
    blockers: [],
  };

  // Fetch the order document
  let orderData: Record<string, unknown>;
  try {
    const snap = await getDoc(doc(db, firebaseCollections.orders, orderId));
    if (!snap.exists()) {
      result.blockers.push('Order not found');
      return result;
    }
    orderData = snap.data() as Record<string, unknown>;
  } catch (err) {
    result.blockers.push(`Failed to fetch order: ${err instanceof Error ? err.message : String(err)}`);
    return result;
  }

  // Check 1: customerId exists (ownerId is NOT a guest)
  const ownerId = typeof orderData.ownerId === 'string' ? orderData.ownerId : '';
  const userId = typeof orderData.userId === 'string' ? orderData.userId : '';
  const createdBy = typeof orderData.createdBy === 'string' ? orderData.createdBy : '';

  // Prefer userId, fall back to ownerId, then createdBy
  const effectiveCustomerId = userId || ownerId || createdBy;

  if (effectiveCustomerId && !isGuestIdentity(effectiveCustomerId)) {
    result.checks.hasCustomerId = true;
  } else {
    result.blockers.push(
      'No customer account linked. Guest must register or sign in before production can start.',
    );
  }

  // Check 2: Payment is verified
  const paymentStatus = typeof orderData.paymentStatus === 'string' ? orderData.paymentStatus : '';
  if (isPaymentVerified(paymentStatus)) {
    result.checks.paymentVerified = true;
  } else {
    result.blockers.push(
      `Payment not verified. Current status: "${paymentStatus || 'unknown'}". Sales must confirm payment.`,
    );
  }

  // Check 3: Sales has approved the order
  const salesApprovedAt = orderData.salesApprovedAt;
  const onHold = orderData.onHold === true;
  if (salesApprovedAt && !onHold) {
    result.checks.salesApproved = true;
  } else if (onHold) {
    result.blockers.push('Order is on hold by sales. Release hold before production.');
  } else {
    result.blockers.push('Sales has not approved this order for production yet.');
  }

  // Final verdict
  result.ready =
    result.checks.hasCustomerId &&
    result.checks.paymentVerified &&
    result.checks.salesApproved;

  return result;
}

/**
 * Synchronous check: is this ownerId a real customer (not a guest)?
 * Use this for quick UI-level guards before making async calls.
 */
export function isProductionEligibleOwner(ownerId: string): boolean {
  return Boolean(ownerId) && !isGuestIdentity(ownerId);
}

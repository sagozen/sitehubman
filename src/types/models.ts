export type UserRole =
  | 'guest'
  | 'customer'
  | 'sales'
  | 'agent'
  | 'printer'
  | 'printer_operator'
  | 'qa_inspector'
  | 'shipping'
  | 'finance'
  | 'admin'
  | 'super_admin';

/** Lifecycle status of a guest identity. */
export type GuestStatus = 'active' | 'converted';

/** Discriminator for entity ownership — guest is temporary, customer is permanent. */
export type OwnerType = 'guest' | 'customer';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  authType?: 'anonymous' | 'email' | 'google' | 'apple' | 'telegram';
  authProvider?: 'anonymous' | 'email' | 'google' | 'apple' | 'telegram';
  telegramId?: string;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  lastLoginAt?: string;
  plan?: 'guest_trial' | 'free' | 'pro' | 'physical_card';
  trialStartedAt?: string;
  trialEndsAt?: string;
  language: string;
  phone?: string;
  companyId?: string;
  branch?: string;
  territory?: string;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  isGuest?: boolean;
}

/**
 * Guest identity — temporary visitor before account registration.
 *
 * Stored in Firestore `guests/{guestId}` and `guestSessions/{guestId}`.
 * When a guest registers or signs in, their status changes to `converted`
 * and all owned cards/orders are transferred to the new `userId`.
 */
export interface Guest {
  guestId: string;
  createdAt: string;
  deviceId?: string;
  status: GuestStatus;
  /** The card ID associated with this guest session. */
  cardId?: string;
  /** Set when the guest converts to a customer. */
  convertedToUserId?: string;
  /** Timestamp of conversion. */
  convertedAt?: string;
  /** Firebase Auth UID that owns this session (anonymous or signed-in). */
  sessionOwnerUid?: string;
  /** Secret key for guest session verification. */
  guestAccessKey?: string;
}

export interface Lead {
  id: string;
  profileId: string;
  ownerUserId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  note?: string;
  capturedAt: string;
}

// Order

export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_verified'
  | 'production_approved'
  | 'printer_assigned'
  | 'printing'
  | 'nfc_writing'
  | 'nfc_verification'
  | 'qa_pending'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'payment_rejected'
  | 'qa_failed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'pending_payment'
  | 'under_review'
  | 'paid_verified'
  | 'partial'
  | 'paid'
  /** Sales confirmed QR / bank transfer received */
  | 'paid_qr'
  /** Sales confirmed cash collected - finance must deposit later */
  | 'cash_received';

/** Sales payment confirmation before production (system records money). */
export type SalesPaymentConfirmation = 'qr_paid' | 'cash_received';

export type OrderPaymentRecordStatus = 'unpaid' | 'paid_qr' | 'cash_received' | 'failed' | 'refunded';

export type LedgerTransactionType =
  | 'revenue'
  | 'cash_on_hand'
  | 'cash_deposit'
  | 'refund'
  | 'expense';

export type LedgerWallet = 'revenue' | 'company_cash' | 'bank';

export interface OrderPaymentRecord {
  id: string;
  orderId: string;
  orderNumber?: string;
  amount: number;
  currency: 'USD' | 'KHR';
  status: OrderPaymentRecordStatus;
  confirmationType: SalesPaymentConfirmation;
  companyId?: string;
  branch?: string;
  confirmedBy: string;
  confirmedAt: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  orderId: string;
  paymentId: string;
  type: LedgerTransactionType;
  amount: number;
  currency: 'USD' | 'KHR';
  wallet: LedgerWallet;
  settlementRequired?: boolean;
  settledAt?: string;
  settledBy?: string;
  companyId?: string;
  branch?: string;
  createdBy: string;
  createdAt: string;
}

export interface CompanyWalletBalances {
  id: string;
  revenueUsd: number;
  revenueKhr: number;
  cashOnHandUsd: number;
  cashOnHandKhr: number;
  bankUsd: number;
  bankKhr: number;
  updatedAt: string;
}

export type ManualVerificationStatus =
  | 'none'
  | 'proof_submitted'
  | 'reference_submitted'
  | 'verified'
  | 'rejected';

export type PaymentIntentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'refunded';

export type RefundStatus = 'pending' | 'processing' | 'refunded' | 'failed' | 'cancelled';

export type OrderRefundStatus = 'partial' | 'processing' | 'refunded' | 'failed';

export interface RefundRecord {
  id: string;
  orderId: string;
  userId: string;
  assignedSalesman?: string;
  paymentIntentId?: string;
  amount: number;
  currency: 'USD' | 'KHR';
  reason: string;
  status: RefundStatus;
  provider?: string;
  providerRef?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  refundedAt?: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'void';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: 'USD' | 'KHR';
}

export interface InvoiceRecord {
  id: string;
  orderId: string;
  userId: string;
  assignedSalesman?: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  amount: number;
  currency: 'USD' | 'KHR';
  status: InvoiceStatus;
  pdfPath?: string;
  pdfUrl?: string | null;
  pdfError?: string | null;
  issuedAt: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export type OrderSource = 'guest' | 'customer' | 'manual' | 'bulk';

export type OrderCardStatus = 'active' | 'frozen' | 'closed';

export type CardDesign =
  | 'classic_black'
  | 'classic_white'
  | 'green_orange'
  | 'matte_silver'
  | 'gold_premium'
  | 'rose_gold'
  | 'custom';

export interface Order {
  id: string;
  cardId?: string;
  /** Human-readable ID e.g. ORD-1008 */
  orderNumber?: string;
  /** guest | customer | manual | bulk */
  orderSource?: OrderSource;
  ownerId?: string;
  ownerType?: 'guest' | 'customer' | 'manual' | 'staff';
  /** Sales release timestamp - required before printer can receive physical jobs */
  salesApprovedAt?: string;
  salesApprovedBy?: string;
  /** Sales placed order on hold - no printer queue until released */
  onHold?: boolean;
  salesHoldAt?: string;
  salesHoldBy?: string;
  /** 6-digit passcode for production QR / printer receive */
  productionPasscode?: string;
  // Customer info
  customerName: string;
  phone: string;
  telegram?: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  companyId?: string;
  jobTitle?: string;
  deliveryAddress?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingNote?: string;
  shippedAt?: string;
  // Order details
  productType: string;
  quantity: number;
  cardDesign: CardDesign;
  designArtworkUrl?: string;
  designArtworkPath?: string;
  designArtworkFileName?: string;
  cardCode: string;
  profileUrl: string;
  nfcEnabled?: boolean;
  nfcTargetUrl?: string;
  qrPrinted?: boolean;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  paymentProofPath?: string;
  paymentVerifiedBy?: string;
  paymentVerifiedAt?: string;
  paymentReviewNote?: string;
  manualVerificationStatus?: ManualVerificationStatus;
  paidAt?: string;
  invoiceId?: string;
  refundStatus?: OrderRefundStatus;
  refundedAmount?: number;
  refundedAt?: string;
  paymentMethod?: string;
  /** Order total in `currency` (USD or KHR riel). */
  amount?: number;
  currency?: 'USD' | 'KHR';
  /** digital = e-card; physical = NFC print + ship */
  fulfillment?: 'digital' | 'physical';
  /** Sales rep commission for payout tracking */
  salesCommission?: number;
  salesCommissionCurrency?: 'USD' | 'KHR';
  /** Set when commission is added to a pending payout after delivery */
  commissionAccruedAt?: string;
  depositAmount?: number;
  dueDate?: string;
  priority?: 'standard' | 'urgent';
  notes?: string;
  cardStatus?: OrderCardStatus;
  freezeReason?: string;
  frozenAt?: string;
  frozenBy?: string;
  closedAt?: string;
  closedBy?: string;
  // Workflow
  status: OrderStatus;
  batchId?: string;
  branch?: string;
  assignedSalesman: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Production batch

export type ProductionBatchStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  material: string;
  printerType: string;
  status: ProductionBatchStatus;
  orderIds: string[];
  companyId?: string;
  branch: string;
  activeOperatorId?: string;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Printer Job

export type PrinterJobStage =
  | 'received'
  | 'printing'
  | 'nfc_encoding'
  | 'quality_check'
  | 'ready_to_ship'
  | 'completed'
  | 'failed'
  | 'reprint';

export interface PrinterJob {
  id: string;
  orderId: string;
  cardId?: string;
  batchId?: string;
  companyId?: string;
  branch?: string;
  printerId: string;
  queueNumber: number;
  stage: PrinterJobStage;
  cardsPrinted: number;
  failedCards: number;
  reprintedCards: number;
  failedCardsApproved: boolean;
  perCardBonus: number;
  perOrderBonus: number;
  salaryStatus: 'unpaid' | 'paid';
  notes?: string;
  qaVideoUrl?: string;
  isReprint?: boolean;
  reprintOfJobId?: string;
  createdAt: string;
  updatedAt: string;
}

// QA / shipping / audit

export type QaDecision = 'pass' | 'fail';

export interface ReprintRecord {
  id: string;
  orderId: string;
  originalJobId: string;
  newJobId: string;
  batchId?: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: 'order' | 'batch' | 'printer_job' | 'user' | 'shipping' | 'qa' | 'reprint';
  entityId: string;
  actorId: string;
  actorRole?: UserRole;
  companyId?: string;
  branch?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export type PrinterHealthStatus = 'online' | 'degraded' | 'offline' | 'unknown';

export interface PrinterHealthRecord {
  id: string;
  printerId: string;
  printerName: string;
  branch: string;
  status: PrinterHealthStatus;
  lastSeenAt: string;
  jobsToday: number;
  failureRate: number;
  notes?: string;
  updatedAt: string;
}

export interface ProductionStatsSnapshot {
  cardsToday: number;
  batchesActive: number;
  ordersInProduction: number;
  jobsInQueue: number;
  qaPending: number;
  qaPassRate: number;
  readyToShip: number;
  shippedToday: number;
  reprintsToday: number;
  capturedAt: string;
}

// NFC Card (chip stores URL only; profile data lives in Firebase)

/** Lifecycle on the card registry - separate from printer write steps. */
export type NfcCardLifecycleStatus =
  | 'blank'
  | 'assigned'
  | 'encoded'
  | 'active'
  | 'disabled';

export type NfcStatus =
  | 'not_written'
  | 'writing'
  | 'written'
  | 'verified'
  | 'failed'
  | 'rewrite_needed'
  | 'disabled';

export interface NfcCard {
  id: string;
  /** Same as document id / URL segment after /c/ */
  cardId: string;
  chipUID: string;
  /** Short URL encoded on the NFC chip - no PII on the tag */
  profileUrl: string;
  orderId: string;
  cardCode: string;
  ownerUserId?: string;
  profileId?: string;
  status?: NfcCardLifecycleStatus;
  writtenBy: string;
  writtenAt: string;
  verificationStatus: NfcStatus;
  updatedAt: string;
}

// Profile (hosted data; editable without rewriting the chip)

export interface Profile {
  profileId: string;
  ownerUserId: string;
  publicSlug: string;
  name: string;
  phone?: string;
  email?: string;
  tagline?: string;
  photoUrl?: string;
  whatsapp?: string;
  instagram?: string;
  telegram?: string;
  links: { label: string; url: string }[];
  theme: BioTheme;
  isPublished: boolean;
  views?: number;
  taps?: number;
  updatedAt: string;
}

export type TapEventSource = 'nfc_card' | 'slug' | 'view' | 'interaction';

export interface TapEvent {
  id: string;
  cardId?: string;
  profileId: string;
  device?: string;
  country?: string;
  source: TapEventSource;
  createdAt: string;
}

// Salary

export interface SalaryRecord {
  id: string;
  printerId: string;
  printerName: string;
  period: string;
  baseSalary: number;
  totalCards: number;
  failedCards: number;
  approvedFailedCards: number;
  perCardBonus: number;
  qualityBonus: number;
  total: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
}

// Legacy / kept for bio pages

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  periodLabel: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

// Bio Page

export type BioTheme = 'vibrant_pink' | 'tech_noir' | 'editorial' | 'ocean_wave';

export interface BioPage {
  id: string;
  userId: string;
  ownerUid?: string;
  slug: string;
  publicSlug?: string;
  status?: 'trial' | 'active' | 'expired';
  trialStartedAt?: string;
  trialEndsAt?: string;
  displayName: string;
  tagline?: string;
  photoUrl?: string;
  whatsapp?: string;
  instagram?: string;
  telegram?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  customLinks: { label: string; url: string }[];
  /** Channel ids hidden on the public profile (stored on bio_pages - no separate collection). */
  hiddenChannels?: string[];
  theme: BioTheme;
  views?: number;
  taps?: number;
  updatedAt: string;
}

export type ProfileTheme = 'aqua' | 'mono';

export type TypographyColorKey =
  | 'deep_teal'
  | 'ocean_blue'
  | 'forest'
  | 'slate'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'charcoal'
  | 'midnight';

export interface UiPreferences {
  language: string;
  theme: BioTheme;
  profileTheme: ProfileTheme;
  colorMode: 'light' | 'dark' | 'system';
  typographyColor: TypographyColorKey;
}

// Notifications

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
}

/** Roles that operate production floor equipment. */
export const PRINTER_OPERATOR_ROLES: UserRole[] = ['printer', 'printer_operator'];

export function isPrinterOperatorRole(role: UserRole | undefined) {
  return role !== undefined && PRINTER_OPERATOR_ROLES.includes(role);
}

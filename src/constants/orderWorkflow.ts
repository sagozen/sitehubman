/**
 * Order Workflow — single source of truth for the 14-step pipeline
 * and role-based permissions. Used by every screen that shows order
 * status, action buttons, or progress indicators.
 *
 * Why a central module?
 *  - One place to add/remove/rename a step
 *  - One place to declare "who can do what"
 *  - Every UI surface (customer, sales, printer, QA, shipping, finance)
 *    derives its actions and labels from the same definitions.
 */
import type { Order, OrderStatus, PrinterJobStage, UserRole } from '@/src/types/models';

// ─── Workflow steps ──────────────────────────────────────────────────────────

export type WorkflowStepId =
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
  | 'delivered';

export type StepRole = 'customer' | 'sales' | 'printer' | 'qa_inspector' | 'shipping' | 'finance' | 'system';

export type WorkflowStep = {
  id: WorkflowStepId;
  /** Numeric position in the pipeline (1..14). */
  index: number;
  /** Human label, used in timelines and action bar. */
  label: string;
  /** Short label for compact UIs. */
  short: string;
  /** SF Symbol name from AppIcon, used in step bars. */
  icon: 'PenLine' | 'CreditCard' | 'Eye' | 'BadgeCheck' | 'Printer' | 'Nfc' | 'Shield' | 'Package' | 'Truck' | 'Check';
  /** Which role owns this step's primary action. */
  owner: StepRole;
  /** Soft accent color token, used to tint the icon tile. */
  accent: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
};

/**
 * The 14-step pipeline in strict order. The order here is the source of
 * truth — every other file that visualizes progress (customer timeline,
 * sales pipeline, printer step bar, QA queue) must use this array.
 */
export const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  { id: 'draft',               index:  1, label: 'Order drafted',         short: 'Draft',     icon: 'PenLine',    owner: 'customer', accent: 'blue'   },
  { id: 'pending_payment',     index:  2, label: 'Awaiting payment',      short: 'Payment',   icon: 'CreditCard', owner: 'customer', accent: 'orange' },
  { id: 'payment_submitted',   index:  3, label: 'Payment submitted',     short: 'Review',    icon: 'Eye',        owner: 'sales',    accent: 'orange' },
  { id: 'payment_verified',    index:  4, label: 'Payment verified',      short: 'Verified',  icon: 'BadgeCheck', owner: 'sales',    accent: 'green'  },
  { id: 'production_approved', index:  5, label: 'Production approved',   short: 'Approved',  icon: 'BadgeCheck', owner: 'sales',    accent: 'green'  },
  { id: 'printer_assigned',    index:  6, label: 'Printer assigned',      short: 'Printer',   icon: 'Printer',    owner: 'sales',    accent: 'purple' },
  { id: 'printing',            index:  7, label: 'Printing',              short: 'Print',     icon: 'Printer',    owner: 'printer',  accent: 'purple' },
  { id: 'nfc_writing',         index:  8, label: 'Writing NFC',           short: 'NFC',       icon: 'Nfc',        owner: 'printer',  accent: 'purple' },
  { id: 'nfc_verification',    index:  9, label: 'Verifying NFC',         short: 'Verify',    icon: 'Nfc',        owner: 'printer',  accent: 'purple' },
  { id: 'qa_pending',          index: 10, label: 'QA check',              short: 'QA',        icon: 'Shield',     owner: 'qa_inspector', accent: 'teal'   },
  { id: 'ready_to_ship',       index: 11, label: 'Ready to ship',         short: 'Pack',      icon: 'Package',    owner: 'shipping', accent: 'teal'   },
  { id: 'shipped',             index: 12, label: 'Shipped',               short: 'Ship',      icon: 'Truck',      owner: 'shipping', accent: 'teal'   },
  { id: 'delivered',           index: 13, label: 'Delivered',             short: 'Done',      icon: 'Check',      owner: 'system',   accent: 'green'  },
] as const;

export const FAILED_STATUSES: Record<'payment_rejected' | 'qa_failed' | 'cancelled', string> = {
  payment_rejected: 'Payment rejected',
  qa_failed:        'QA failed — reprint',
  cancelled:        'Order cancelled',
};

export const ALL_ORDER_STATUSES: readonly OrderStatus[] = [
  'draft',
  'pending_payment',
  'payment_submitted',
  'payment_verified',
  'production_approved',
  'printer_assigned',
  'printing',
  'nfc_writing',
  'nfc_verification',
  'qa_pending',
  'ready_to_ship',
  'shipped',
  'delivered',
  'payment_rejected',
  'qa_failed',
  'cancelled',
] as const;

// ─── Status → step lookup ────────────────────────────────────────────────────

/** Find the canonical workflow step for any order status (failed statuses map to the last active step). */
export function statusToStep(status: OrderStatus): WorkflowStep {
  const step = WORKFLOW_STEPS.find((s) => s.id === status);
  if (step) return step;
  // Failed states map to the nearest active step so the timeline still renders usefully.
  if (status === 'payment_rejected') return WORKFLOW_STEPS[1]; // pending_payment
  if (status === 'qa_failed')        return WORKFLOW_STEPS[8]; // nfc_verification (last step the printer owned)
  if (status === 'cancelled')        return WORKFLOW_STEPS[0];
  return WORKFLOW_STEPS[0];
}

/** Index (0-based) of the current step in the pipeline. */
export function statusIndex(status: OrderStatus): number {
  return statusToStep(status).index - 1;
}

/** Whether the order is in a failure state. */
export function isFailedStatus(status: OrderStatus): boolean {
  return status === 'payment_rejected' || status === 'qa_failed' || status === 'cancelled';
}

/** Whether the order has reached the end of the pipeline. */
export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}

// ─── Role permissions ─────────────────────────────────────────────────────────

export type ActionId =
  | 'edit_profile'
  | 'place_order'
  | 'submit_payment'
  | 'verify_payment'
  | 'reject_payment'
  | 'approve_production'
  | 'hold_order'
  | 'assign_printer'
  | 'unassign_printer'
  | 'accept_job'
  | 'mark_printing'
  | 'mark_printed'
  | 'write_nfc'
  | 'verify_nfc'
  | 'submit_to_qa'
  | 'pass_qa'
  | 'fail_qa'
  | 'mark_ready_to_ship'
  | 'pack_order'
  | 'mark_shipped'
  | 'mark_delivered'
  | 'view_finance';

/**
 * Centralised permission matrix: who can perform which action.
 * UI hides buttons for actions the current role cannot perform.
 * Services throw on actions not granted to the actor's role.
 */
const ROLE_ACTIONS: Record<UserRole, ReadonlySet<ActionId>> = {
  customer: new Set<ActionId>([
    'edit_profile',
    'place_order',
    'submit_payment',
  ]),
  sales: new Set<ActionId>([
    'verify_payment',
    'reject_payment',
    'approve_production',
    'hold_order',
    'assign_printer',
    'unassign_printer',
  ]),
  agent: new Set<ActionId>([
    'verify_payment',
    'reject_payment',
    'approve_production',
    'hold_order',
  ]),
  printer: new Set<ActionId>([
    'accept_job',
    'mark_printing',
    'mark_printed',
    'write_nfc',
    'verify_nfc',
    'submit_to_qa',
  ]),
  printer_operator: new Set<ActionId>([
    'accept_job',
    'mark_printing',
    'mark_printed',
    'write_nfc',
    'verify_nfc',
    'submit_to_qa',
  ]),
  qa_inspector: new Set<ActionId>([
    'pass_qa',
    'fail_qa',
  ]),
  shipping: new Set<ActionId>([
    'mark_ready_to_ship',
    'pack_order',
    'mark_shipped',
    'mark_delivered',
  ]),
  finance: new Set<ActionId>([
    'view_finance',
  ]),
  admin: new Set<ActionId>([
    'edit_profile',
    'place_order',
    'submit_payment',
    'verify_payment',
    'reject_payment',
    'approve_production',
    'hold_order',
    'assign_printer',
    'unassign_printer',
    'accept_job',
    'mark_printing',
    'mark_printed',
    'write_nfc',
    'verify_nfc',
    'submit_to_qa',
    'pass_qa',
    'fail_qa',
    'mark_ready_to_ship',
    'pack_order',
    'mark_shipped',
    'mark_delivered',
    'view_finance',
  ]),
  super_admin: new Set<ActionId>([
    'edit_profile',
    'place_order',
    'submit_payment',
    'verify_payment',
    'reject_payment',
    'approve_production',
    'hold_order',
    'assign_printer',
    'unassign_printer',
    'accept_job',
    'mark_printing',
    'mark_printed',
    'write_nfc',
    'verify_nfc',
    'submit_to_qa',
    'pass_qa',
    'fail_qa',
    'mark_ready_to_ship',
    'pack_order',
    'mark_shipped',
    'mark_delivered',
    'view_finance',
  ]),
  guest: new Set<ActionId>([]),
};

/** Can this role perform this action? Admins can always. */
export function canPerform(role: UserRole, action: ActionId): boolean {
  return ROLE_ACTIONS[role]?.has(action) ?? false;
}

/**
 * Returns the set of action IDs that this role is allowed to perform
 * for the current order status. Each status has a fixed list of legal
 * transitions; we filter that by the role's permissions.
 */
export function availableActions(role: UserRole, order: Order): ActionId[] {
  const allowed = new Set<ActionId>();
  const status = order.status;

  // ── Customer actions
  if (status === 'draft')              allowed.add('place_order');
  if (status === 'pending_payment')    allowed.add('submit_payment');

  // ── Sales actions
  if (status === 'payment_submitted') {
    allowed.add('verify_payment');
    allowed.add('reject_payment');
    allowed.add('hold_order');
  }
  if (status === 'payment_verified') {
    allowed.add('approve_production');
    allowed.add('hold_order');
  }
  if (status === 'production_approved') {
    allowed.add('assign_printer');
    allowed.add('hold_order');
  }
  if (status === 'printer_assigned')   allowed.add('unassign_printer');

  // ── Printer actions
  if (status === 'printer_assigned')   allowed.add('accept_job');
  if (status === 'printing')           allowed.add('mark_printed');
  if (status === 'nfc_writing')        allowed.add('write_nfc');
  if (status === 'nfc_verification')   allowed.add('verify_nfc');
  if (status === 'nfc_verification')   allowed.add('submit_to_qa');

  // ── QA actions
  if (status === 'qa_pending') {
    allowed.add('pass_qa');
    allowed.add('fail_qa');
  }

  // ── Shipping actions
  if (status === 'ready_to_ship')      allowed.add('pack_order');
  if (status === 'ready_to_ship')      allowed.add('mark_shipped');
  if (status === 'shipped')            allowed.add('mark_delivered');

  return Array.from(allowed).filter((a) => canPerform(role, a));
}

// ─── Action metadata (label, icon, color) for the action bar ──────────────────

export type ActionMeta = {
  id: ActionId;
  label: string;
  icon: 'Check' | 'X' | 'Printer' | 'Nfc' | 'Shield' | 'Truck' | 'Package' | 'PenLine' | 'CreditCard' | 'BadgeCheck' | 'Eye' | 'Pause' | 'Play' | 'RotateCcw';
  variant: 'primary' | 'secondary' | 'destructive';
  confirm?: boolean;
};

const ACTION_META: Record<ActionId, ActionMeta> = {
  edit_profile:       { id: 'edit_profile',       label: 'Edit profile',    icon: 'PenLine',     variant: 'secondary' },
  place_order:        { id: 'place_order',        label: 'Place order',     icon: 'PenLine',     variant: 'primary' },
  submit_payment:     { id: 'submit_payment',     label: 'Submit payment',  icon: 'CreditCard',  variant: 'primary' },
  verify_payment:     { id: 'verify_payment',     label: 'Verify payment',  icon: 'BadgeCheck',  variant: 'primary' },
  reject_payment:     { id: 'reject_payment',     label: 'Reject payment',  icon: 'X',           variant: 'destructive', confirm: true },
  approve_production: { id: 'approve_production', label: 'Approve production', icon: 'BadgeCheck', variant: 'primary' },
  hold_order:         { id: 'hold_order',         label: 'Hold order',      icon: 'Pause',       variant: 'destructive', confirm: true },
  assign_printer:     { id: 'assign_printer',     label: 'Assign printer',  icon: 'Printer',     variant: 'primary' },
  unassign_printer:   { id: 'unassign_printer',   label: 'Reassign',        icon: 'RotateCcw',   variant: 'secondary' },
  accept_job:         { id: 'accept_job',         label: 'Accept job',      icon: 'Play',        variant: 'primary' },
  mark_printing:      { id: 'mark_printing',      label: 'Start printing',  icon: 'Printer',     variant: 'primary' },
  mark_printed:       { id: 'mark_printed',       label: 'Mark printed',    icon: 'Check',       variant: 'primary' },
  write_nfc:          { id: 'write_nfc',          label: 'Write NFC',       icon: 'Nfc',         variant: 'primary' },
  verify_nfc:         { id: 'verify_nfc',         label: 'Verify NFC',      icon: 'Eye',         variant: 'primary' },
  submit_to_qa:       { id: 'submit_to_qa',       label: 'Submit to QA',    icon: 'Shield',      variant: 'primary' },
  pass_qa:            { id: 'pass_qa',            label: 'Pass QA',         icon: 'BadgeCheck',  variant: 'primary' },
  fail_qa:            { id: 'fail_qa',            label: 'Fail QA',         icon: 'X',           variant: 'destructive', confirm: true },
  mark_ready_to_ship: { id: 'mark_ready_to_ship', label: 'Ready to ship',   icon: 'Package',     variant: 'primary' },
  pack_order:         { id: 'pack_order',         label: 'Pack order',      icon: 'Package',     variant: 'secondary' },
  mark_shipped:       { id: 'mark_shipped',       label: 'Mark shipped',    icon: 'Truck',       variant: 'primary' },
  mark_delivered:     { id: 'mark_delivered',     label: 'Mark delivered',  icon: 'Check',       variant: 'primary' },
  view_finance:       { id: 'view_finance',       label: 'Finance',         icon: 'BadgeCheck',  variant: 'secondary' },
};

export function getActionMeta(action: ActionId): ActionMeta {
  return ACTION_META[action];
}

// ─── Adapter: PrinterJob stage → Order status ────────────────────────────────
/**
 * Map a PrinterJob stage to the equivalent Order status. Used so we can
 * pass a single shape to the workflow timeline component regardless of
 * whether the caller has an Order or a PrinterJob.
 */
export function printerStageToOrderStatus(stage: PrinterJobStage): OrderStatus {
  switch (stage) {
    case 'received':      return 'printer_assigned';
    case 'printing':      return 'printing';
    case 'nfc_encoding':  return 'nfc_writing';
    case 'quality_check': return 'qa_pending';
    case 'ready_to_ship': return 'ready_to_ship';
    case 'completed':     return 'delivered';
    case 'reprint':       return 'printing';
    case 'failed':        return 'qa_failed';
    default:              return 'printer_assigned';
  }
}

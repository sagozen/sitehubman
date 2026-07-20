/**
 * OrderWorkflowTimeline — single source of truth for visualising an order's
 * position in the 14-step pipeline. Used by customer home, sales order
 * detail, printer job screen, QA queue, shipping list.
 *
 * Three layouts:
 *  - 'compact'  — horizontal pill stepper (used in list rows)
 *  - 'step'      — Apple-Settings-style vertical list (used in detail view)
 *  - 'minimal'   — single-line progress bar (used in cards)
 */
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  WORKFLOW_STEPS,
  isFailedStatus,
  printerStageToOrderStatus,
  statusIndex,
  type WorkflowStep,
  type WorkflowStepId,
} from '@/src/constants/orderWorkflow';
import type { Order, OrderStatus, PrinterJob, PrinterJobStage } from '@/src/types/models';

type Layout = 'compact' | 'step' | 'minimal';

type Props = {
  order?: Order;
  job?: PrinterJob;
  /** Override the resolved status (useful when you have a PrinterJob but want to show a different Order status). */
  statusOverride?: OrderStatus;
  layout?: Layout;
  /** Show the full 14 steps instead of an abbreviated flow. */
  full?: boolean;
  /** Tint the timeline by step owner accent (default true). */
  tinted?: boolean;
  /**
   * Optional explicit step list for the compact view. When provided, the
   * timeline shows only these steps in this order — the caller picks the
   * steps that are meaningful for the surface (e.g. a printer doesn't need
   * to see "shipped" or "delivered" details). When omitted, the compact
   * view auto-picks a reasonable subset based on status.
   */
  compactSteps?: readonly WorkflowStepId[];
  /** Override the short label shown in the compact pill for a specific step. */
  compactLabels?: Partial<Record<WorkflowStepId, string>>;
};

const TINT_BG: Record<WorkflowStep['accent'], string> = {
  blue:   'rgba(0,122,255,0.14)',
  green:  'rgba(52,199,89,0.14)',
  orange: 'rgba(255,149,0,0.14)',
  purple: 'rgba(88,86,214,0.14)',
  red:    'rgba(255,59,48,0.14)',
  teal:   'rgba(90,200,210,0.18)',
};

const TINT_FG: Record<WorkflowStep['accent'], string> = {
  blue:   '#007AFF',
  green:  '#34C759',
  orange: '#FF9500',
  purple: '#5856D6',
  red:    '#FF3B30',
  teal:   '#0BAEB6',
};

const MUTED_FG = '#8E8E93';
const RAIL = 'rgba(60,60,67,0.14)';
const SUCCESS = '#34C759';
const HAIRLINE = 'rgba(60,60,67,0.10)';
const SURFACE = '#FFFFFF';

export const OrderWorkflowTimeline = memo(function OrderWorkflowTimeline({
  order,
  job,
  statusOverride,
  layout = 'step',
  full = false,
  tinted = true,
  compactSteps,
  compactLabels,
}: Props) {
  const resolvedStatus: OrderStatus = useMemo(() => {
    if (statusOverride) return statusOverride;
    if (order) return order.status;
    if (job) return printerStageToOrderStatus(job.stage);
    return 'draft';
  }, [statusOverride, order, job]);

  const steps = useMemo(() => {
    if (layout === 'compact' && compactSteps && compactSteps.length > 0) {
      // Caller wants a specific subset. Map the IDs to WorkflowStep objects
      // and let the currentIdx resolution work against the parent index space
      // so "done / active" still reflects the order's true position in the
      // 14-step pipeline (not the position in the compact subset).
      return compactSteps
        .map((id) => WORKFLOW_STEPS.find((s) => s.id === id))
        .filter((s): s is WorkflowStep => s !== undefined);
    }
    if (full) return WORKFLOW_STEPS;
    if (layout === 'compact') {
      // Default compact fallback: 7 production steps. Most surfaces will pass
      // their own `compactSteps` to trim this to what the role cares about.
      return WORKFLOW_STEPS.filter((s) =>
        ['printer_assigned', 'printing', 'nfc_writing', 'qa_pending', 'ready_to_ship', 'shipped', 'delivered'].includes(s.id),
      );
    }
    return WORKFLOW_STEPS;
  }, [compactSteps, full, layout]);

  const currentIdx = statusIndex(resolvedStatus);
  const failed = isFailedStatus(resolvedStatus);
  const orderForView: Order = useMemo(() => {
    if (order) return order;
    return {
      id: job?.id ?? 'job',
      status: resolvedStatus,
      customerName: job?.id ?? '',
      phone: '',
      paymentStatus: 'paid' as Order['paymentStatus'],
      productType: 'classic_black',
      cardDesign: 'classic_black',
      quantity: 1,
      cardCode: '',
      profileUrl: '',
      assignedSalesman: '',
      createdBy: '',
      createdAt: job?.createdAt ?? new Date().toISOString(),
      updatedAt: job?.updatedAt ?? new Date().toISOString(),
    };
  }, [order, job, resolvedStatus]);

  if (layout === 'minimal') {
    return <MinimalTimeline steps={steps} currentIdx={currentIdx} failed={failed} order={orderForView} />;
  }
  if (layout === 'compact') {
    return <CompactTimeline steps={steps} currentIdx={currentIdx} failed={failed} tinted={tinted} labels={compactLabels} />;
  }
  return <StepTimeline steps={steps} currentIdx={currentIdx} failed={failed} order={orderForView} />;
});

// ─── Vertical step list (Apple-Settings-style, used in detail view) ──────────
function StepTimeline({
  steps,
  currentIdx,
  failed,
  order,
}: {
  steps: readonly WorkflowStep[];
  currentIdx: number;
  failed: boolean;
  order: Order;
}) {
  return (
    <View style={sl.wrap}>
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx && !failed;
        const failedStep = i === currentIdx && failed;
        const isLast = i === steps.length - 1;
        const dotColor = failedStep ? '#FF3B30' : done ? SUCCESS : active ? TINT_FG[step.accent] : RAIL;
        const dotBg = failedStep ? 'rgba(255,59,48,0.12)' : done ? 'rgba(52,199,89,0.16)' : active ? TINT_BG[step.accent] : '#F2F2F7';
        return (
          <View key={step.id} style={sl.row}>
            <View style={sl.gutter}>
              <View style={[sl.dot, { backgroundColor: dotBg, borderColor: dotColor }]}>
                {done ? (
                  <AppIcon name="Check" size={10} color={SUCCESS} />
                ) : active ? (
                  <View style={[sl.pulse, { backgroundColor: TINT_FG[step.accent] }]} />
                ) : failedStep ? (
                  <AppIcon name="X" size={10} color="#FF3B30" />
                ) : null}
              </View>
              {!isLast ? <View style={[sl.line, done && { backgroundColor: SUCCESS }]} /> : null}
            </View>
            <View style={[sl.copy, isLast && sl.copyLast]}>
              <AppText style={[sl.title, active && { color: TINT_FG[step.accent] }, failedStep && { color: '#FF3B30' }]}>
                {failedStep ? failureLabel(order.status) : step.label}
              </AppText>
              <AppText style={sl.sub}>
                {active
                  ? 'In progress'
                  : done
                    ? 'Complete'
                    : failedStep
                      ? 'Action needed'
                      : 'Pending'}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const sl = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  gutter: { alignItems: 'center', width: 18, paddingTop: 4 },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 2, flex: 1, minHeight: 28, backgroundColor: RAIL, marginTop: 4 },
  copy: { flex: 1, paddingBottom: 16, gap: 2 },
  copyLast: { paddingBottom: 4 },
  title: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  sub: { fontSize: 11, fontWeight: '500', color: MUTED_FG },
});

function failureLabel(status: OrderStatus): string {
  switch (status) {
    case 'payment_rejected': return 'Payment rejected';
    case 'qa_failed':        return 'QA failed — reprint';
    case 'cancelled':        return 'Order cancelled';
    default:                 return 'Failed';
  }
}

// ─── Compact horizontal pill stepper (used in list rows) ─────────────────────
function CompactTimeline({
  steps,
  currentIdx,
  failed,
  tinted,
  labels,
}: {
  steps: readonly WorkflowStep[];
  currentIdx: number;
  failed: boolean;
  tinted: boolean;
  labels?: Partial<Record<WorkflowStepId, string>>;
}) {
  return (
    <View style={ct.wrap}>
      {steps.map((step, i) => {
        // currentIdx is in the 14-step space, not the compact-subset space.
        // Compute "done / active" against the canonical step index.
        const canonicalIdx = statusIndex(step.id as OrderStatus);
        const done = canonicalIdx < currentIdx;
        const active = canonicalIdx === currentIdx && !failed;
        const failedStep = canonicalIdx === currentIdx && failed;
        const color = failedStep
          ? '#FF3B30'
          : done
            ? SUCCESS
            : active
              ? TINT_FG[step.accent]
              : MUTED_FG;
        const bg = tinted
          ? (active ? TINT_BG[step.accent] : 'transparent')
          : 'transparent';
        const label = labels?.[step.id as WorkflowStepId] ?? step.short;
        return (
          <View key={step.id} style={ct.item}>
            <View style={[ct.pill, { backgroundColor: bg }]}>
              <AppIcon name={step.icon} size={11} color={color} />
              <AppText style={[ct.text, { color }]} numberOfLines={1}>
                {label}
              </AppText>
            </View>
            {i < steps.length - 1 ? (
              <View style={[ct.bar, done && { backgroundColor: SUCCESS }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const ct = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, rowGap: 6 },
  item: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999,
  },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  bar: { width: 10, height: 1.5, backgroundColor: RAIL, marginHorizontal: 2 },
});

// ─── Minimal single-line progress bar (used in cards) ────────────────────────
function MinimalTimeline({
  steps,
  currentIdx,
  failed,
  order,
}: {
  steps: readonly WorkflowStep[];
  currentIdx: number;
  failed: boolean;
  order: Order;
}) {
  const total = steps.length;
  const progress = failed
    ? Math.max(0, Math.min(1, currentIdx / total))
    : Math.min(1, (currentIdx + 1) / total);
  return (
    <View style={mt.wrap}>
      <View style={mt.row}>
        <AppText style={mt.title} numberOfLines={1}>
          {failed ? failureLabel(order.status) : steps[currentIdx]?.label ?? '—'}
        </AppText>
        <AppText style={mt.percent}>
          {Math.round(progress * 100)}%
        </AppText>
      </View>
      <View style={mt.track}>
        <View
          style={[
            mt.fill,
            { width: `${progress * 100}%`, backgroundColor: failed ? '#FF3B30' : SUCCESS },
          ]}
        />
      </View>
    </View>
  );
}

const mt = StyleSheet.create({
  wrap: { gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 12, fontWeight: '600', color: '#1C1C1E' },
  percent: { fontSize: 11, fontWeight: '700', color: MUTED_FG, letterSpacing: 0.2 },
  track: { height: 3, backgroundColor: RAIL, borderRadius: 1.5, overflow: 'hidden' },
  fill: { height: '100%' },
});

export const __testOrderWorkflowTokens = { TINT_BG, TINT_FG, MUTED_FG, RAIL, SUCCESS, HAIRLINE, SURFACE };

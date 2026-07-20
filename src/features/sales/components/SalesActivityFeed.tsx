/**
 * SalesActivityFeed — compact timeline of recent order status changes.
 * Renders the last N orders sorted by updatedAt descending,
 * each with a status dot, customer name, and elapsed time.
 */
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { salesUi } from './SalesScreenUi';
import type { Order } from '@/src/types/models';
import type { AppIconName } from '@/src/components/AppIcon';

// ─── Status config ────────────────────────────────────────────────────────────

type StatusConfig = {
  label: string;
  icon: AppIconName;
  color: string;
  bg: string;
};

// Simplified 8-step labels — legacy statuses mapped to nearest step
const STATUS_CONFIG: Partial<Record<Order['status'], StatusConfig>> = {
  // ── Active flow ────────────────────────────────────────────────────────────
  pending_payment:     { label: 'Awaiting Approval', icon: 'Clock',       color: salesUi.accent,  bg: salesUi.orangeSoft },
  production_approved: { label: 'Sales Approved',    icon: 'CheckCircle', color: salesUi.green,   bg: salesUi.greenSoft  },
  printer_assigned:    { label: 'Printer Queue',     icon: 'Printer',     color: salesUi.blue,    bg: salesUi.blueSoft   },
  printing:            { label: 'Printing',          icon: 'Printer',     color: salesUi.purple,  bg: salesUi.purpleSoft },
  nfc_writing:         { label: 'NFC Write',         icon: 'Nfc',         color: salesUi.purple,  bg: salesUi.purpleSoft },
  qa_pending:          { label: 'QA Check',          icon: 'Eye',         color: salesUi.blue,    bg: salesUi.blueSoft   },
  ready_to_ship:       { label: 'Ready to Ship',     icon: 'Package',     color: salesUi.green,   bg: salesUi.greenSoft  },
  shipped:             { label: 'Shipped',           icon: 'Truck',       color: salesUi.green,   bg: salesUi.greenSoft  },
  delivered:           { label: 'Delivered',         icon: 'CheckCircle', color: salesUi.green,   bg: salesUi.greenSoft  },
  // ── Legacy / failure ───────────────────────────────────────────────────────
  draft:               { label: 'Draft',             icon: 'FileText',    color: salesUi.muted,   bg: salesUi.bg         },
  payment_submitted:   { label: 'Awaiting Approval', icon: 'Clock',       color: salesUi.accent,  bg: salesUi.orangeSoft },
  payment_verified:    { label: 'Sales Approved',    icon: 'CheckCircle', color: salesUi.green,   bg: salesUi.greenSoft  },
  nfc_verification:    { label: 'NFC Write',         icon: 'Nfc',         color: salesUi.purple,  bg: salesUi.purpleSoft },
  payment_rejected:    { label: 'Pay Rejected',      icon: 'XCircle',     color: salesUi.red,     bg: salesUi.redSoft    },
  qa_failed:           { label: 'QA Failed',         icon: 'AlertCircle', color: salesUi.red,     bg: salesUi.redSoft    },
  cancelled:           { label: 'Cancelled',         icon: 'X',           color: salesUi.red,     bg: salesUi.redSoft    },
};

function fallbackConfig(status: string): StatusConfig {
  return { label: status.replace(/_/g, ' '), icon: 'Circle', color: salesUi.muted, bg: salesUi.bg };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  orders: Order[];
  max?: number;
};

export function SalesActivityFeed({ orders, max = 6 }: Props) {
  const recent = [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, max);

  if (recent.length === 0) return null;

  return (
    <View style={feed.wrap}>
      {recent.map((order, index) => {
        const cfg = STATUS_CONFIG[order.status] ?? fallbackConfig(order.status);
        const isLast = index === recent.length - 1;
        return (
          <View key={order.id} style={[feed.row, isLast && feed.rowLast]}>
            {/* Timeline connector */}
            <View style={feed.lineCol}>
              <View style={[feed.dot, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                <AppIcon name={cfg.icon} size={9} color={cfg.color} />
              </View>
              {!isLast ? <View style={feed.line} /> : null}
            </View>

            {/* Content */}
            <View style={feed.content}>
              <View style={feed.contentRow}>
                <AppText style={feed.name} numberOfLines={1}>
                  {order.customerName}
                </AppText>
                <AppText style={feed.time}>{timeAgo(order.updatedAt)}</AppText>
              </View>
              <View style={feed.statusRow}>
                <View style={[feed.statusPill, { backgroundColor: cfg.bg }]}>
                  <AppText style={[feed.statusText, { color: cfg.color }]}>
                    {cfg.label}
                  </AppText>
                </View>
                <AppText style={feed.orderId} numberOfLines={1}>
                  {order.orderNumber ?? `#${order.id.slice(0, 6).toUpperCase()}`}
                </AppText>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const feed = StyleSheet.create({
  wrap: {
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    ...salesUi.shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 0,
  },
  rowLast: {},

  // Timeline column
  lineCol: {
    alignItems: 'center',
    width: 22,
    paddingTop: 14,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 1.5,
    flex: 1,
    minHeight: 12,
    backgroundColor: salesUi.border,
    marginVertical: 3,
  },

  // Content
  content: {
    flex: 1,
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: salesUi.text,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
    color: salesUi.muted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderId: {
    fontSize: 11,
    fontWeight: '600',
    color: salesUi.muted,
  },
});

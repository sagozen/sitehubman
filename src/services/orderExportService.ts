import type { Order } from '@/src/types/models';

function csvEscape(value: string | number | undefined | null): string {
  const raw = value == null ? '' : String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function ordersToCsv(orders: Order[]): string {
  const header = [
    'orderId',
    'orderNumber',
    'customerName',
    'phone',
    'productType',
    'quantity',
    'amount',
    'currency',
    'paymentStatus',
    'status',
    'branch',
    'assignedSalesman',
    'createdAt',
  ].join(',');

  const rows = orders.map((o) =>
    [
      o.id,
      o.orderNumber,
      o.customerName,
      o.phone,
      o.productType,
      o.quantity,
      o.amount,
      o.currency,
      o.paymentStatus,
      o.status,
      o.branch,
      o.assignedSalesman,
      o.createdAt,
    ]
      .map(csvEscape)
      .join(',')
  );

  return [header, ...rows].join('\n');
}

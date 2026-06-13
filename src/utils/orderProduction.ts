/** Production order ID, QR payload, and job passcode helpers. */

export type OrderSource = 'guest' | 'customer' | 'manual' | 'bulk';

export function generateOrderNumber(): string {
  const seq = 1000 + Math.floor(Math.random() * 9000);
  return `ORD-${seq}`;
}

export function generateProductionPasscode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function buildProductionQrPayload(orderNumber: string, passcode: string): string {
  return `sitehub://production?ord=${encodeURIComponent(orderNumber)}&pass=${passcode}`;
}

export function parseProductionScan(raw: string): { orderNumber?: string; passcode?: string; cardCode?: string } {
  const value = raw.trim();
  const urlMatch = value.match(/[?&]ord=([^&]+)/i);
  const passMatch = value.match(/[?&]pass=([^&]+)/i);
  if (urlMatch) {
    return {
      orderNumber: decodeURIComponent(urlMatch[1]).toUpperCase(),
      passcode: passMatch ? decodeURIComponent(passMatch[1]) : undefined,
    };
  }
  const labelledPassMatch = value.match(/^(ORD-\d{4,6}).*?(?:pass|passcode|code)\D*(\d{4,8})$/i);
  if (labelledPassMatch) {
    return {
      orderNumber: labelledPassMatch[1].toUpperCase(),
      passcode: labelledPassMatch[2],
    };
  }
  const ordWithPassMatch = value.match(/^(ORD-\d{4,6})(?:[\s:#-]+)(\d{4,8})$/i);
  if (ordWithPassMatch) {
    return {
      orderNumber: ordWithPassMatch[1].toUpperCase(),
      passcode: ordWithPassMatch[2],
    };
  }
  const ordMatch = value.match(/^ORD-\d{4,6}$/i);
  if (ordMatch) {
    return { orderNumber: ordMatch[0].toUpperCase() };
  }
  return { cardCode: value.replace(/^URL:/i, '').trim().toUpperCase() };
}

export function isPhysicalFulfillment(order: { fulfillment?: string; productType?: string }): boolean {
  return (
    order.fulfillment === 'physical' ||
    order.productType === 'physical_nfc' ||
    order.productType === 'wood_card' ||
    order.productType === 'metal_card' ||
    order.productType === 'pvc_card'
  );
}

export function needsSalesApproval(order: {
  fulfillment?: string;
  productType?: string;
  salesApprovedAt?: string;
  status?: string;
}): boolean {
  if (!isPhysicalFulfillment(order)) return false;
  if (order.salesApprovedAt) return false;
  return order.status === 'new' || order.status === 'design';
}

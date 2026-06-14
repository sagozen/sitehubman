import { buildProductionQrPayload } from '@/src/utils/orderProduction';
import type { Order, PrinterJob } from '@/src/types/models';

type BwipModule = typeof import('bwip-js');

let bwipModule: BwipModule | null | undefined;

async function loadBwip(): Promise<BwipModule | null> {
  if (bwipModule !== undefined) return bwipModule;
  try {
    bwipModule = await import('bwip-js');
    return bwipModule;
  } catch {
    bwipModule = null;
    return null;
  }
}

function fallbackBarcodeSvg(text: string) {
  const safe = escapeHtml(text);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="72" viewBox="0 0 240 72"><rect width="100%" height="100%" fill="#fff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="#111827">${safe}</text></svg>`;
}

function fallbackQrSvg(text: string) {
  const safe = escapeHtml(text.slice(0, 48));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="#fff" stroke="#111827"/><text x="8" y="60" font-family="monospace" font-size="9" fill="#111827">${safe}</text></svg>`;
}

export const PRODUCTION_LABEL_SIZE = {
  width: 288,
  height: 432,
} as const;

export interface ProductionLabelData {
  order: Order;
  job?: PrinterJob | null;
  orderCode: string;
  barcodeSvg: string;
  qrPayload: string;
  qrSvg: string;
  generatedAt: string;
}

function labelValue(value: string | undefined, fallback = 'N/A') {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function productionOrderCode(order: Order) {
  const idPart = order.id?.slice(0, 8).toUpperCase() || 'UNKNOWN';
  return labelValue(order.orderNumber, `ORD-${idPart}`).toUpperCase();
}

export function productionQrPayload(order: Order) {
  const orderCode = productionOrderCode(order);
  return order.productionPasscode
    ? buildProductionQrPayload(orderCode, order.productionPasscode)
    : orderCode;
}

export async function buildBarcodeSvg(text: string): Promise<string> {
  const bwip = await loadBwip();
  if (!bwip) return fallbackBarcodeSvg(text);

  try {
    return bwip.toSVG({
      bcid: 'code128',
      text,
      scale: 2,
      height: 14,
      includetext: true,
      textxalign: 'center',
      textsize: 9,
      paddingwidth: 0,
      paddingheight: 0,
      backgroundcolor: 'FFFFFF',
    });
  } catch {
    return fallbackBarcodeSvg(text);
  }
}

export async function buildQrSvg(text: string): Promise<string> {
  const bwip = await loadBwip();
  if (!bwip) return fallbackQrSvg(text);

  try {
    return bwip.toSVG({
      bcid: 'qrcode',
      text,
      scale: 3,
      paddingwidth: 0,
      paddingheight: 0,
      backgroundcolor: 'FFFFFF',
    });
  } catch {
    return fallbackQrSvg(text);
  }
}

export async function buildProductionLabelData(
  order: Order,
  job?: PrinterJob | null,
): Promise<ProductionLabelData> {
  const orderCode = productionOrderCode(order);
  const qrPayload = productionQrPayload(order);
  const [barcodeSvg, qrSvg] = await Promise.all([
    buildBarcodeSvg(orderCode),
    buildQrSvg(qrPayload),
  ]);

  return {
    order,
    job,
    orderCode,
    qrPayload,
    barcodeSvg,
    qrSvg,
    generatedAt: new Date().toISOString(),
  };
}

function productLabel(order: Order) {
  return order.productType.replace(/_/g, ' ').toUpperCase();
}

function cardDesignLabel(order: Order) {
  return order.cardDesign.replace(/_/g, ' ').toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buildProductionLabelHtml(label: ProductionLabelData) {
  const { order, job } = label;
  const stage = job?.stage ? job.stage.replace(/_/g, ' ').toUpperCase() : 'NOT RECEIVED';
  const priority = (order.priority ?? 'standard').toUpperCase();
  const passcode = labelValue(order.productionPasscode);
  const customer = labelValue(order.customerName);
  const phone = labelValue(order.phone);
  const branch = labelValue(order.branch, 'MAIN');
  const batch = labelValue(order.batchId, 'UNBATCHED');
  const address = labelValue(order.deliveryAddress, 'No delivery address');
  const targetUrl = labelValue(order.nfcTargetUrl || order.profileUrl, 'No URL');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Production Label ${escapeHtml(label.orderCode)}</title>
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 4in;
      height: 6in;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      background: #ffffff;
    }
    .label {
      width: 4in;
      height: 6in;
      padding: 0.18in;
      display: flex;
      flex-direction: column;
      gap: 0.1in;
      border: 1px solid #d1d5db;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.1in;
      border-bottom: 2px solid #111827;
      padding-bottom: 0.09in;
    }
    .brand {
      font-size: 22px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0;
    }
    .tag {
      margin-top: 4px;
      color: #6b7280;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .priority {
      border: 2px solid #111827;
      padding: 5px 7px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .order {
      font-size: 28px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0;
    }
    .barcode svg {
      display: block;
      width: 100%;
      max-height: 0.72in;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .field {
      min-height: 0.38in;
      border: 1px solid #d1d5db;
      padding: 5px 6px;
    }
    .field.wide {
      grid-column: 1 / -1;
    }
    .labelText {
      display: block;
      color: #6b7280;
      font-size: 8px;
      font-weight: 800;
      line-height: 1.1;
      text-transform: uppercase;
    }
    .value {
      margin-top: 3px;
      font-size: 11px;
      line-height: 1.18;
      font-weight: 800;
      word-break: break-word;
    }
    .bottom {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 1.1in;
      gap: 0.1in;
      align-items: end;
    }
    .checklist {
      border: 1px solid #111827;
      padding: 7px;
      min-height: 1.1in;
      font-size: 10px;
      font-weight: 700;
      line-height: 1.45;
    }
    .qr {
      border: 1px solid #111827;
      padding: 5px;
      text-align: center;
    }
    .qr svg {
      width: 0.95in;
      height: 0.95in;
    }
    .footer {
      color: #6b7280;
      font-size: 8px;
      font-weight: 700;
      text-align: center;
    }
  </style>
</head>
<body>
  <section class="label">
    <div class="top">
      <div>
        <div class="brand">SITEHUB</div>
        <div class="tag">Production handoff label</div>
      </div>
      <div class="priority">${escapeHtml(priority)}</div>
    </div>

    <div class="order">${escapeHtml(label.orderCode)}</div>
    <div class="barcode">${label.barcodeSvg}</div>

    <div class="grid">
      <div class="field wide">
        <span class="labelText">Customer</span>
        <div class="value">${escapeHtml(customer)} - ${escapeHtml(phone)}</div>
      </div>
      <div class="field">
        <span class="labelText">Product</span>
        <div class="value">${escapeHtml(productLabel(order))}</div>
      </div>
      <div class="field">
        <span class="labelText">Quantity / design</span>
        <div class="value">${escapeHtml(order.quantity)} - ${escapeHtml(cardDesignLabel(order))}</div>
      </div>
      <div class="field">
        <span class="labelText">Batch</span>
        <div class="value">${escapeHtml(batch.slice(0, 16))}</div>
      </div>
      <div class="field">
        <span class="labelText">Branch / stage</span>
        <div class="value">${escapeHtml(branch)} - ${escapeHtml(stage)}</div>
      </div>
      <div class="field wide">
        <span class="labelText">NFC target</span>
        <div class="value">${escapeHtml(targetUrl)}</div>
      </div>
      <div class="field wide">
        <span class="labelText">Ship to</span>
        <div class="value">${escapeHtml(address)}</div>
      </div>
    </div>

    <div class="bottom">
      <div>
        <div class="checklist">
          [ ] Print card front/back<br />
          [ ] Encode NFC URL<br />
          [ ] Tap verify<br />
          [ ] QA video recorded<br />
          Passcode: ${escapeHtml(passcode)}
        </div>
      </div>
      <div class="qr">${label.qrSvg}</div>
    </div>
    <div class="footer">Generated ${escapeHtml(formatDate(label.generatedAt))} - scan QR for production receive</div>
  </section>
</body>
</html>`;
}

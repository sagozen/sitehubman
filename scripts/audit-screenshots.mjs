import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:8091';
const OUT_DIR = path.join(ROOT, 'audit', 'screenshots');
const MANIFEST_PATH = path.join(ROOT, 'audit', 'screenshot-manifest.json');
const MANIFESTL_PATH = path.join(ROOT, 'audit', 'screenshot-manifest.jsonl');
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FILTER_VIEWPORT = process.env.AUDIT_VIEWPORT || '';
const FILTER_SECTIONS = new Set(
  (process.env.AUDIT_SECTIONS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);
const SKIP_EXISTING = process.env.AUDIT_SKIP_EXISTING !== '0';

const viewports = [
  { name: 'desktop', width: 1440, height: 1100, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: false },
];

const accounts = {
  sales: { email: 'sales@demo.com', password: 'demo1234' },
  printer: { email: 'printer@demo.com', password: 'demo1234' },
  admin: { email: 'admin@demo.com', password: 'demo1234' },
  qa: { email: 'qa@demo.com', password: 'demo1234' },
  shipping: { email: 'shipping@demo.com', password: 'demo1234' },
  customer: { email: 'customer@demo.com', password: 'demo1234' },
};

const screens = [
  { section: 'auth', name: 'login', path: '/auth/login', auth: null },
  { section: 'auth', name: 'register', path: '/auth/register', auth: null },
  { section: 'guest', name: 'root', path: '/', auth: null },
  { section: 'guest', name: 'scan', path: '/scan', auth: null },
  { section: 'guest', name: 'nfc-demo', path: '/nfc-demo', auth: null },
  { section: 'guest', name: 'guest-design', path: '/guest-design', auth: null },
  { section: 'guest', name: 'guest-choose-card', path: '/guest-choose-card', auth: null },
  { section: 'guest', name: 'guest-checkout', path: '/guest-checkout', auth: null },
  { section: 'guest', name: 'guest-track-order', path: '/guest-track-order', auth: null },
  { section: 'guest', name: 'guest-analytics', path: '/guest-analytics', auth: null },
  { section: 'customer', name: 'home', path: '/', auth: 'customer' },
  { section: 'customer', name: 'orders-attendance', path: '/attendance', auth: 'customer' },
  { section: 'customer', name: 'connections', path: '/connections', auth: 'customer' },
  { section: 'customer', name: 'profile', path: '/profile', auth: 'customer' },
  { section: 'customer', name: 'settings', path: '/settings', auth: 'customer' },
  { section: 'customer', name: 'account-orders', path: '/account/orders', auth: 'customer' },
  { section: 'customer', name: 'activate-card', path: '/activate-card', auth: 'customer' },
  { section: 'customer', name: 'edit-bio', path: '/edit-bio', auth: 'customer' },
  { section: 'customer', name: 'theme-picker', path: '/theme-picker', auth: 'customer' },
  { section: 'customer', name: 'language-picker', path: '/language-picker', auth: 'customer' },
  { section: 'customer', name: 'qr-generator', path: '/qr-generator', auth: 'customer' },
  { section: 'sales', name: 'dashboard', path: '/sales', auth: 'sales' },
  { section: 'sales', name: 'orders', path: '/sales/orders', auth: 'sales' },
  { section: 'sales', name: 'new-order', path: '/sales/new-order', auth: 'sales' },
  { section: 'sales', name: 'root-new-order', path: '/new-order', auth: 'sales' },
  { section: 'sales', name: 'payouts', path: '/sales/payouts', auth: 'sales' },
  { section: 'sales', name: 'notifications', path: '/sales/notifications', auth: 'sales' },
  { section: 'sales', name: 'profile', path: '/sales/me', auth: 'sales' },
  { section: 'sales', name: 'settings', path: '/sales/settings', auth: 'sales' },
  { section: 'printer', name: 'batch-select', path: '/printer/batch-select', auth: 'printer' },
  { section: 'printer', name: 'queue', path: '/printer/queue', auth: 'printer' },
  { section: 'printer', name: 'scan', path: '/printer/scan', auth: 'printer' },
  { section: 'printer', name: 'new-order', path: '/printer/new-order', auth: 'printer' },
  { section: 'printer', name: 'notifications', path: '/printer/notifications', auth: 'printer' },
  { section: 'printer', name: 'wages', path: '/printer/wages', auth: 'printer' },
  { section: 'printer', name: 'profile', path: '/printer/me', auth: 'printer' },
  { section: 'printer', name: 'settings', path: '/printer/settings', auth: 'printer' },
  { section: 'printer', name: 'nfc-job', path: '/printer/nfc/demo-job', auth: 'printer' },
  { section: 'printer', name: 'qa-job', path: '/printer/qa/demo-job', auth: 'printer' },
  { section: 'printer', name: 'scan-test-job', path: '/printer/scan-test/demo-job', auth: 'printer' },
  { section: 'admin', name: 'dashboard', path: '/admin', auth: 'admin' },
  { section: 'admin', name: 'users', path: '/admin/users', auth: 'admin' },
  { section: 'admin', name: 'orders', path: '/admin/orders', auth: 'admin' },
  { section: 'admin', name: 'batches', path: '/admin/batches', auth: 'admin' },
  { section: 'admin', name: 'finance', path: '/admin/finance', auth: 'admin' },
  { section: 'admin', name: 'salary', path: '/admin/salary', auth: 'admin' },
  { section: 'admin', name: 'reprints', path: '/admin/reprints', auth: 'admin' },
  { section: 'admin', name: 'reports', path: '/admin/reports', auth: 'admin' },
  { section: 'admin', name: 'products', path: '/admin/products', auth: 'admin' },
  { section: 'admin', name: 'labels', path: '/admin/labels', auth: 'admin' },
  { section: 'admin', name: 'printer-health', path: '/admin/printer-health', auth: 'admin' },
  { section: 'admin', name: 'qa-videos', path: '/admin/qa-videos', auth: 'admin' },
  { section: 'admin', name: 'qr-codes', path: '/admin/qr-codes', auth: 'admin' },
  { section: 'admin', name: 'nfc-logs', path: '/admin/nfc-logs', auth: 'admin' },
  { section: 'admin', name: 'audit-logs', path: '/admin/audit-logs', auth: 'admin' },
  { section: 'admin', name: 'settings', path: '/admin/settings', auth: 'admin' },
  { section: 'qa', name: 'queue', path: '/qa', auth: 'qa' },
  { section: 'shipping', name: 'queue', path: '/shipping', auth: 'shipping' },
  { section: 'orders', name: 'detail-missing', path: '/order-detail/demo-order', auth: 'sales' },
  { section: 'orders', name: 'receipt-missing', path: '/order-receipt/demo-order', auth: 'sales' },
  { section: 'production', name: 'label-missing', path: '/production-label/demo-order', auth: 'printer' },
  { section: 'payments', name: 'checkout-missing', path: '/checkout/demo-card', auth: 'customer' },
  { section: 'payments', name: 'payment-intent-missing', path: '/payment/demo-intent', auth: 'customer' },
  { section: 'public', name: 'public-slug-missing', path: '/public/demo-profile', auth: null },
  { section: 'public', name: 'p-slug-missing', path: '/p/demo-profile', auth: null },
  { section: 'public', name: 'c-card-missing', path: '/c/demo-card', auth: null },
  { section: 'public', name: 'card-preview-missing', path: '/card-preview/demo-card', auth: null },
  { section: 'utility', name: 'privacy-policy', path: '/privacy-policy', auth: null },
  { section: 'utility', name: 'terms-of-service', path: '/terms-of-service', auth: null },
  { section: 'utility', name: 'icon-preview', path: '/icon-preview', auth: null },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitize(value) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function waitForSettled(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => undefined);
  await page.waitForLoadState('load', { timeout: 8_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

async function dismissDialogs(page) {
  page.on('dialog', async (dialog) => {
    await dialog.dismiss().catch(() => undefined);
  });
}

async function fillLogin(page, email, password) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'commit', timeout: 20_000 });
  await waitForSettled(page);
  const emailInput = page.getByPlaceholder('Email').first();
  const passwordInput = page.getByPlaceholder('Password').first();
  await emailInput.fill(email, { timeout: 20_000 });
  await passwordInput.fill(password, { timeout: 20_000 });
  const signIn = page.getByRole('button', { name: /^Sign In$/i }).first();
  await signIn.click({ timeout: 20_000 });
  await page.waitForTimeout(3_000);
  await waitForSettled(page);
}

async function contextFor(browser, role, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
  });
  const page = await context.newPage();
  await dismissDialogs(page);
  if (role && accounts[role]) {
    await fillLogin(page, accounts[role].email, accounts[role].password);
  }
  return { context, page };
}

async function captureMetrics(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || '';
    const buttons = Array.from(document.querySelectorAll('[role="button"], button'));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const links = Array.from(document.querySelectorAll('a'));
    const all = Array.from(document.querySelectorAll('body *'));
    const visible = all.filter((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    const styleValues = visible.slice(0, 800).map((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
      };
    });
    return {
      title: document.title,
      url: location.href,
      bodyTextStart: text.slice(0, 1500),
      textLength: text.length,
      buttonCount: buttons.length,
      inputCount: inputs.length,
      linkCount: links.length,
      visibleNodeCount: visible.length,
      buttonLabels: buttons.map((el) => (el.textContent || el.getAttribute('aria-label') || '').trim()).filter(Boolean).slice(0, 30),
      fontSizes: [...new Set(styleValues.map((v) => v.fontSize).filter(Boolean))].slice(0, 40),
      fontWeights: [...new Set(styleValues.map((v) => v.fontWeight).filter(Boolean))].slice(0, 20),
      colors: [...new Set(styleValues.map((v) => v.color).filter(Boolean))].slice(0, 40),
      backgroundColors: [...new Set(styleValues.map((v) => v.backgroundColor).filter(Boolean))].slice(0, 40),
      radii: [...new Set(styleValues.map((v) => v.borderRadius).filter((v) => v && v !== '0px'))].slice(0, 30),
      shadows: [...new Set(styleValues.map((v) => v.boxShadow).filter((v) => v && v !== 'none'))].slice(0, 30),
    };
  }).catch((error) => ({ error: error.message }));
}

async function main() {
  ensureDir(OUT_DIR);
  const activeViewports = FILTER_VIEWPORT
    ? viewports.filter((viewport) => viewport.name === FILTER_VIEWPORT)
    : viewports;
  const activeScreens = FILTER_SECTIONS.size
    ? screens.filter((screen) => FILTER_SECTIONS.has(screen.section))
    : screens;
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
  });

  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : [];
  const roles = [...new Set(activeScreens.map((screen) => screen.auth).filter(Boolean))];

  for (const viewport of activeViewports) {
    const contexts = new Map();
    try {
      contexts.set('public', await contextFor(browser, null, viewport));
      for (const role of roles) {
        try {
          contexts.set(role, await contextFor(browser, role, viewport));
        } catch (error) {
          contexts.set(role, { error: error.message });
        }
      }

      for (const screen of activeScreens) {
        const contextKey = screen.auth || 'public';
        const session = contexts.get(contextKey);
        const screenDir = path.join(OUT_DIR, sanitize(screen.section), sanitize(screen.name));
        ensureDir(screenDir);
        const screenshotPath = path.join(screenDir, `${viewport.name}.png`);
        const record = {
          section: screen.section,
          name: screen.name,
          path: screen.path,
          auth: screen.auth,
          viewport: viewport.name,
          screenshot: path.relative(path.join(ROOT, 'audit'), screenshotPath).replace(/\\/g, '/'),
          capturedAt: new Date().toISOString(),
        };

        if (SKIP_EXISTING && fs.existsSync(screenshotPath)) {
          record.status = 'existing';
          manifest.push(record);
          fs.appendFileSync(MANIFESTL_PATH, `${JSON.stringify(record)}\n`);
          continue;
        }

        if (!session || session.error) {
          record.status = 'auth-session-failed';
          record.error = session?.error || 'Missing session';
          manifest.push(record);
          fs.appendFileSync(MANIFESTL_PATH, `${JSON.stringify(record)}\n`);
          fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
          continue;
        }

        const page = session.page;
        try {
          await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'commit', timeout: 20_000 });
          await waitForSettled(page);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          record.status = 'captured';
          record.finalUrl = page.url();
          record.metrics = await captureMetrics(page);
        } catch (error) {
          record.status = 'capture-failed';
          record.error = error.message;
          try {
            await page.screenshot({ path: screenshotPath, fullPage: true });
            record.partialScreenshot = true;
            record.metrics = await captureMetrics(page);
          } catch {
            // Ignore failed fallback screenshot.
          }
        }
        manifest.push(record);
        fs.appendFileSync(MANIFESTL_PATH, `${JSON.stringify(record)}\n`);
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
      }
    } finally {
      for (const session of contexts.values()) {
        await session?.context?.close?.().catch(() => undefined);
      }
    }
  }

  await browser.close();
  ensureDir(path.dirname(MANIFEST_PATH));
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  const failed = manifest.filter((item) => item.status !== 'captured');
  console.log(`Captured ${manifest.length - failed.length}/${manifest.length} screenshots.`);
  if (failed.length) {
    console.log(`Failures: ${failed.length}`);
    for (const item of failed.slice(0, 20)) {
      console.log(`- ${item.viewport} ${item.section}/${item.name}: ${item.status} ${item.error || ''}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
